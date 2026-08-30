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

export function StoryFooter() {
  return (
    <footer className="s-hr border-t">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-20 md:grid-cols-4">
        <div>
          <AurenLogo className="w-28" />
          <p className="s-body mt-5 max-w-xs text-[15px]">
            El sistema operativo comercial inteligente de Company A&amp;O Ecosystem.
          </p>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <div className="s-label">{c.title}</div>
            <ul className="mt-5 space-y-3">
              {c.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="s-link !text-[15px]">{l.label}</a>
                </li>
              ))}
              {c.internal.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="s-link !text-[15px]">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <div className="s-label">Empresa</div>
          <ul className="mt-5 space-y-3">
            <li>
              <a href="https://www.ayoecosystem.com" target="_blank" rel="noopener noreferrer" className="s-link !text-[15px]">
                Sobre A&amp;O
              </a>
            </li>
            <li>
              <a href="mailto:contacto@ayoecosystem.com" className="s-link !text-[15px]">Contacto</a>
            </li>
            <li>
              <a href="mailto:soporte@ayoecosystem.com" className="s-link !text-[15px]">Soporte</a>
            </li>
          </ul>
        </div>

        <div>
          <div className="s-label">Legal</div>
          <ul className="mt-5 space-y-3">
            <li><Link to="/privacy" className="s-link !text-[15px]">Privacidad</Link></li>
            <li><Link to="/terms" className="s-link !text-[15px]">Términos</Link></li>
            <li><Link to="/refund" className="s-link !text-[15px]">Reembolsos</Link></li>
          </ul>
        </div>
      </div>
      <div className="s-hr border-t py-8 text-center">
        <span className="s-label">
          © {new Date().getFullYear()} Company A&amp;O Ecosystem · AUREN AI
        </span>
      </div>
    </footer>
  );
}
