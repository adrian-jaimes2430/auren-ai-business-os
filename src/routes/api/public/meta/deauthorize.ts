import { createFileRoute } from "@tanstack/react-router";

// Meta "Deauthorize callback URL": Meta nos avisa cuando un usuario retira el
// permiso a la app. Marcamos los canales de esa cuenta como no verificados.
export const Route = createFileRoute("/api/public/meta/deauthorize")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true }),
      POST: async ({ request }) => {
        try {
          const raw = await request.text();
          const params = new URLSearchParams(raw);
          const signed = params.get("signed_request") ?? "";
          const payload = signed.split(".")[1];
          let userId: string | null = null;
          if (payload) {
            const json = JSON.parse(
              atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
            );
            userId = json?.user_id ?? null;
          }

          if (userId) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin
              .from("channels")
              .update({
                is_active: false,
                verification_status: "failed",
                verification_error: "El usuario retiró el permiso de la app de Meta",
              })
              .eq("meta_business_id", userId);
          }
          return Response.json({ ok: true });
        } catch (err) {
          console.error("[meta-deauthorize]", err);
          return Response.json({ ok: true });
        }
      },
    },
  },
});
