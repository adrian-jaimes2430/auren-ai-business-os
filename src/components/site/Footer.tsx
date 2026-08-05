import { Link } from "@tanstack/react-router";
import { AurenLogo } from "@/components/brand/AurenLogo";

const cols = [
  {
    title: "Producto",
    links: [
      { label: "CRM", href: "#features" },
      { label: "IA", href: "#ai" },
      { label: "Omnicanal", href: "#integrations" },
    ],
    internal: [{ label: "Precios", to: "/pricing" as const }],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-20 text-[15px] font-extralight md:grid-cols-4">
        <div>
          <AurenLogo className="w-32" />
          <p className="mt-5 max-w-xs text-silver">
            El sistema operativo comercial inteligente de Company A&amp;O Ecosystem.
          </p>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <div className="eyebrow text-muted-foreground">{c.title}</div>
            <ul className="mt-5 space-y-3 text-silver">
              {c.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="transition-colors hover:text-foreground">{l.label}</a>
                </li>
              ))}
              {c.internal.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="transition-colors hover:text-foreground">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <div className="eyebrow text-muted-foreground">Empresa</div>
          <ul className="mt-5 space-y-3 text-silver">
            <li>
              <a href="https://www.ayoecosystem.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
                Sobre A&amp;O
              </a>
            </li>
            <li>
              <a href="mailto:contacto@ayoecosystem.com" className="transition-colors hover:text-foreground">Contacto</a>
            </li>
            <li>
              <a href="mailto:soporte@ayoecosystem.com" className="transition-colors hover:text-foreground">Soporte</a>
            </li>
          </ul>
        </div>

        <div>
          <div className="eyebrow text-muted-foreground">Legal</div>
          <ul className="mt-5 space-y-3 text-silver">
            <li><Link to="/privacy" className="transition-colors hover:text-foreground">Privacidad</Link></li>
            <li><Link to="/terms" className="transition-colors hover:text-foreground">Términos</Link></li>
            <li><Link to="/refund" className="transition-colors hover:text-foreground">Reembolsos</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40 py-8 text-center text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
        © {new Date().getFullYear()} Company A&amp;O Ecosystem · AUREN AI
      </div>
    </footer>
  );
}
