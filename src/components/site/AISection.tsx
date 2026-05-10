import { motion } from "framer-motion";
import { Bot, Sparkles, Zap, Brain } from "lucide-react";

export function AISection() {
  return (
    <section id="ai" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-50 pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-6 grid gap-12 lg:grid-cols-2 items-center">
        <div>
          <div className="text-xs uppercase tracking-widest" style={{ color: "var(--ai)" }}>Inteligencia Artificial</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold">
            <span className="text-gradient-ai">IA que vende</span> por ti, 24/7.
          </h2>
          <p className="mt-4 text-muted-foreground">
            AUREN AI analiza cada conversación, clasifica leads, genera respuestas y sugiere el próximo paso para cerrar.
            Tu equipo se enfoca en lo importante, la IA se encarga del resto.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { icon: Brain, title: "Análisis de leads" },
              { icon: Sparkles, title: "Generación de mensajes" },
              { icon: Zap, title: "Sugerencias de cierre" },
              { icon: Bot, title: "Respuesta automática" },
            ].map((i) => (
              <div key={i.title} className="flex items-center gap-3 rounded-xl glass px-4 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-ai glow-ai">
                  <i.icon className="h-4 w-4" style={{ color: "var(--ai-foreground)" }} />
                </div>
                <span className="text-sm font-medium">{i.title}</span>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-2xl glass-strong p-6 shadow-elevated"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            AUREN AI · Asistente activo
          </div>
          <div className="mt-5 space-y-3">
            <div className="rounded-xl bg-surface px-4 py-3 text-sm border border-border/60">
              Cliente: Hola, quiero saber sobre el plan Pro
            </div>
            <div className="rounded-xl bg-gradient-ai px-4 py-3 text-sm" style={{ color: "var(--ai-foreground)" }}>
              ¡Hola! El plan Pro incluye automatizaciones ilimitadas, IA avanzada y omnicanal. ¿Te gustaría una demo personalizada?
            </div>
            <div className="rounded-xl glass px-4 py-3 text-xs text-muted-foreground">
              <Sparkles className="inline h-3 w-3 mr-1.5" style={{ color: "var(--ai)" }} />
              Sugerencia IA: Lead caliente · Probabilidad de cierre 87%
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
