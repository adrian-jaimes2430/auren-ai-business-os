import { Link } from "@tanstack/react-router";
import { AurenLogo } from "@/components/brand/AurenLogo";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center">
          <AurenLogo className="w-32" />
        </Link>
        <nav className="hidden items-center gap-10 text-[13px] uppercase tracking-[0.08em] text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">Producto</a>
          <a href="#ai" className="transition-colors hover:text-foreground">IA</a>
          <a href="#integrations" className="transition-colors hover:text-foreground">Canales</a>
          <Link to="/pricing" className="transition-colors hover:text-foreground">Precios</Link>
        </nav>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-[13px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground">
            Entrar
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-primary px-6 py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-primary-foreground transition-opacity hover:opacity-85"
          >
            Empezar
          </Link>
        </div>
      </div>
    </header>
  );
}
