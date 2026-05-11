import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AurenLogo } from "@/components/brand/AurenLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Entrar — AUREN AI" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error("No se pudo iniciar sesión");

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const isSuperAdmin = roles?.some((r) => r.role === "super_admin");
      toast.success("Bienvenido a AUREN AI");
      navigate({ to: isSuperAdmin ? "/admin" : "/app" });
    } catch (err: any) {
      toast.error(err.message ?? "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative items-center justify-center grid-bg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative text-center px-12">
          <AurenLogo className="mx-auto w-56" />
          <h2 className="mt-6 font-display text-4xl font-semibold">
            Bienvenido a <span className="text-gradient-primary">AUREN AI</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
            El sistema operativo comercial inteligente.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Volver</Link>
          <h1 className="mt-6 font-display text-3xl font-semibold">Entrar</h1>
          <p className="mt-2 text-sm text-muted-foreground">Accede a tu cuenta de AUREN AI.</p>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@empresa.com"
                className="mt-1.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="mt-1.5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>
          <p className="mt-6 text-sm text-muted-foreground text-center">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-foreground hover:text-primary">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
