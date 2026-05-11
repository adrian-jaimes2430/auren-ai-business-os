import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AurenLogo } from "@/components/brand/AurenLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({ meta: [{ title: "Nueva contraseña — AUREN AI" }] }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Mínimo 8 caracteres");
    if (password !== confirm) return toast.error("Las contraseñas no coinciden");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Contraseña actualizada");
      navigate({ to: "/login" });
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2">
          <AurenLogo className="w-36" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">Nueva contraseña</h1>
        <p className="mt-2 text-sm text-muted-foreground">Define una nueva contraseña segura.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" className="mt-1.5" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <div>
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <Input id="confirm" type="password" className="mt-1.5" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
