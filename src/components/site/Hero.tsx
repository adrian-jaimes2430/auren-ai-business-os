import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Constellation } from "./Constellation";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-24">
      <div className="relative mx-auto max-w-[1280px] px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="eyebrow text-spark">CRM · IA conversacional · Omnicanal</div>
            <h1 className="mt-8 display-xl">
              Tu operación
              <br />
              ya tiene la
              <br />
              respuesta.
            </h1>
            <p className="mt-8 max-w-lg text-lg font-extralight leading-relaxed text-silver">
              AUREN AI unifica CRM, inteligencia artificial, automatización y todos tus canales
              en un solo sistema operativo. La información deja de estar dispersa: se vuelve
              inteligencia distribuida que vende por ti.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-8">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[13px] font-medium uppercase tracking-[0.08em] text-primary-foreground transition-opacity hover:opacity-85"
              >
                Empezar gratis <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/pricing"
                className="text-[13px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
              >
                Ver precios
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[420px] sm:h-[520px] lg:h-[640px]"
            style={{
              maskImage: "radial-gradient(ellipse 62% 62% at 50% 50%, #000 55%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 62% 62% at 50% 50%, #000 55%, transparent 100%)",
            }}
          >
            <Constellation />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.45 }}
          className="mt-16 grid gap-10 border-t border-border/40 pt-10 sm:grid-cols-3"
        >
          {[
            { k: "Conversión", v: "+38%" },
            { k: "Tiempo de respuesta", v: "-72%" },
            { k: "Leads gestionados / mes", v: "12.4k" },
          ].map((s) => (
            <div key={s.k}>
              <div className="text-[42px] font-normal leading-none tracking-[-0.04em]">{s.v}</div>
              <div className="mt-3 text-[12px] uppercase tracking-[0.14em] text-muted-foreground">{s.k}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
