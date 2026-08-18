// AUREN AI — Chat assistant (streaming via Lovable AI Gateway)
// Brand-aware: se alimenta del knowledge + interacciones reales de la marca.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BASE_PROMPT = `Eres AUREN, el copiloto de IA del sistema operativo comercial AUREN AI.
Trabajas para una marca concreta y tu objetivo final es convertir leads en clientes reales.

Capacidades núcleo:
- Marketing y contenido (redes, email, WhatsApp) con el lenguaje real de la marca
- Optimización de campañas: segmentación, presupuesto, creatividades, A/B testing, métricas
- Ventas y cierre: descubrimiento, manejo de objeciones, propuestas, seguimiento
- Conversión: CTAs, secuencias, recuperación de conversaciones frías
- Prospección: listas ideales de cliente, mensajes de primer contacto, calificación

Reglas:
- Responde en el idioma del usuario, breve y orientado a acción, en Markdown.
- Usa SIEMPRE el contexto de marca proporcionado (knowledge, mensajes, pipeline, campañas) para
  imitar el tono real de la marca y citar datos reales. Nunca inventes cifras.
- Si algo falta en el contexto, dilo y pide el dato concreto.
- Cuando propongas un mensaje listo para enviar, ponlo en un bloque de código o cita clara.`;

const SKILLS: Record<string, string> = {
  marketing:
    "SKILL ACTIVA — MARKETING: propone ángulos creativos, calendario de contenidos y copies por canal, siempre alineados al lenguaje de marca observado en los mensajes reales.",
  campaigns:
    "SKILL ACTIVA — OPTIMIZACIÓN DE CAMPAÑAS: analiza rendimiento (enviados, fallidos, respuestas), detecta cuellos de botella y propone cambios concretos de audiencia, oferta, creatividad y presupuesto. Incluye hipótesis medible y KPI.",
  sales:
    "SKILL ACTIVA — VENTAS: prioriza negocios por valor y etapa, prepara guiones de llamada, maneja objeciones y define el próximo paso con fecha.",
  conversion:
    "SKILL ACTIVA — CONVERSIÓN: optimiza cada punto de fricción del embudo, reescribe CTAs y diseña secuencias de seguimiento multicanal con tiempos exactos.",
  prospecting:
    "SKILL ACTIVA — PROSPECCIÓN: define el perfil de cliente ideal a partir de los contactos que sí convirtieron y redacta mensajes de primer contacto personalizados.",
};

async function buildBrandContext(orgId: string, token: string) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: userData } = await admin.auth.getUser(token);
  const userId = userData?.user?.id;
  if (!userId) return "";

  const { data: member } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!member) return "";

  const [org, kb, msgs, contacts, deals, campaigns, channels] = await Promise.all([
    admin.from("organizations").select("name, website, locale, timezone, plan").eq("id", orgId).maybeSingle(),
    admin
      .from("knowledge_articles")
      .select("title, content, category")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .limit(25),
    admin
      .from("messages")
      .select("direction, content, is_ai, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(80),
    admin
      .from("contacts")
      .select("full_name, source, tags")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(40),
    admin
      .from("deals")
      .select("title, value, currency, status")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(40),
    admin
      .from("campaigns")
      .select("name, channel, status, body, total_count, sent_count, failed_count")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(15),
    admin
      .from("channels")
      .select("provider, name, is_active, verification_status")
      .eq("organization_id", orgId)
      .limit(20),
  ]);

  const brandVoice = (msgs.data ?? [])
    .filter((m: any) => m.direction === "outbound" && !m.is_ai)
    .slice(0, 25)
    .map((m: any) => `- ${String(m.content).slice(0, 240)}`)
    .join("\n");

  const inbound = (msgs.data ?? [])
    .filter((m: any) => m.direction === "inbound")
    .slice(0, 25)
    .map((m: any) => `- ${String(m.content).slice(0, 240)}`)
    .join("\n");

  const sections: string[] = [];
  sections.push(`MARCA: ${org.data?.name ?? "—"} · web: ${org.data?.website ?? "—"} · plan: ${org.data?.plan ?? "—"}`);
  if (channels.data?.length)
    sections.push(
      "CANALES CONECTADOS:\n" +
        channels.data
          .map((c: any) => `- ${c.provider} (${c.name}) activo=${c.is_active} verificación=${c.verification_status}`)
          .join("\n"),
    );
  if (kb.data?.length)
    sections.push(
      "KNOWLEDGE OFICIAL (única fuente de verdad para datos de producto/precios):\n" +
        kb.data.map((k: any, i: number) => `[${i + 1}] ${k.title}\n${String(k.content).slice(0, 1200)}`).join("\n\n"),
    );
  if (brandVoice) sections.push("LENGUAJE DE MARCA (mensajes reales enviados por el equipo):\n" + brandVoice);
  if (inbound) sections.push("VOZ DEL CLIENTE (mensajes recibidos recientes):\n" + inbound);
  if (contacts.data?.length)
    sections.push(
      "CONTACTOS RECIENTES:\n" +
        contacts.data
          .map((c: any) => `- ${c.full_name} · origen: ${c.source ?? "—"} · tags: ${(c.tags ?? []).join(", ") || "—"}`)
          .join("\n"),
    );
  if (deals.data?.length)
    sections.push(
      "PIPELINE:\n" +
        deals.data.map((d: any) => `- ${d.title} · ${d.value} ${d.currency} · ${d.status}`).join("\n"),
    );
  if (campaigns.data?.length)
    sections.push(
      "CAMPAÑAS Y RENDIMIENTO:\n" +
        campaigns.data
          .map(
            (c: any) =>
              `- ${c.name} (${c.channel}) estado=${c.status} enviados=${c.sent_count}/${c.total_count} fallidos=${c.failed_count}\n  copy: ${String(c.body ?? "").slice(0, 300)}`,
          )
          .join("\n"),
    );

  return "\n\n=== CONTEXTO REAL DE LA MARCA ===\n" + sections.join("\n\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, model, organization_id, skill } = await req.json();
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

    let system = BASE_PROMPT;
    if (skill && SKILLS[skill]) system += "\n\n" + SKILLS[skill];

    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (organization_id && token) {
      try {
        system += await buildBrandContext(organization_id, token);
      } catch (e) {
        console.error("brand-context error", e);
      }
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
        messages: [{ role: "system", content: system }, ...messages],
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
          JSON.stringify({ error: "Sin créditos de IA disponibles." }),
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
