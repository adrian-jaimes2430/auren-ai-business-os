import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Entrar — AUREN AI" }] }),
});

function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative items-center justify-center grid-bg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative text-center px-12">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary glow-primary">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="mt-6 font-display text-4xl font-semibold">Bienvenido a <span className="text-gradient-primary">AUREN AI</span></h2>
          <p className="mt-3 text-muted-foreground max-w-sm mx-auto">El sistema operativo comercial inteligente.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Volver</Link>
          <h1 className="mt-6 font-display text-3xl font-semibold">Entrar</h1>
          <p className="mt-2 text-sm text-muted-foreground">Accede a tu cuenta de AUREN AI.</p>
          <form className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@empresa.com" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" className="mt-1.5" />
            </div>
            <Button className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">Entrar</Button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground text-center">
            ¿No tienes cuenta? <Link to="/register" className="text-foreground hover:text-primary">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
