import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import heroOrb from "@/assets/hero-orb.jpg";

export function Hero() {
  const orbRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: orbRef,
    offset: ["start end", "end start"],
  });

  // Scroll-driven transforms
  const rotate = useTransform(scrollYProgress, [0, 1], [-15, 25]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1.05, 0.9]);
  const y = useTransform(scrollYProgress, [0, 1], [60, -80]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.2, 0.6, 0.3]);

  // Mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });
  const tiltX = useTransform(springY, [-0.5, 0.5], [10, -10]);
  const tiltY = useTransform(springX, [-0.5, 0.5], [-10, 10]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = orbRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const yy = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(yy);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  return (
    <section className="relative overflow-hidden pt-40 pb-24 grid-bg">
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Potenciado por IA · CRM · Omnicanal</span>
          </div>
          <h1 className="mt-6 font-display text-5xl md:text-7xl font-semibold leading-[1.05] tracking-tight">
            El sistema operativo <br />
            <span className="text-gradient-primary">comercial inteligente</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            CRM, IA conversacional, automatización y omnicanal en una sola plataforma.
            Construido para empresas modernas que escalan con inteligencia.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 glow-primary">
              <Link to="/register">
                Empezar gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="glass">
              <Link to="/pricing">Ver precios</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          ref={orbRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{ y }}
          className="relative mt-20 mx-auto max-w-5xl"
        >
          <motion.div
            style={{ opacity: glowOpacity, rotate }}
            className="absolute -inset-10 bg-gradient-mesh blur-3xl rounded-full"
          />
          <div className="relative rounded-2xl glass-strong p-2 shadow-elevated" style={{ perspective: 1200 }}>
            <div className="rounded-xl overflow-hidden border border-border/60 aspect-[16/9] bg-surface relative">
              <motion.img
                src={heroOrb}
                alt="AUREN AI"
                width={1536}
                height={1536}
                style={{ scale, rotate, rotateX: tiltX, rotateY: tiltY }}
                animate={{ filter: ["brightness(0.9)", "brightness(1.05)", "brightness(0.9)"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 h-full w-full object-cover opacity-80 will-change-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-3">
                {[
                  { k: "Conversión", v: "+38%" },
                  { k: "Tiempo respuesta", v: "-72%" },
                  { k: "Leads/mes", v: "12.4k" },
                ].map((s) => (
                  <div key={s.k} className="rounded-lg glass px-4 py-3">
                    <div className="text-xs text-muted-foreground">{s.k}</div>
                    <div className="font-display text-xl font-semibold">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
