// AUREN AI — Chat assistant (streaming via Lovable AI Gateway)
// deno-lint-ignore-file no-explicit-any

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Eres AUREN, el asistente de IA del sistema operativo comercial AUREN AI.
Tu rol es ayudar a equipos de ventas, marketing y soporte a:
- Calificar leads y sugerir próximos pasos
- Redactar mensajes de WhatsApp, email e Instagram en tono profesional y cercano
- Resumir conversaciones y proponer respuestas
- Crear plantillas de seguimiento, propuestas comerciales y discursos de cierre
- Analizar el pipeline de ventas y sugerir mejoras

Responde siempre en el idioma del usuario. Sé claro, breve y orientado a acción.
Usa Markdown (listas, encabezados cortos y **negritas**) para estructurar tus respuestas.
Cuando propongas un mensaje listo para enviar, presentalo en un bloque claramente identificable.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, model } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY no configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages debe ser un array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model ?? "google/gemini-3-flash-preview",
        stream: true,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en un momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "Sin créditos disponibles. Añade saldo en Lovable Cloud > Workspace > Usage.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del proveedor de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: any) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e?.message ?? "Error inesperado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
