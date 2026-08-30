import { Check } from "lucide-react";
import { PLANS } from "@/config/plans";
import { useAuth } from "@/hooks/use-auth";

export function StoryPricing() {
  const { user } = useAuth();

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-28 sm:py-32">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-24">
        <div>
          <div className="s-eyebrow">Precios</div>
          <h2 className="s-display mt-6 text-[32px] sm:text-[44px] lg:text-[52px]">
            Planes para
            <br />
            cada etapa.
          </h2>
        </div>
        <p className="s-body max-w-lg lg:pt-6">
          Mensual. Cambia o cancela cuando quieras. 14 días de prueba en cualquier plan.
        </p>
      </div>

      <div className="mt-16 grid gap-6 lg:grid-cols-4">
        {PLANS.map((p) => {
          const href = user ? `/app/settings?upgrade=${p.id}` : `/register?plan=${p.id}`;
          return (
            <div
              key={p.id}
              className="s-card flex flex-col"
              style={p.popular ? { borderColor: "var(--story-violet)" } : undefined}
            >
              <div className="flex items-baseline gap-3">
                <span className="s-display text-[20px]">{p.name}</span>
                {p.popular && <span className="s-eyebrow" style={{ color: "var(--story-mist)" }}>Popular</span>}
              </div>
              <p className="s-body mt-2 text-[14px]">{p.description}</p>
              <div className="mt-8 flex items-baseline gap-2">
                <span className="s-display text-[38px]">${p.priceUSD}</span>
                <span className="s-label">/mes</span>
              </div>
              <ul className="s-body mt-8 flex-1 space-y-3 text-[14px]">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0" style={{ color: "var(--story-violet-soft)" }} strokeWidth={1.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={href}
                className={`mt-10 w-fit ${p.popular ? "s-pill-primary" : "s-pill-ghost"}`}
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
