import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 mx-auto max-w-5xl px-6">
      <div className="relative overflow-hidden rounded-3xl glass-strong p-12 md:p-16 text-center">
        <div className="absolute inset-0 bg-gradient-hero opacity-60 pointer-events-none" />
        <div className="relative">
          <h2 className="font-display text-4xl md:text-5xl font-semibold">
            Listo para escalar con <span className="text-gradient-primary">AUREN AI</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Únete a las empresas que ya están vendiendo con inteligencia artificial.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 glow-primary">
              <Link to="/register">Empezar ahora <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="glass">
              <Link to="/pricing">Hablar con ventas</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
