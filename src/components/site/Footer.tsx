import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-32">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <div className="font-display text-lg font-semibold">AUREN <span className="text-gradient-primary">AI</span></div>
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
            <li>Sobre A&amp;O</li>
            <li>Contacto</li>
            <li>Soporte</li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-3">Legal</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>Privacidad</li>
            <li>Términos</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Company A&amp;O Ecosystem · AUREN AI
      </div>
    </footer>
  );
}
