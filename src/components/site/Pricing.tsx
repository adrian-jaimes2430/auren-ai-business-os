import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

const plans = [
  {
    name: "Starter", price: "29", desc: "Para emprendedores que arrancan.",
    features: ["1 usuario", "CRM básico", "1 canal", "IA limitada", "500 contactos"],
  },
  {
    name: "Pro", price: "79", desc: "El favorito de PyMEs y agencias.", highlight: true,
    features: ["10 usuarios", "CRM completo", "Omnicanal ilimitado", "IA avanzada", "Automatizaciones", "10k contactos"],
  },
  {
    name: "Enterprise", price: "199", desc: "Para empresas que escalan.",
    features: ["Usuarios ilimitados", "Multi-empresa", "API & Webhooks", "IA personalizada", "Soporte dedicado", "SLA"],
  },
];

export function Pricing({ heading = true }: { heading?: boolean }) {
  return (
    <section className="py-24 mx-auto max-w-6xl px-6">
      {heading && (
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs text-primary uppercase tracking-widest">Precios</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold">Planes para cada etapa</h2>
          <p className="mt-4 text-muted-foreground">Mensual o anual. Cambia cuando quieras.</p>
        </div>
      )}
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`relative rounded-2xl p-7 ${p.highlight ? "glass-strong border-primary/40 glow-primary" : "glass"}`}
          >
            {p.highlight && (
              <div className="absolute -top-3 left-7 rounded-full bg-gradient-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Más popular
              </div>
            )}
            <div className="font-display text-xl font-semibold">{p.name}</div>
            <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="font-display text-5xl font-semibold">${p.price}</span>
              <span className="text-muted-foreground text-sm">/mes</span>
            </div>
            <Button asChild className={`mt-6 w-full ${p.highlight ? "bg-gradient-primary text-primary-foreground hover:opacity-90" : ""}`} variant={p.highlight ? "default" : "outline"}>
              <Link to="/register">Empezar</Link>
            </Button>
            <ul className="mt-6 space-y-3 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
