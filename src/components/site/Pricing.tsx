import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/config/plans";
import { useAuth } from "@/hooks/use-auth";

export function Pricing({ heading = true }: { heading?: boolean }) {
  const { user } = useAuth();

  return (
    <section className="py-24 mx-auto max-w-7xl px-6">
      {heading && (
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs text-primary uppercase tracking-widest">Precios</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold">Planes para cada etapa</h2>
          <p className="mt-4 text-muted-foreground">Mensual. Cambia o cancela cuando quieras.</p>
        </div>
      )}
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => {
          const href = user
            ? `/app/settings?upgrade=${p.id}`
            : `/register?plan=${p.id}`;
          return (
            <div
              key={p.id}
              className={`relative rounded-2xl p-7 ${p.popular ? "glass-strong border-primary/40 glow-primary" : "glass"}`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-7 rounded-full bg-gradient-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Más popular
                </div>
              )}
              <div className="font-display text-xl font-semibold">{p.name}</div>
              <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-5xl font-semibold">${p.priceUSD}</span>
                <span className="text-muted-foreground text-sm">/mes</span>
              </div>
              <Button
                asChild
                className={`mt-6 w-full ${p.popular ? "bg-gradient-primary text-primary-foreground hover:opacity-90" : ""}`}
                variant={p.popular ? "default" : "outline"}
              >
                <a href={href}>{user ? "Elegir plan" : "Empezar"}</a>
              </Button>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
