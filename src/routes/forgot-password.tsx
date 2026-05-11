import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({ meta: [{ title: "Recuperar contraseña — AUREN AI" }] }),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Te enviamos un enlace de recuperación");
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo enviar el correo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">← Volver al login</Link>
        <div className="mt-6 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary glow-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold">AUREN <span className="text-gradient-primary">AI</span></span>
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ingresa tu email y te enviaremos un enlace para restablecerla.</p>
        {sent ? (
          <div className="mt-8 rounded-xl glass p-4 text-sm">
            Si existe una cuenta con <span className="font-medium">{email}</span>, recibirás un correo en breve.
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@empresa.com" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar enlace"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
