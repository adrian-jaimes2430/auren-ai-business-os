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
          .select("id, organization_id, provider, is_active")
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
                      source: "whatsapp",
                    })
                    .select("id")
                    .single();
                  contactId = newContact?.id;
                }

                // Find/create open conversation for this contact+channel
                const { data: existingConv } = await supabaseAdmin
                  .from("conversations")
                  .select("id")
                  .eq("organization_id", channel.organization_id)
                  .eq("contact_id", contactId!)
                  .eq("channel", "whatsapp")
                  .order("created_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();

                let convId = existingConv?.id;
                if (!convId) {
                  const { data: newConv } = await supabaseAdmin
                    .from("conversations")
                    .insert({
                      organization_id: channel.organization_id,
                      contact_id: contactId!,
                      channel: "whatsapp",
                      status: "open",
                      subject: profileName,
                    })
                    .select("id")
                    .single();
                  convId = newConv?.id;
                }

                if (convId) {
                  await supabaseAdmin.from("messages").insert({
                    organization_id: channel.organization_id,
                    conversation_id: convId,
                    direction: "inbound",
                    content: text,
                    metadata: { wa_message_id: msg.id, type: msg.type, raw: msg },
                  });
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
