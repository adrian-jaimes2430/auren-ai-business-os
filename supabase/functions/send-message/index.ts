// AUREN AI — Outbound message sender
// Sends a message via the conversation's connected channel (e.g. WhatsApp Cloud API)
// and persists it as an outbound message. Falls back to "internal-only" send when
// the channel is not externally configured (useful for webchat/test).
// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sendWhatsApp(opts: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
}) {
  const url = `https://graph.facebook.com/v20.0/${opts.phoneNumberId}/messages`;
  const res = await fetch(url, {
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
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`WhatsApp API ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth: validate the caller is authenticated
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json(401, { error: "No autenticado" });
    const userId = userData.user.id;

    const { conversation_id, content, ai = false } = await req.json();
    if (!conversation_id || !content?.trim()) {
      return json(400, { error: "Faltan parámetros" });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Load conversation + ensure user belongs to its org
    const { data: conv, error: cErr } = await admin
      .from("conversations")
      .select("id, organization_id, contact_id, channel, channel_id")
      .eq("id", conversation_id)
      .single();
    if (cErr || !conv) return json(404, { error: "Conversación no encontrada" });

    const { data: membership } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", conv.organization_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!membership) return json(403, { error: "Sin acceso" });

    let externalDelivery: any = null;
    let deliveryError: string | null = null;

    // Attempt external delivery for WhatsApp if a channel is configured
    if (conv.channel === "whatsapp" && conv.channel_id) {
      const { data: channel } = await admin
        .from("channels")
        .select("access_token, config, is_active")
        .eq("id", conv.channel_id)
        .maybeSingle();
      const phoneNumberId = (channel?.config as any)?.phone_number_id;
      // Fallback: some channels were created storing the phone number id in external_id
      const { data: chMeta } = phoneNumberId ? { data: null } : await admin
        .from("channels").select("external_id").eq("id", conv.channel_id).maybeSingle();
      const effectivePhoneNumberId = phoneNumberId || (chMeta as any)?.external_id;
      if (channel?.is_active && channel.access_token && phoneNumberId && conv.contact_id) {
        const { data: contact } = await admin
          .from("contacts")
          .select("phone, external_id")
          .eq("id", conv.contact_id)
          .maybeSingle();
        const to = contact?.external_id || contact?.phone?.replace(/\D/g, "");
        if (to) {
          try {
            externalDelivery = await sendWhatsApp({
              phoneNumberId,
              accessToken: channel.access_token,
              to,
              text: content,
            });
          } catch (e: any) {
            deliveryError = e?.message ?? String(e);
            console.error("WhatsApp send failed:", deliveryError);
          }
        } else {
          deliveryError = "Contacto sin teléfono";
        }
      }
    }

    // Persist message
    const { data: message, error: mErr } = await admin
      .from("messages")
      .insert({
        organization_id: conv.organization_id,
        conversation_id: conv.id,
        content: content.trim(),
        direction: "outbound",
        sender_user_id: ai ? null : userId,
        is_ai: !!ai,
        metadata: {
          delivery: externalDelivery ? "sent" : deliveryError ? "failed" : "local",
          provider_response: externalDelivery,
          error: deliveryError,
        },
      })
      .select()
      .single();
    if (mErr) return json(500, { error: mErr.message });

    return json(200, { message, delivery_error: deliveryError });
  } catch (e: any) {
    console.error("send-message error:", e);
    return json(500, { error: e?.message ?? "Error inesperado" });
  }
});
