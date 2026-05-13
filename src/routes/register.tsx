import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AurenLogo } from "@/components/brand/AurenLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: RegisterPage,
  head: () => ({ meta: [{ title: "Crear cuenta — AUREN AI" }] }),
});

function getSafeRedirect(redirect: string | undefined) {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) return null;
  return redirect;
}

function RegisterPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}${getSafeRedirect(redirect) ?? "/app"}`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: name },
        },
      });
      if (error) throw error;
      toast.success("Cuenta creada. Revisa tu email para confirmar.");
      navigate({ to: "/login", search: redirect ? { redirect } : undefined });
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12 order-2 lg:order-1">
        <div className="w-full max-w-sm">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Volver</Link>
          <h1 className="mt-6 font-display text-3xl font-semibold">Crear cuenta</h1>
          <p className="mt-2 text-sm text-muted-foreground">Empieza tu prueba gratis de 14 días.</p>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" placeholder="Tu nombre" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@empresa.com" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="Mínimo 8 caracteres" className="mt-1.5" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground text-center">
            ¿Ya tienes cuenta? <Link to="/login" search={redirect ? { redirect } : undefined} className="text-foreground hover:text-primary">Entra</Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex relative items-center justify-center grid-bg overflow-hidden order-1 lg:order-2">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative text-center px-12">
          <AurenLogo className="mx-auto w-56" />
          <h2 className="mt-6 font-display text-4xl font-semibold">Empieza con <span className="text-gradient-ai">IA</span></h2>
          <p className="mt-3 text-muted-foreground max-w-sm mx-auto">Únete a empresas modernas que escalan con AUREN AI.</p>
        </div>
      </div>
    </div>
  );
}
