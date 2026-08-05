import { motion } from "framer-motion";
import { Bot, Sparkles, Zap, Brain } from "lucide-react";

const capabilities = [
  { icon: Brain, title: "Análisis de leads" },
  { icon: Sparkles, title: "Generación de mensajes" },
  { icon: Zap, title: "Sugerencias de cierre" },
  { icon: Bot, title: "Respuesta automática" },
];

export function AISection() {
  return (
    <section id="ai" className="mx-auto max-w-[1280px] px-6 py-32">
      <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
        <div>
          <div className="eyebrow text-spark">Inteligencia artificial</div>
          <h2 className="mt-6 display-lg">
            IA que vende
            <br />
            por ti, 24/7.
          </h2>
          <p className="mt-8 max-w-lg text-lg font-extralight leading-relaxed text-silver">
            AUREN AI analiza cada conversación, clasifica leads, genera respuestas y sugiere el
            próximo paso para cerrar. Tu equipo se enfoca en lo importante; la IA se encarga del resto.
          </p>
          <div className="mt-12 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {capabilities.map((c) => (
              <div key={c.title} className="flex items-center gap-3">
                <c.icon className="h-4 w-4 text-primary" strokeWidth={1.25} />
                <span className="text-[15px] font-light text-silver">{c.title}</span>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-5 lg:pt-20"
        >
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Auren · Asistente activo
          </div>
          <p className="text-[24px] font-extralight leading-snug tracking-[-0.02em] text-silver">
            “Hola, quiero saber sobre el plan Pro.”
          </p>
          <p className="text-[27px] font-normal leading-snug tracking-[-0.03em]">
            El plan Pro incluye automatizaciones ilimitadas, IA avanzada y omnicanal.
            ¿Te gustaría una demo personalizada?
          </p>
          <p className="text-[15px] font-light text-spark">
            Sugerencia IA · Lead caliente · Probabilidad de cierre 87%
          </p>
        </motion.div>
      </div>
    </section>
  );
}
