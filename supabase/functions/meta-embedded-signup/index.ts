// AUREN AI — Meta Embedded Signup callback
// Receives the auth code returned by Facebook Login + WhatsApp Embedded Signup,
// exchanges it for a business-system-user access token, lists the WABA phone numbers
// the user authorized, and creates a `channels` row per number (idempotent).
// Requires the following SECRETS (set in Lovable Cloud → Secrets):
//   META_APP_ID, META_APP_SECRET
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const META_APP_ID = Deno.env.get("META_APP_ID");
    const META_APP_SECRET = Deno.env.get("META_APP_SECRET");

    if (!META_APP_ID || !META_APP_SECRET) {
      return json(500, {
        error: "Faltan los secretos META_APP_ID y META_APP_SECRET en el backend.",
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json(401, { error: "No autenticado" });

    const { organization_id, code } = await req.json();
    if (!organization_id || !code) return json(400, { error: "Faltan parámetros" });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: membership } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organization_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return json(403, { error: "Sin permisos en esta organización" });
    }

    // 1) Exchange the short-lived code for an access token (business system user)
    const tokenUrl = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", META_APP_ID);
    tokenUrl.searchParams.set("client_secret", META_APP_SECRET);
    tokenUrl.searchParams.set("code", code);
    const tokenRes = await fetch(tokenUrl.toString());
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      return json(400, { error: tokenJson?.error?.message ?? "No se pudo obtener token de Meta", raw: tokenJson });
    }
    const accessToken: string = tokenJson.access_token;

    // 2) Discover business + WABAs + phone numbers the user authorized
    const debugRes = await fetch(
      `https://graph.facebook.com/v20.0/debug_token?input_token=${accessToken}&access_token=${META_APP_ID}|${META_APP_SECRET}`,
    );
    const debugJson = await debugRes.json();
    const granular = debugJson?.data?.granular_scopes ?? [];
    const wabaIds: string[] = [
      ...new Set(
        granular
          .filter((g: any) => g.scope === "whatsapp_business_management" || g.scope === "whatsapp_business_messaging")
          .flatMap((g: any) => g.target_ids ?? []),
      ),
    ];

    const created: any[] = [];
    for (const wabaId of wabaIds) {
      const phonesRes = await fetch(
        `https://graph.facebook.com/v20.0/${wabaId}/phone_numbers?access_token=${accessToken}`,
      );
      const phonesJson = await phonesRes.json();
      const phones = phonesJson?.data ?? [];
      for (const phone of phones) {
        // Subscribe app to WABA (idempotent)
        await fetch(
          `https://graph.facebook.com/v20.0/${wabaId}/subscribed_apps?access_token=${accessToken}`,
          { method: "POST" },
        ).catch(() => null);

        // Upsert channel by external_id
        const { data: existing } = await admin
          .from("channels")
          .select("id")
          .eq("organization_id", organization_id)
          .eq("provider", "whatsapp")
          .eq("external_id", phone.id)
          .maybeSingle();

        const payload = {
          organization_id,
          provider: "whatsapp" as const,
          name: phone.verified_name || phone.display_phone_number || "WhatsApp",
          external_id: phone.id,
          access_token: accessToken,
          is_active: true,
          verification_status: "verified",
          verified_at: new Date().toISOString(),
          verification_error: null,
          meta_app_id: META_APP_ID,
          meta_waba_id: wabaId,
          config: {
            phone_number_id: phone.id,
            display_phone_number: phone.display_phone_number,
            verified_name: phone.verified_name,
            quality_rating: phone.quality_rating,
            connected_via: "embedded_signup",
          },
        };

        if (existing) {
          await admin.from("channels").update(payload).eq("id", existing.id);
          created.push({ id: existing.id, ...payload });
        } else {
          const { data: ins } = await admin.from("channels").insert(payload).select().single();
          if (ins) created.push(ins);
        }
      }
    }

    return json(200, { ok: true, channels: created, count: created.length });
  } catch (e: any) {
    console.error("meta-embedded-signup error:", e);
    return json(500, { error: e?.message ?? "Error inesperado" });
  }
});
