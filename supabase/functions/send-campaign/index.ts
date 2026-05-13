// AUREN AI — Marketing campaign sender
// Resolves audience, fans out to contacts, sends via WhatsApp / logs locally.
// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function render(template: string, vars: Record<string, any>) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = key.split(".").reduce((acc: any, k: string) => acc?.[k], vars);
    return v == null ? "" : String(v);
  });
}

async function sendWhatsApp(opts: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
}) {
  const res = await fetch(
    `https://graph.facebook.com/v20.0/${opts.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: opts.to,
        type: "text",
        text: { body: opts.text },
      }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`WA ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u.user) return json(401, { error: "No autenticado" });

    const { campaign_id } = await req.json();
    if (!campaign_id) return json(400, { error: "campaign_id requerido" });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: campaign, error: cErr } = await admin
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();
    if (cErr || !campaign) return json(404, { error: "Campaña no encontrada" });

    // Permission check
    const { data: m } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", campaign.organization_id)
      .eq("user_id", u.user.id)
      .maybeSingle();
    if (!m || !["owner", "admin", "supervisor"].includes(m.role)) {
      return json(403, { error: "Sin permisos" });
    }

    if (campaign.status === "running" || campaign.status === "completed") {
      return json(409, { error: `Campaña ya ${campaign.status}` });
    }

    // Resolve audience
    const filter = (campaign.audience_filter ?? {}) as any;
    let q = admin.from("contacts").select("id, full_name, email, phone, external_id, tags")
      .eq("organization_id", campaign.organization_id);
    if (Array.isArray(filter.tags) && filter.tags.length) {
      q = q.overlaps("tags", filter.tags);
    }
    if (campaign.channel === "whatsapp") q = q.not("phone", "is", null);
    if (campaign.channel === "email") q = q.not("email", "is", null);
    const { data: contacts, error: aErr } = await q;
    if (aErr) return json(500, { error: aErr.message });

    const list = contacts ?? [];
    await admin.from("campaigns").update({
      status: "running",
      started_at: new Date().toISOString(),
      total_count: list.length,
      sent_count: 0,
      failed_count: 0,
    }).eq("id", campaign.id);

    // Channel credentials (WhatsApp only for now)
    let waCreds: { token: string; phoneNumberId: string } | null = null;
    if (campaign.channel === "whatsapp" && campaign.channel_id) {
      const { data: ch } = await admin
        .from("channels")
        .select("access_token, config, is_active, external_id")
        .eq("id", campaign.channel_id)
        .maybeSingle();
      const phoneNumberId = (ch?.config as any)?.phone_number_id || ch?.external_id;
      if (ch?.is_active && ch.access_token && phoneNumberId) {
        waCreds = { token: ch.access_token, phoneNumberId };
      }
    }

    let sent = 0;
    let failed = 0;

    for (const contact of list) {
      const text = render(campaign.body, {
        first_name: (contact.full_name ?? "").split(" ")[0],
        full_name: contact.full_name,
        email: contact.email,
        phone: contact.phone,
      });

      const { data: recip } = await admin
        .from("campaign_recipients")
        .insert({
          campaign_id: campaign.id,
          organization_id: campaign.organization_id,
          contact_id: contact.id,
          status: "pending",
        })
        .select()
        .single();

      try {
        if (campaign.channel === "whatsapp" && waCreds) {
          const to = (contact.external_id || contact.phone || "").replace(/\D/g, "");
          if (!to) throw new Error("Contacto sin teléfono");
          await sendWhatsApp({
            phoneNumberId: waCreds.phoneNumberId,
            accessToken: waCreds.token,
            to,
            text,
          });
        }
        // Note: for email/other channels, we just log locally (no provider yet)

        // Find or create conversation, then insert message
        const { data: existingConv } = await admin
          .from("conversations")
          .select("id")
          .eq("organization_id", campaign.organization_id)
          .eq("contact_id", contact.id)
          .eq("channel", campaign.channel)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        let convId = existingConv?.id;
        if (!convId) {
          const { data: nc } = await admin
            .from("conversations")
            .insert({
              organization_id: campaign.organization_id,
              contact_id: contact.id,
              channel: campaign.channel,
              channel_id: campaign.channel_id,
              status: "open",
              subject: `Campaña: ${campaign.name}`,
            })
            .select("id")
            .single();
          convId = nc?.id;
        }
        if (convId) {
          await admin.from("messages").insert({
            organization_id: campaign.organization_id,
            conversation_id: convId,
            direction: "outbound",
            content: text,
            metadata: { campaign_id: campaign.id, channel: campaign.channel },
          });
        }

        sent++;
        if (recip) {
          await admin.from("campaign_recipients")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", recip.id);
        }
      } catch (e: any) {
        failed++;
        if (recip) {
          await admin.from("campaign_recipients")
            .update({ status: "failed", error: e?.message ?? String(e) })
            .eq("id", recip.id);
        }
      }
    }

    await admin.from("campaigns").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      sent_count: sent,
      failed_count: failed,
    }).eq("id", campaign.id);

    return json(200, { ok: true, sent, failed, total: list.length });
  } catch (e: any) {
    console.error("send-campaign error:", e);
    return json(500, { error: e?.message ?? "Error inesperado" });
  }
});
