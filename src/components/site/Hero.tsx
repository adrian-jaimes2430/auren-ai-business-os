import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Constellation } from "./Constellation";

export function Hero() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden pt-40 pb-24">
      <div
        className="absolute right-0 top-0 h-full w-full lg:w-[62%]"
        style={{
          maskImage: "radial-gradient(ellipse 70% 70% at 60% 45%, #000 45%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 60% 45%, #000 45%, transparent 100%)",
        }}
      >
        <Constellation />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-[1280px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <div className="text-[13px] uppercase tracking-[0.18em] text-spark">
            CRM · IA conversacional · Omnicanal
          </div>
          <h1 className="mt-8 display-xl">
            Tu operación comercial
            <br />
            ya tiene la respuesta.
            <br />
            <span className="text-muted-foreground">Solo pídesela a Auren.</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end"
        >
          <p className="max-w-xl text-lg font-extralight leading-relaxed text-silver">
            AUREN AI unifica CRM, inteligencia artificial, automatización y todos tus canales
            en un solo sistema operativo. La información deja de estar dispersa: se vuelve
            inteligencia distribuida que vende por ti.
          </p>
          <div className="flex items-center gap-8">
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-24 grid gap-10 border-t border-border/40 pt-10 sm:grid-cols-3"
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
