import { useEffect, useState } from "react";
import { Loader2, Mail, Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AurenLogo } from "@/components/brand/AurenLogo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type PendingInv = {
  id: string;
  token: string;
  role: string;
  organization_id: string;
  organization_name: string | null;
  expires_at: string;
};

/**
 * Shown when an authenticated user has no organization yet.
 * If they have pending invitations matching their email, they can join those
 * directly instead of being forced to create a new workspace.
 */
export function PendingInvitations({
  onJoined,
  onCreateNew,
}: {
  onJoined: () => void;
  onCreateNew: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<PendingInv[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("organization_invitations")
        .select("id, token, role, organization_id, expires_at, organizations:organizations(name)")
        .ilike("email", user.email)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString());
      if (error) {
        console.error("[PendingInvitations] load failed", error);
      } else {
        setInvites(
          (data ?? []).map((row: any) => ({
            id: row.id,
            token: row.token,
            role: row.role,
            organization_id: row.organization_id,
            organization_name: row.organizations?.name ?? null,
            expires_at: row.expires_at,
          })),
        );
      }
      setLoading(false);
    })();
  }, [user?.email]);

  const accept = async (inv: PendingInv) => {
    setAcceptingId(inv.id);
    const { data, error } = await supabase.rpc("accept_invitation", { _token: inv.token });
    setAcceptingId(null);
    if (error) {
      toast.error(error.message ?? "No se pudo aceptar la invitación");
      return;
    }
    if (data && typeof window !== "undefined") {
      localStorage.setItem("auren.currentOrgId", data as string);
    }
    toast.success(`Te uniste a ${inv.organization_name ?? "la organización"}`);
    onJoined();
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Buscando invitaciones…
        </div>
      </div>
    );
  }

  if (invites.length === 0) {
    // No pending invitations — defer to create-workspace flow.
    onCreateNew();
    return null;
  }

  return (
    <div className="min-h-screen grid place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <AurenLogo className="w-36" />
        <h1 className="mt-6 font-display text-3xl font-semibold">Tienes invitaciones pendientes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Únete al workspace de tu equipo en lugar de crear uno nuevo.
        </p>

        <div className="mt-6 space-y-3">
          {invites.map((inv) => (
            <div key={inv.id} className="rounded-xl glass p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium truncate">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{inv.organization_name ?? "Organización"}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 capitalize">
                  Rol: {inv.role}
                </div>
              </div>
              <Button size="sm" onClick={() => accept(inv)} disabled={acceptingId === inv.id}>
                {acceptingId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unirme"}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-border/60">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Invitaciones para {user?.email}
          </p>
          <Button variant="outline" className="w-full mt-3" onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" /> Crear un workspace nuevo
          </Button>
        </div>
      </div>
    </div>
  );
}
