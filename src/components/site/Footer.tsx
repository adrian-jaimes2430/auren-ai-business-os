import { Link } from "@tanstack/react-router";
import { AurenLogo } from "@/components/brand/AurenLogo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-32">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <AurenLogo className="w-36" />
          <p className="mt-3 text-muted-foreground">El sistema operativo comercial inteligente de Company A&amp;O Ecosystem.</p>
        </div>
        <div>
          <div className="font-medium mb-3">Producto</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><a href="#features">CRM</a></li>
            <li><a href="#ai">IA</a></li>
            <li><a href="#integrations">Omnicanal</a></li>
            <li><Link to="/pricing">Precios</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-3">Empresa</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <a href="https://www.ayoecosystem.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                Sobre A&amp;O
              </a>
            </li>
            <li>
              <a href="mailto:contacto@ayoecosystem.com" className="hover:text-foreground transition-colors">
                Contacto
              </a>
            </li>
            <li>
              <a href="mailto:soporte@ayoecosystem.com" className="hover:text-foreground transition-colors">
                Soporte
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-3">Legal</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-foreground transition-colors">Términos</Link>
            </li>
            <li>
              <Link to="/refund" className="hover:text-foreground transition-colors">Reembolsos</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Company A&amp;O Ecosystem · AUREN AI
      </div>
    </footer>
  );
}
