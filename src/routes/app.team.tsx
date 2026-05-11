import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Mail, MoreVertical, Plus, Shield, Trash2, Users, Copy, Check, Crown, UserCog, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type OrgRole = Database["public"]["Enums"]["org_role"];

export const Route = createFileRoute("/app/team")({
  component: TeamPage,
  head: () => ({ meta: [{ title: "Equipo — AUREN AI" }] }),
});

const ROLE_META: Record<OrgRole, { label: string; icon: any; tone: string }> = {
  owner: { label: "Propietario", icon: Crown, tone: "bg-amber-500/15 text-amber-400" },
  admin: { label: "Administrador", icon: Shield, tone: "bg-primary/15 text-primary" },
  supervisor: { label: "Supervisor", icon: UserCog, tone: "bg-violet-500/15 text-violet-400" },
  agent: { label: "Agente", icon: UserIcon, tone: "bg-emerald-500/15 text-emerald-400" },
};

type Member = {
  id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
  profile: { full_name: string | null; email: string | null; avatar_url: string | null } | null;
};

type Invitation = {
  id: string;
  email: string;
  role: OrgRole;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
};

function TeamPage() {
  const { currentOrg, currentRole } = useOrganization();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);

  const canManage = currentRole === "owner" || currentRole === "admin";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const load = async () => {
    if (!currentOrg) return;
    setLoading(true);
    const [m, i] = await Promise.all([
      supabase.from("organization_members").select("id, user_id, role, created_at").eq("organization_id", currentOrg.id),
      supabase.from("organization_invitations").select("id, email, role, token, status, expires_at, created_at")
        .eq("organization_id", currentOrg.id).eq("status", "pending").order("created_at", { ascending: false }),
    ]);
    const userIds = (m.data ?? []).map((x) => x.user_id);
    let profiles: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: p } = await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", userIds);
      profiles = Object.fromEntries((p ?? []).map((pp) => [pp.id, pp]));
    }
    setMembers((m.data ?? []).map((mm) => ({ ...(mm as any), profile: profiles[mm.user_id] ?? null })));
    setInvitations((i.data ?? []) as Invitation[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [currentOrg?.id]);

  useEffect(() => {
    if (!currentOrg) return;
    const ch = supabase
      .channel(`team-${currentOrg.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "organization_members", filter: `organization_id=eq.${currentOrg.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "organization_invitations", filter: `organization_id=eq.${currentOrg.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [currentOrg?.id]);

  const updateRole = async (m: Member, role: OrgRole) => {
    const { error } = await supabase.from("organization_members").update({ role }).eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Rol actualizado");
  };

  const removeMember = async () => {
    if (!removeTarget) return;
    const { error } = await supabase.from("organization_members").delete().eq("id", removeTarget.id);
    if (error) return toast.error(error.message);
    toast.success("Miembro eliminado");
    setRemoveTarget(null);
  };

  const revokeInvite = async (inv: Invitation) => {
    const { error } = await supabase.from("organization_invitations").update({ status: "revoked" }).eq("id", inv.id);
    if (error) return toast.error(error.message);
    toast.success("Invitación revocada");
  };

  const counts = useMemo(() => ({
    total: members.length,
    admins: members.filter((m) => m.role === "owner" || m.role === "admin").length,
    pending: invitations.length,
  }), [members, invitations]);

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary glow-primary">
              <Users className="h-4 w-4 text-primary-foreground" />
            </span>
            Equipo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Miembros, roles e invitaciones de {currentOrg?.name}</p>
        </div>
        {canManage && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Invitar miembro</Button>
            </DialogTrigger>
            <InviteDialog
              orgId={currentOrg!.id}
              userId={user!.id}
              baseUrl={baseUrl}
              onClose={() => setInviteOpen(false)}
              onCreated={() => { setInviteOpen(false); load(); }}
            />
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label="Miembros" value={counts.total} />
        <StatCard icon={Shield} label="Administradores" value={counts.admins} />
        <StatCard icon={Mail} label="Invitaciones pendientes" value={counts.pending} />
      </div>

      {/* Members table */}
      <div className="mt-6 rounded-2xl glass overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
          <div className="font-display font-semibold">Miembros activos</div>
          <span className="text-xs text-muted-foreground">{members.length} en total</span>
        </div>
        {loading ? (
          <div className="p-6 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Aún no hay miembros</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border/60">
              <tr>
                <th className="px-6 py-3">Miembro</th>
                <th className="px-6 py-3">Rol</th>
                <th className="px-6 py-3">Desde</th>
                <th className="px-6 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const Meta = ROLE_META[m.role];
                const isSelf = m.user_id === user?.id;
                const canEdit = canManage && !isSelf && m.role !== "owner";
                return (
                  <tr key={m.id} className="border-b border-border/40 hover:bg-surface transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold">
                          {(m.profile?.full_name || m.profile?.email || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {m.profile?.full_name || m.profile?.email || "Usuario"}
                            {isSelf && <span className="text-xs text-muted-foreground">(tú)</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">{m.profile?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {canEdit ? (
                        <Select value={m.role} onValueChange={(v) => updateRole(m, v as OrgRole)}>
                          <SelectTrigger className="w-40 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(["admin", "supervisor", "agent"] as OrgRole[]).map((r) => (
                              <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${Meta.tone}`}>
                          <Meta.icon className="h-3 w-3" /> {Meta.label}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setRemoveTarget(m)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Eliminar del equipo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending invitations */}
      {canManage && (
        <div className="mt-6 rounded-2xl glass overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
            <div className="font-display font-semibold">Invitaciones pendientes</div>
            <span className="text-xs text-muted-foreground">{invitations.length}</span>
          </div>
          {invitations.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No hay invitaciones pendientes</div>
          ) : (
            <div className="divide-y divide-border/40">
              {invitations.map((inv) => (
                <InviteRow key={inv.id} inv={inv} baseUrl={baseUrl} onRevoke={() => revokeInvite(inv)} />
              ))}
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.profile?.full_name || removeTarget?.profile?.email} perderá acceso a esta organización inmediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={removeMember} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-elevated">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="font-display text-2xl font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

function InviteRow({ inv, baseUrl, onRevoke }: { inv: Invitation; baseUrl: string; onRevoke: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = `${baseUrl}/invite/${inv.token}`;
  const Meta = ROLE_META[inv.role];
  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Enlace copiado");
    setTimeout(() => setCopied(false), 1800);
  };
  const expiresIn = Math.max(0, Math.ceil((new Date(inv.expires_at).getTime() - Date.now()) / 86400000));
  return (
    <div className="px-6 py-4 flex items-center gap-4 hover:bg-surface transition-colors">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-surface-elevated">
        <Mail className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{inv.email}</div>
        <div className="text-xs text-muted-foreground">Expira en {expiresIn} día{expiresIn === 1 ? "" : "s"}</div>
      </div>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${Meta.tone}`}>
        <Meta.icon className="h-3 w-3" /> {Meta.label}
      </span>
      <Button variant="outline" size="sm" onClick={copy} className="gap-2">
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copiado" : "Copiar enlace"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onRevoke} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Revocar invitación
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function InviteDialog({ orgId, userId, baseUrl, onClose, onCreated }: {
  orgId: string; userId: string; baseUrl: string; onClose: () => void; onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("agent");
  const [submitting, setSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase.from("organization_invitations")
      .insert({ organization_id: orgId, email: email.trim().toLowerCase(), role, invited_by: userId })
      .select("token").single();
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setCreatedLink(`${baseUrl}/invite/${data.token}`);
    toast.success("Invitación creada");
  };

  const copy = async () => {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    toast.success("Enlace copiado");
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Invitar miembro</DialogTitle>
        <DialogDescription>Envía un enlace seguro de invitación. Expira en 14 días.</DialogDescription>
      </DialogHeader>
      {createdLink ? (
        <div className="space-y-3">
          <Label>Enlace de invitación</Label>
          <div className="flex gap-2">
            <Input readOnly value={createdLink} onFocus={(e) => e.currentTarget.select()} />
            <Button onClick={copy} variant="outline"><Copy className="h-4 w-4" /></Button>
          </div>
          <p className="text-xs text-muted-foreground">Compártelo con la persona invitada. Deberá iniciar sesión con el email <span className="text-foreground font-medium">{email}</span> para aceptarla.</p>
          <DialogFooter>
            <Button onClick={() => { setCreatedLink(null); setEmail(""); onCreated(); }}>Listo</Button>
          </DialogFooter>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@empresa.com" className="mt-1.5" />
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador · acceso total</SelectItem>
                <SelectItem value="supervisor">Supervisor · gestiona equipo y datos</SelectItem>
                <SelectItem value="agent">Agente · opera CRM e Inbox</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Creando…" : "Crear invitación"}</Button>
          </DialogFooter>
        </form>
      )}
    </DialogContent>
  );
}
