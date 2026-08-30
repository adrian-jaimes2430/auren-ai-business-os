import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useScrollProgress } from "./useScrollProgress";

const PortalScene = lazy(() =>
  import("./PortalScene").then((m) => ({ default: m.PortalScene })),
);

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

/** Ventana de aparición/desvanecimiento de un beat narrativo dentro del progreso 0→1. */
function beatStyle(progress: number, inStart: number, inEnd: number, outStart: number, outEnd: number) {
  let opacity: number;
  if (progress < inStart) opacity = 0;
  else if (progress < inEnd) opacity = clamp01((progress - inStart) / (inEnd - inStart));
  else if (progress < outStart) opacity = 1;
  else if (progress < outEnd) opacity = 1 - clamp01((progress - outStart) / (outEnd - outStart));
  else opacity = 0;

  const rising = progress < inEnd;
  const translate = rising ? (1 - opacity) * 22 : (1 - opacity) * -14;
  return { opacity, translate };
}

const stats = [
  { k: "Conversión", v: "+38%" },
  { k: "Tiempo de respuesta", v: "-72%" },
  { k: "Leads gestionados / mes", v: "12.4k" },
];

export function StoryHero() {
  const { trackRef, progressRef } = useScrollProgress<HTMLDivElement>();
  const [mounted, setMounted] = useState(false);

  const beat1Ref = useRef<HTMLDivElement>(null);
  const beat2Ref = useRef<HTMLDivElement>(null);
  const beat3Ref = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let raf = 0;
    const apply = (el: HTMLDivElement | null, s: { opacity: number; translate: number }) => {
      if (!el) return;
      el.style.opacity = String(s.opacity);
      el.style.transform = `translateY(${s.translate}px)`;
      el.style.pointerEvents = s.opacity > 0.6 ? "auto" : "none";
    };

    const tick = () => {
      const p = progressRef.current;
      apply(beat1Ref.current, beatStyle(p, 0, 0.08, 0.2, 0.32));
      apply(beat2Ref.current, beatStyle(p, 0.26, 0.36, 0.5, 0.6));
      apply(beat3Ref.current, beatStyle(p, 0.54, 0.66, 1.01, 1.02));
      if (cueRef.current) {
        cueRef.current.style.opacity = String(clamp01(1 - p * 9));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  return (
    <div ref={trackRef} className="relative" style={{ height: "320vh" }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Escena WebGL — solo cliente, carga diferida */}
        <div className="absolute inset-0">
          {mounted && (
            <Suspense fallback={null}>
              <PortalScene progressRef={progressRef} className="h-full w-full" />
            </Suspense>
          )}
        </div>

        {/* Aurora muy tenue desde una esquina — nunca compite con el emblema */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 12% 8%, rgba(128,82,255,0.10), transparent 60%), radial-gradient(ellipse 55% 45% at 88% 92%, rgba(74,168,255,0.08), transparent 60%)",
          }}
        />

        {/* Beat 1 */}
        <div
          ref={beat1Ref}
          className="absolute inset-x-0 top-0 flex h-screen flex-col items-center justify-center px-6 text-center"
          style={{ opacity: 0, willChange: "opacity, transform" }}
        >
          <div className="s-eyebrow">CRM · IA conversacional · Omnicanal</div>
          <h1 className="s-display mt-6 text-[13vw] leading-[0.98] sm:text-[64px] lg:text-[88px]">
            Tu operación
            <br />
            ya tiene la
            <br />
            respuesta.
          </h1>
        </div>

        {/* Beat 2 */}
        <div
          ref={beat2Ref}
          className="absolute inset-x-0 top-0 flex h-screen flex-col items-center justify-center px-6 text-center"
          style={{ opacity: 0, willChange: "opacity, transform" }}
        >
          <p className="s-body max-w-xl text-[20px] sm:text-[26px]">
            La información deja de estar dispersa entre chats, hojas de cálculo
            y bandejas de entrada.
          </p>
        </div>

        {/* Beat 3 — cierre + CTA + stats */}
        <div
          ref={beat3Ref}
          className="absolute inset-x-0 top-0 flex h-screen flex-col items-center justify-center px-6 text-center"
          style={{ opacity: 0, willChange: "opacity, transform" }}
        >
          <h2 className="s-display max-w-3xl text-[9vw] leading-[1.02] sm:text-[46px] lg:text-[58px]">
            Se vuelve inteligencia distribuida
            <br />
            que vende por ti.
          </h2>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            <Link to="/register" className="s-pill-primary">
              Empezar gratis <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link to="/pricing" className="s-ghost-nav">
              Ver precios
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-6 border-t border-[var(--story-ash)] pt-8 sm:gap-16">
            {stats.map((s) => (
              <div key={s.k}>
                <div className="s-display text-[26px] sm:text-[38px]">{s.v}</div>
                <div className="s-label mt-2 max-w-[10rem] text-[10px] sm:text-[11px]">{s.k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicador de scroll — ghost, desaparece al primer gesto */}
        <div
          ref={cueRef}
          className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center transition-opacity duration-300"
        >
          <div className="s-float flex flex-col items-center gap-2 opacity-70">
            <span className="s-label">Desliza</span>
            <span className="h-8 w-px bg-[var(--story-fog)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
