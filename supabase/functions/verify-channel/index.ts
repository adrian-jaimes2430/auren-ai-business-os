// AUREN AI — Verify channel credentials against Meta Graph API
// Calls the provider to confirm the access_token + external_id (phone_number_id / page_id)
// are real and have the right permissions, then updates channel.verification_status.
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

async function verifyWhatsApp(accessToken: string, phoneNumberId: string) {
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}?fields=verified_name,display_phone_number,quality_rating,code_verification_status`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.error?.error_user_msg ||
      `HTTP ${res.status}`;
    return { ok: false as const, error: msg, raw: data };
  }
  return { ok: true as const, info: data };
}

async function verifyMeta(accessToken: string, pageOrIgId: string, kind: "instagram" | "messenger") {
  // For pages/IG: GET /{id}?fields=name,username
  const fields = kind === "instagram" ? "username,name,profile_picture_url" : "name,category";
  const url = `https://graph.facebook.com/v20.0/${pageOrIgId}?fields=${fields}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false as const, error: data?.error?.message || `HTTP ${res.status}`, raw: data };
  }
  return { ok: true as const, info: data };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json(401, { error: "No autenticado" });

    const { channel_id } = await req.json();
    if (!channel_id) return json(400, { error: "Falta channel_id" });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: channel } = await admin
      .from("channels")
      .select("id, organization_id, provider, access_token, external_id, config")
      .eq("id", channel_id)
      .maybeSingle();
    if (!channel) return json(404, { error: "Canal no encontrado" });

    // org membership check
    const { data: membership } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", channel.organization_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!membership) return json(403, { error: "Sin acceso a este canal" });

    await admin.from("channels").update({ verification_status: "verifying" }).eq("id", channel.id);

    if (!channel.access_token) {
      const err = "Falta access_token";
      await admin.from("channels").update({
        verification_status: "failed",
        verification_error: err,
        verified_at: new Date().toISOString(),
      }).eq("id", channel.id);
      return json(200, { ok: false, error: err });
    }

    let result: { ok: boolean; error?: string; info?: any };

    if (channel.provider === "whatsapp") {
      const phoneNumberId = (channel.config as any)?.phone_number_id || channel.external_id;
      if (!phoneNumberId) {
        result = { ok: false, error: "Falta phone_number_id" };
      } else {
        result = await verifyWhatsApp(channel.access_token, phoneNumberId);
      }
    } else if (channel.provider === "instagram" || channel.provider === "messenger") {
      if (!channel.external_id) {
        result = { ok: false, error: `Falta ${channel.provider === "instagram" ? "IG account ID" : "Page ID"}` };
      } else {
        result = await verifyMeta(channel.access_token, channel.external_id, channel.provider as any);
      }
    } else {
      result = { ok: true, info: { note: "Proveedor sin verificación remota disponible" } };
    }

    await admin.from("channels").update({
      verification_status: result.ok ? "verified" : "failed",
      verification_error: result.ok ? null : (result.error ?? "Error desconocido"),
      verified_at: new Date().toISOString(),
      config: {
        ...(channel.config as any || {}),
        verified_info: result.ok ? result.info : undefined,
      },
    }).eq("id", channel.id);

    return json(200, result);
  } catch (e: any) {
    console.error("verify-channel error:", e);
    return json(500, { error: e?.message ?? "Error inesperado" });
  }
});
