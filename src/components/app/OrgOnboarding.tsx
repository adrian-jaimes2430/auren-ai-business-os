import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AurenLogo } from "@/components/brand/AurenLogo";
import { useAuth } from "@/hooks/use-auth";
import { createOrganizationWithDefaults } from "@/hooks/use-organization";
import { toast } from "sonner";

export function OrgOnboarding({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const org = await createOrganizationWithDefaults({ name: name.trim(), ownerId: user.id });
      if (typeof window !== "undefined" && org?.id) {
        localStorage.setItem("auren.currentOrgId", org.id);
      }
      toast.success("Workspace creado");
      onCreated();
      // Safety net: hard reload to guarantee fresh auth + org state hydration
      setTimeout(() => {
        if (typeof window !== "undefined") window.location.assign("/app");
      }, 300);
    } catch (err: any) {
      console.error("[OrgOnboarding] create failed", err);
      toast.error(err?.message ?? err?.details ?? "No se pudo crear el workspace");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <AurenLogo className="w-36" />
        <h1 className="mt-6 font-display text-3xl font-semibold">Crea tu workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dale un nombre a tu organización. Crearemos tu pipeline inicial automáticamente.
        </p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="name">Nombre de la organización</Label>
            <Input
              id="name"
              placeholder="Acme Inc."
              className="mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>
          <Button type="submit" disabled={loading || !name.trim()} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear workspace"}
          </Button>
        </form>
      </div>
    </div>
  );
}
