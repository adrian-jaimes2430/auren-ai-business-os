import { Check } from "lucide-react";
import { PLANS } from "@/config/plans";
import { useAuth } from "@/hooks/use-auth";

export function Pricing({ heading = true }: { heading?: boolean }) {
  const { user } = useAuth();

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-32">
      {heading && (
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
          <div>
            <div className="eyebrow text-spark">Precios</div>
            <h2 className="mt-6 display-lg">
              Planes para
              <br />
              cada etapa.
            </h2>
          </div>
          <p className="max-w-lg text-lg font-extralight leading-relaxed text-silver lg:pt-6">
            Mensual. Cambia o cancela cuando quieras. 14 días de prueba en cualquier plan.
          </p>
        </div>
      )}

      <div className="mt-20 grid border-t border-border/40 lg:grid-cols-4">
        {PLANS.map((p) => {
          const href = user ? `/app/settings?upgrade=${p.id}` : `/register?plan=${p.id}`;
          return (
            <div
              key={p.id}
              className="flex flex-col border-b border-border/40 py-10 lg:border-l lg:px-8 lg:first:border-l-0 lg:first:pl-0"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-[24px] font-normal tracking-[-0.02em]">{p.name}</span>
                {p.popular && <span className="eyebrow text-spark">Popular</span>}
              </div>
              <p className="mt-2 text-[15px] font-extralight text-silver">{p.description}</p>
              <div className="mt-8 flex items-baseline gap-2">
                <span className="text-[48px] font-normal leading-none tracking-[-0.04em]">${p.priceUSD}</span>
                <span className="text-[13px] text-muted-foreground">/mes</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3 text-[15px] font-extralight text-silver">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.5} /> {f}
                  </li>
                ))}
              </ul>
              <a
                href={href}
                className={`mt-10 inline-flex w-fit items-center rounded-full px-6 py-3 text-[13px] font-medium uppercase tracking-[0.08em] transition-opacity hover:opacity-85 ${
                  p.popular
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/60 text-foreground"
                }`}
              >
                {user ? "Elegir plan" : "Empezar"}
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
