import { useEffect, useRef } from "react";

type P = {
  x: number; y: number; z: number;
  bx: number; by: number; bz: number;
  size: number; color: string; phase: number; speed: number;
};

const COLORS = [
  "#ff3b30", // A&O red
  "#ff6b4a",
  "#ffb829", // saffron spark
  "#8052ff", // electric iris
  "#15846e", // deep verdant
  "#4aa8ff",
  "#ffffff",
];

/** Builds a brain/cloud-like organic point cloud in 3D. */
function buildCloud(count: number): P[] {
  const pts: P[] = [];
  let guard = 0;
  while (pts.length < count && guard < count * 60) {
    guard++;
    // two hemispheres + a lower stem => brain-ish silhouette
    const lobe = Math.random() < 0.5 ? -1 : 1;
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.42);
    const s = Math.sqrt(1 - u * u);
    let x = r * s * Math.cos(t) * 1.15 + lobe * 0.34;
    let y = r * u * 0.78 - 0.05;
    let z = r * s * Math.sin(t) * 0.85;

    // folded surface bias: keep points nearer the shell for a wireframe feel
    const shell = Math.hypot(x - lobe * 0.34, y, z);
    if (shell < 0.28 && Math.random() < 0.72) continue;

    // gentle gyri wobble
    const w = Math.sin(y * 9 + z * 7) * 0.045;
    x += w;
    y += Math.cos(x * 8) * 0.03;

    if (Math.abs(x) > 1.5) continue;
    pts.push({
      x, y, z, bx: x, by: y, bz: z,
      size: 1.1 + Math.random() * 2.4,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.9,
    });
  }
  // ambient scattered field
  for (let i = 0; i < Math.round(count * 0.22); i++) {
    const x = (Math.random() * 2 - 1) * 2.5;
    const y = (Math.random() * 2 - 1) * 1.5;
    const z = (Math.random() * 2 - 1) * 1.2;
    pts.push({
      x, y, z, bx: x, by: y, bz: z,
      size: 0.8 + Math.random() * 1.4,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      phase: Math.random() * Math.PI * 2,
      speed: 0.25 + Math.random() * 0.5,
    });
  }
  return pts;
}

export function Constellation({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    let w = 0, h = 0;

    const isSmall = window.innerWidth < 768;
    const pts = buildCloud(isSmall ? 900 : 2100);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // pointer + scroll state
    let mx = 0, my = 0, tmx = 0, tmy = 0;
    let scroll = 0, tscroll = 0;
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      tmx = (e.clientX - rect.left) / rect.width - 0.5;
      tmy = (e.clientY - rect.top) / rect.height - 0.5;
    };
    const onScroll = () => {
      const rect = canvas.getBoundingClientRect();
      tscroll = -rect.top / Math.max(window.innerHeight, 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    let raf = 0;
    let t0 = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - t0) / 1000, 0.05);
      t0 = now;
      const time = now / 1000;

      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;
      scroll += (tscroll - scroll) * 0.08;

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2 - scroll * h * 0.18;
      const base = Math.min(w, h);
      const zoom = base * (0.52 + scroll * 0.1);

      const ry = time * (reduce ? 0 : 0.12) + mx * 0.9 + scroll * 0.6;
      const rx = -my * 0.55 + Math.sin(time * 0.25) * 0.06;
      const cosY = Math.cos(ry), sinY = Math.sin(ry);
      const cosX = Math.cos(rx), sinX = Math.sin(rx);

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const breathe = reduce ? 0 : Math.sin(time * p.speed + p.phase) * 0.02;
        const px = p.bx * (1 + breathe);
        const py = p.by * (1 + breathe);
        const pz = p.bz * (1 + breathe);

        // rotate Y then X
        let x = px * cosY + pz * sinY;
        let z = -px * sinY + pz * cosY;
        let y = py * cosX - z * sinX;
        z = py * sinX + z * cosX;

        const persp = 2.6 / (2.6 + z);
        const sx = cx + x * zoom * persp;
        const sy = cy + y * zoom * persp;
        if (sx < -40 || sx > w + 40 || sy < -40 || sy > h + 40) continue;

        const s = p.size * persp * (dpr > 1.4 ? 1 : 1.15);
        const alpha = Math.min(1, 0.22 + persp * 0.62) * (0.5 + 0.5 * Math.sin(time * p.speed * 1.6 + p.phase));

        ctx.globalAlpha = Math.max(0.06, alpha);
        ctx.fillStyle = p.color;
        // tiny triangle glyph
        ctx.beginPath();
        ctx.moveTo(sx, sy - s);
        ctx.lineTo(sx + s * 0.9, sy + s * 0.8);
        ctx.lineTo(sx - s * 0.9, sy + s * 0.8);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
      void dt;
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none h-full w-full ${className}`}
    />
  );
}
