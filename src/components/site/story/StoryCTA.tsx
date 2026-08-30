import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function StoryCTA() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-32 sm:py-40">
      <h2 className="s-display max-w-4xl text-[38px] sm:text-[56px] lg:text-[68px]">
        Listo para escalar
        <br />
        con <span style={{ color: "var(--story-violet-soft)" }}>AUREN AI</span>.
      </h2>
      <div className="mt-12 flex flex-wrap items-center gap-6">
        <Link to="/register" className="s-pill-primary">
          Empezar ahora <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link to="/pricing" className="s-ghost-nav">
          Hablar con ventas
        </Link>
      </div>
    </section>
  );
}
