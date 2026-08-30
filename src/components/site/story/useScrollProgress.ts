import { useEffect, useRef } from "react";

/**
 * Mide el progreso de scroll (0 → 1) a lo largo del track referenciado
 * sin disparar re-renders de React en cada pixel: expone un `progressRef`
 * mutable que los consumidores (three.js `useFrame`, mutaciones directas
 * de estilo DOM) pueden leer cada frame.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const trackRef = useRef<T | null>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let ticking = false;

    const measure = () => {
      ticking = false;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      progressRef.current = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return { trackRef, progressRef };
}
