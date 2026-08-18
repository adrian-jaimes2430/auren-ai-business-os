import { createFileRoute } from "@tanstack/react-router";

// Meta "Data Deletion Request URL". Debe responder JSON con url + confirmation_code.
export const Route = createFileRoute("/api/public/meta/data-deletion")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          url: "https://aurenos.app/privacy",
          confirmation_code: `auren-${Date.now()}`,
        }),
      POST: async ({ request }) => {
        let userId: string | null = null;
        try {
          const params = new URLSearchParams(await request.text());
          const payload = (params.get("signed_request") ?? "").split(".")[1];
          if (payload) {
            const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
            userId = json?.user_id ?? null;
          }
        } catch (err) {
          console.error("[meta-data-deletion] parse", err);
        }

        const code = `auren-${userId ?? "anon"}-${Date.now()}`;

        try {
          if (userId) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            // Revocamos credenciales de Meta asociadas a esa cuenta.
            await supabaseAdmin
              .from("channels")
              .update({
                access_token: null,
                is_active: false,
                verification_status: "pending",
                verification_error: "Datos de Meta eliminados por solicitud del usuario",
              })
              .eq("meta_business_id", userId);
          }
        } catch (err) {
          console.error("[meta-data-deletion]", err);
        }

        return Response.json({
          url: `https://aurenos.app/privacy?deletion=${encodeURIComponent(code)}`,
          confirmation_code: code,
        });
      },
    },
  },
});
