import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// WhatsApp Cloud API webhook (Meta) per organization+channel
// GET  → verification handshake (hub.challenge)
// POST → incoming messages / status events
export const Route = createFileRoute("/api/public/webhooks/whatsapp/$orgId/$channelId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        const { data: channel } = await supabaseAdmin
          .from("channels")
          .select("verify_token, organization_id")
          .eq("id", params.channelId)
          .eq("organization_id", params.orgId)
          .maybeSingle();

        if (!channel || mode !== "subscribe" || token !== channel.verify_token) {
          return new Response("Forbidden", { status: 403 });
        }
        return new Response(challenge ?? "", { status: 200 });
      },

      POST: async ({ request, params }) => {
        const body = await request.json().catch(() => null);
        if (!body) return new Response("Bad request", { status: 400 });

        const { data: channel } = await supabaseAdmin
          .from("channels")
          .select("id, organization_id, provider, is_active, access_token, config, external_id")
          .eq("id", params.channelId)
          .eq("organization_id", params.orgId)
          .maybeSingle();

        if (!channel || !channel.is_active) return new Response("OK", { status: 200 });

        try {
          const entries = Array.isArray(body.entry) ? body.entry : [];
          for (const entry of entries) {
            const changes = Array.isArray(entry.changes) ? entry.changes : [];
            for (const change of changes) {
              const value = change.value ?? {};
              const messages = Array.isArray(value.messages) ? value.messages : [];
              const contacts = Array.isArray(value.contacts) ? value.contacts : [];

              for (const msg of messages) {
                const fromWa = String(msg.from || "");
                const text =
                  msg.text?.body ||
                  msg.button?.text ||
                  msg.interactive?.button_reply?.title ||
                  msg.interactive?.list_reply?.title ||
                  `[${msg.type ?? "evento"}]`;

                const profileName = contacts.find((c: any) => c.wa_id === fromWa)?.profile?.name ?? fromWa;

                // Upsert contact (by phone within org)
                const { data: existingContact } = await supabaseAdmin
                  .from("contacts")
                  .select("id")
                  .eq("organization_id", channel.organization_id)
                  .eq("phone", fromWa)
                  .maybeSingle();

                let contactId = existingContact?.id;
                if (!contactId) {
                  const { data: newContact } = await supabaseAdmin
                    .from("contacts")
                    .insert({
                      organization_id: channel.organization_id,
                      full_name: profileName,
                      phone: fromWa,
                      external_id: fromWa,
                      source: "whatsapp",
                    })
                    .select("id")
                    .single();
                  contactId = newContact?.id;
                } else {
                  await supabaseAdmin
                    .from("contacts")
                    .update({ external_id: fromWa })
                    .eq("id", contactId)
                    .is("external_id", null);
                }

                // Find/create open conversation for this contact+channel
                const { data: existingConv } = await supabaseAdmin
                  .from("conversations")
                  .select("id, ai_autoreply")
                  .eq("organization_id", channel.organization_id)
                  .eq("contact_id", contactId!)
                  .eq("channel", "whatsapp")
                  .order("created_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();

                let convId = existingConv?.id;
                let autoReply = existingConv?.ai_autoreply ?? false;
                if (!convId) {
                  const { data: newConv } = await supabaseAdmin
                    .from("conversations")
                    .insert({
                      organization_id: channel.organization_id,
                      contact_id: contactId!,
                      channel: "whatsapp",
                      channel_id: channel.id,
                      status: "open",
                      subject: profileName,
                    })
                    .select("id, ai_autoreply")
                    .single();
                  convId = newConv?.id;
                  autoReply = newConv?.ai_autoreply ?? false;
                }

                if (convId) {
                  await supabaseAdmin.from("messages").insert({
                    organization_id: channel.organization_id,
                    conversation_id: convId,
                    direction: "inbound",
                    content: text,
                    metadata: { wa_message_id: msg.id, type: msg.type, raw: msg },
                  });

                  // AI auto-reply if enabled
                  if (autoReply) {
                    await runAiAutoReply({
                      orgId: channel.organization_id,
                      conversationId: convId,
                      channel,
                      to: fromWa,
                      latestText: text,
                    });
                  }
                }
              }
            }
          }

          await supabaseAdmin
            .from("channels")
            .update({ last_event_at: new Date().toISOString() })
            .eq("id", channel.id);

          return Response.json({ ok: true });
        } catch (err) {
          console.error("[wa-webhook]", err);
          return new Response("OK", { status: 200 }); // Always 200 so Meta doesn't retry-storm
        }
      },
    },
  },
});

async function runAiAutoReply(opts: {
  orgId: string;
  conversationId: string;
  channel: { id: string; access_token: string | null; config: any; external_id: string | null };
  to: string;
  latestText: string;
}) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.error("[wa-autoreply] LOVABLE_API_KEY missing");
    return;
  }
  try {
    const { data: history } = await supabaseAdmin
      .from("messages")
      .select("direction, content, is_ai")
      .eq("conversation_id", opts.conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    const chatMessages = (history ?? []).map((m) => ({
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.content,
    }));

    // Load active knowledge for grounding
    const { data: kbAll } = await supabaseAdmin
      .from("knowledge_articles")
      .select("id, title, content, category, tags, use_count")
      .eq("organization_id", opts.orgId)
      .eq("is_active", true)
      .limit(50);

    const term = opts.latestText.toLowerCase();
    const scored = (kbAll ?? [])
      .map((k) => {
        const hay = `${k.title} ${k.content} ${(k.tags ?? []).join(" ")}`.toLowerCase();
        const score = term
          .split(/\s+/)
          .filter((w) => w.length > 3)
          .reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
        return { ...k, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const used = scored.filter((s) => s.score > 0);
    for (const k of used) {
      try {
        await supabaseAdmin
          .from("knowledge_articles")
          .update({ use_count: (k.use_count ?? 0) + 1 })
          .eq("id", k.id);
      } catch {}
    }

    const kbContext = scored.length
      ? "\n\nINFORMACIÓN OFICIAL DE LA EMPRESA (úsala como única fuente de verdad):\n" +
        scored.map((k, i) => `[${i + 1}] ${k.title}\n${k.content}`).join("\n\n")
      : "";

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Eres un agente de atención al cliente de la marca. Responde en el mismo idioma del cliente, de forma breve, profesional y cercana. Basa tus respuestas EXCLUSIVAMENTE en la información oficial proporcionada más abajo. Nunca inventes datos. Si la información no está disponible, dilo claramente y ofrece pasar la conversación a un humano." +
              kbContext,
          },
          ...chatMessages,
        ],
      }),
    });
    if (!aiRes.ok) {
      console.error("[wa-autoreply] gateway", aiRes.status, await aiRes.text());
      return;
    }
    const aiJson = await aiRes.json();
    const reply: string = aiJson?.choices?.[0]?.message?.content?.trim();
    if (!reply) return;

    const phoneNumberId = opts.channel.config?.phone_number_id;
    let delivery: any = null;
    let deliveryError: string | null = null;
    if (opts.channel.access_token && phoneNumberId) {
      const sendRes = await fetch(
        `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${opts.channel.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: opts.to,
            type: "text",
            text: { body: reply },
          }),
        },
      );
      delivery = await sendRes.json().catch(() => ({}));
      if (!sendRes.ok) deliveryError = `WA ${sendRes.status}`;
    } else {
      deliveryError = "Canal sin credenciales (mensaje guardado localmente)";
    }

    await supabaseAdmin.from("messages").insert({
      organization_id: opts.orgId,
      conversation_id: opts.conversationId,
      direction: "outbound",
      content: reply,
      is_ai: true,
      metadata: {
        delivery: deliveryError ? "failed" : "sent",
        provider_response: delivery,
        error: deliveryError,
      },
    });
  } catch (err) {
    console.error("[wa-autoreply]", err);
  }
}
