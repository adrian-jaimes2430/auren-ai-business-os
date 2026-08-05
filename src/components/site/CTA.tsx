import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-40">
      <h2 className="display-xl max-w-4xl">
        Listo para escalar
        <br />
        con <span className="text-primary">AUREN AI</span>.
      </h2>
      <div className="mt-14 flex flex-wrap items-center gap-10">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[13px] font-medium uppercase tracking-[0.08em] text-primary-foreground transition-opacity hover:opacity-85"
        >
          Empezar ahora <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          to="/pricing"
          className="text-[13px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
        >
          Hablar con ventas
        </Link>
      </div>
    </section>
  );
}
