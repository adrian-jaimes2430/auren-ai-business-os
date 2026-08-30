import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { AurenLogo } from "@/components/brand/AurenLogo";

export function StoryNav() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const solid = window.scrollY > 40;
        el.style.background = solid ? "rgba(0,0,0,0.55)" : "transparent";
        el.style.backdropFilter = solid ? "blur(4px)" : "none";
        (el.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter = solid
          ? "blur(4px)"
          : "none";
        el.style.borderBottomColor = solid ? "rgba(77,77,77,0.6)" : "transparent";
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 border-b border-transparent transition-colors"
      style={{ transitionProperty: "background-color, border-color" }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center opacity-95 transition-opacity hover:opacity-100">
          <AurenLogo className="w-28" />
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <a href="#features" className="s-ghost-nav">Producto</a>
          <a href="#ai" className="s-ghost-nav">IA</a>
          <a href="#integrations" className="s-ghost-nav">Canales</a>
          <Link to="/pricing" className="s-ghost-nav">Precios</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="s-ghost-nav hidden sm:inline-flex">
            Entrar
          </Link>
          <Link to="/register" className="s-pill-primary !py-2 !px-4 !text-[11px]">
            Empezar
          </Link>
        </div>
      </div>
    </header>
  );
}
