import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({ meta: [{ title: "Crear cuenta — AUREN AI" }] }),
});

function RegisterPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12 order-2 lg:order-1">
        <div className="w-full max-w-sm">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Volver</Link>
          <h1 className="mt-6 font-display text-3xl font-semibold">Crear cuenta</h1>
          <p className="mt-2 text-sm text-muted-foreground">Empieza tu prueba gratis de 14 días.</p>
          <form className="mt-8 space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" placeholder="Tu nombre" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@empresa.com" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="Mínimo 8 caracteres" className="mt-1.5" />
            </div>
            <Button className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">Crear cuenta</Button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground text-center">
            ¿Ya tienes cuenta? <Link to="/login" className="text-foreground hover:text-primary">Entra</Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex relative items-center justify-center grid-bg overflow-hidden order-1 lg:order-2">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative text-center px-12">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-ai glow-ai">
            <Sparkles className="h-6 w-6" style={{ color: "var(--ai-foreground)" }} />
          </div>
          <h2 className="mt-6 font-display text-4xl font-semibold">Empieza con <span className="text-gradient-ai">IA</span></h2>
          <p className="mt-3 text-muted-foreground max-w-sm mx-auto">Únete a empresas modernas que escalan con AUREN AI.</p>
        </div>
      </div>
    </div>
  );
}
