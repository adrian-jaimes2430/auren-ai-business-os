import { motion } from "framer-motion";
import { Bot, Sparkles, Zap, Brain } from "lucide-react";

const capabilities = [
  { icon: Brain, title: "Análisis de leads" },
  { icon: Sparkles, title: "Generación de mensajes" },
  { icon: Zap, title: "Sugerencias de cierre" },
  { icon: Bot, title: "Respuesta automática" },
];

export function StoryAI() {
  return (
    <section id="ai" className="mx-auto max-w-[1280px] px-6 py-28 sm:py-32">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-24">
        <div>
          <div className="s-eyebrow">Inteligencia artificial</div>
          <h2 className="s-display mt-6 text-[32px] sm:text-[44px] lg:text-[52px]">
            IA que vende
            <br />
            por ti, 24/7.
          </h2>
          <p className="s-body mt-8 max-w-lg">
            AUREN AI analiza cada conversación, clasifica leads, genera respuestas y sugiere el
            próximo paso para cerrar. Tu equipo se enfoca en lo importante; la IA se encarga del resto.
          </p>
          <div className="mt-10 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {capabilities.map((c) => (
              <div key={c.title} className="flex items-center gap-3">
                <c.icon className="h-4 w-4 text-[var(--story-white)]" strokeWidth={1.25} />
                <span className="s-label normal-case tracking-normal text-[var(--story-mist)]">
                  {c.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="s-card s-glass space-y-5 lg:mt-16"
        >
          <div className="s-label flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--story-violet)" }} />
            Auren · Asistente activo
          </div>
          <p className="s-body text-[19px] leading-snug text-[var(--story-mist)]">
            "Hola, quiero saber sobre el plan Pro."
          </p>
          <p className="s-display text-[22px] leading-snug">
            El plan Pro incluye automatizaciones ilimitadas, IA avanzada y omnicanal.
            ¿Te gustaría una demo personalizada?
          </p>
          <p className="s-label normal-case tracking-normal text-white/70">
            Sugerencia IA · Lead caliente · Probabilidad de cierre 87%
          </p>
        </motion.div>
      </div>
    </section>
  );
}
