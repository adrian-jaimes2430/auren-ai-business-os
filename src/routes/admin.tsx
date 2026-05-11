import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shield, Users, CreditCard, Building2, BarChart3, LogOut, Search, Loader2, MoreHorizontal, CheckCircle2, XCircle, PauseCircle, PlayCircle, Sparkles } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/admin")({
  component: AdminPanelWrapper,
  head: () => ({ meta: [{ title: "Admin · A&O Ecosystem" }] }),
});

function AdminPanelWrapper() {
  return (
    <AuthGuard requireSuperAdmin>
      <AdminPanel />
    </AuthGuard>
  );
}

type PlanType = "starter" | "pro" | "business" | "enterprise";
type SubStatus = "trial" | "pending" | "active" | "past_due" | "suspended" | "canceled";

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  owner_id: string;
  created_at: string;
  member_count: number;
  owner_email: string | null;
  subscription: {
    id: string;
    plan: PlanType;
    status: SubStatus;
    trial_ends_at: string | null;
    current_period_end: string | null;
    mrr_cents: number;
    notes: string | null;
  } | null;
};

const STATUS_META: Record<SubStatus, { label: string; tone: string }> = {
  trial:     { label: "Prueba",      tone: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
  pending:   { label: "Pendiente",   tone: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  active:    { label: "Activa",      tone: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  past_due:  { label: "Vencida",     tone: "bg-orange-500/10 text-orange-300 border-orange-500/20" },
  suspended: { label: "Suspendida",  tone: "bg-rose-500/10 text-rose-300 border-rose-500/20" },
  canceled:  { label: "Cancelada",   tone: "bg-muted text-muted-foreground border-border" },
};

const PLAN_PRICE: Record<PlanType, number> = { starter: 2900, pro: 7900, business: 12900, enterprise: 19900 };

function AdminPanel() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<OrgRow | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: orgsData }, { data: subs }, { data: members }, { data: profiles }, { count: profilesCount }] = await Promise.all([
        supabase.from("organizations").select("id,name,slug,plan,owner_id,created_at").order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("*"),
        supabase.from("organization_members").select("organization_id,user_id"),
        supabase.from("profiles").select("id,email,full_name"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);

      const subsByOrg = new Map((subs ?? []).map((s) => [s.organization_id, s]));
      const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
      const memberCountByOrg = new Map<string, number>();
      (members ?? []).forEach((m) => memberCountByOrg.set(m.organization_id, (memberCountByOrg.get(m.organization_id) ?? 0) + 1));

      const rows: OrgRow[] = (orgsData ?? []).map((o) => {
        const sub = subsByOrg.get(o.id);
        const owner = profileById.get(o.owner_id);
        return {
          id: o.id, name: o.name, slug: o.slug, plan: o.plan, owner_id: o.owner_id, created_at: o.created_at,
          member_count: memberCountByOrg.get(o.id) ?? 0,
          owner_email: owner?.email ?? null,
          subscription: sub ? {
            id: sub.id, plan: sub.plan as PlanType, status: sub.status as SubStatus,
            trial_ends_at: sub.trial_ends_at, current_period_end: sub.current_period_end,
            mrr_cents: sub.mrr_cents, notes: sub.notes,
          } : null,
        };
      });

      setOrgs(rows);
      setUsersCount(profilesCount ?? 0);
    } catch (err: any) {
      console.error("[admin] load failed", err);
      toast.error(err?.message ?? "Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSignOut = async () => { await signOut(); navigate({ to: "/login" }); };

  const filtered = useMemo(() => {
    return orgs.filter((o) => {
      if (statusFilter !== "all" && o.subscription?.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return o.name.toLowerCase().includes(q) || (o.owner_email ?? "").toLowerCase().includes(q) || o.slug.toLowerCase().includes(q);
    });
  }, [orgs, search, statusFilter]);

  const stats = useMemo(() => {
    const active = orgs.filter((o) => o.subscription?.status === "active").length;
    const trials = orgs.filter((o) => o.subscription?.status === "trial").length;
    const pending = orgs.filter((o) => o.subscription?.status === "pending").length;
    const mrr = orgs.reduce((acc, o) => acc + (o.subscription?.status === "active" ? o.subscription.mrr_cents : 0), 0);
    return { totalOrgs: orgs.length, active, trials, pending, mrr };
  }, [orgs]);

  const quickAction = async (org: OrgRow, patch: Record<string, any>, label: string) => {
    if (!org.subscription) return;
    const { error } = await supabase.from("subscriptions").update({ ...patch, assigned_by: user?.id ?? null }).eq("id", org.subscription.id);
    if (error) { toast.error(error.message); return; }
    toast.success(label);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 glass-strong sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-primary glow-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-semibold truncate">Admin · A&amp;O Ecosystem</div>
              <div className="text-xs text-muted-foreground truncate">Panel de gestión global</div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/app" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground">Workspace</Link>
            <button onClick={handleSignOut} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold">Visión global</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestiona organizaciones, suscripciones y trials.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Actualizar"}
          </Button>
        </div>

        <div className="mt-6 grid gap-3 grid-cols-2 lg:grid-cols-5">
          <StatCard icon={Building2} label="Organizaciones" value={stats.totalOrgs.toLocaleString()} />
          <StatCard icon={Users} label="Usuarios" value={usersCount.toLocaleString()} />
          <StatCard icon={Sparkles} label="En prueba" value={stats.trials.toLocaleString()} accent="text-blue-300" />
          <StatCard icon={CheckCircle2} label="Activas" value={stats.active.toLocaleString()} accent="text-emerald-300" />
          <StatCard icon={CreditCard} label="MRR" value={`$${(stats.mrr / 100).toLocaleString()}`} />
        </div>

        {stats.pending > 0 && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <BarChart3 className="h-5 w-5 text-amber-400 shrink-0" />
              <div className="text-sm min-w-0">
                <div className="font-medium">{stats.pending} suscripción(es) pendientes de aprobación</div>
                <div className="text-xs text-muted-foreground truncate">Revisa y asigna o rechaza desde la lista</div>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setStatusFilter("pending")}>Ver</Button>
          </div>
        )}

        <div className="mt-6 rounded-2xl glass overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="font-display text-lg font-semibold">Organizaciones</div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-8 h-9 w-full sm:w-56" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="trial">Prueba</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="past_due">Vencidas</SelectItem>
                  <SelectItem value="suspended">Suspendidas</SelectItem>
                  <SelectItem value="canceled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No hay organizaciones que coincidan</div>
          ) : (
            <div className="divide-y divide-border/60">
              {filtered.map((org) => {
                const sub = org.subscription;
                const meta = sub ? STATUS_META[sub.status] : { label: "Sin sub", tone: "bg-muted text-muted-foreground border-border" };
                const trialDays = sub?.trial_ends_at ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86400000)) : null;
                return (
                  <div key={org.id} className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-surface/40 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{org.name}</span>
                        <Badge className={`${meta.tone} border text-[10px]`} variant="outline">{meta.label}</Badge>
                        <Badge variant="outline" className="text-[10px] uppercase">{sub?.plan ?? org.plan}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        <span>{org.owner_email ?? "—"}</span>
                        <span>·</span>
                        <span>{org.member_count} miembro(s)</span>
                        <span>·</span>
                        <span>creada {formatDistanceToNow(new Date(org.created_at), { addSuffix: true, locale: es })}</span>
                        {sub?.status === "trial" && trialDays !== null && (
                          <><span>·</span><span className={trialDays <= 3 ? "text-amber-300" : ""}>trial: {trialDays}d restantes</span></>
                        )}
                        {sub && sub.mrr_cents > 0 && sub.status === "active" && (
                          <><span>·</span><span className="text-emerald-300">${(sub.mrr_cents / 100).toLocaleString()}/mes</span></>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {sub?.status === "pending" && (
                        <>
                          <Button size="sm" variant="default" onClick={() => quickAction(org, { status: "active", current_period_start: new Date().toISOString(), current_period_end: new Date(Date.now() + 30 * 86400000).toISOString() }, "Aprobada")}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Aprobar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => quickAction(org, { status: "canceled" }, "Rechazada")}>
                            <XCircle className="h-3.5 w-3.5 mr-1" />Rechazar
                          </Button>
                        </>
                      )}
                      {sub?.status === "active" && (
                        <Button size="sm" variant="outline" onClick={() => quickAction(org, { status: "suspended" }, "Suspendida")}>
                          <PauseCircle className="h-3.5 w-3.5 mr-1" />Suspender
                        </Button>
                      )}
                      {sub?.status === "suspended" && (
                        <Button size="sm" variant="outline" onClick={() => quickAction(org, { status: "active" }, "Reactivada")}>
                          <PlayCircle className="h-3.5 w-3.5 mr-1" />Reactivar
                        </Button>
                      )}
                      {sub?.status === "trial" && (
                        <Button size="sm" variant="outline" onClick={() => quickAction(org, { trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString() }, "Trial extendido +14d")}>
                          +14d
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setEditing(org)}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <EditDialog org={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} adminId={user?.id ?? null} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl glass p-4 sm:p-5">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-elevated">
        <Icon className={`h-4 w-4 ${accent ?? "text-primary"}`} />
      </div>
      <div className={`mt-3 sm:mt-4 font-display text-2xl sm:text-3xl font-semibold ${accent ?? ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function EditDialog({ org, onClose, onSaved, adminId }: { org: OrgRow | null; onClose: () => void; onSaved: () => void; adminId: string | null }) {
  const [plan, setPlan] = useState<PlanType>("starter");
  const [status, setStatus] = useState<SubStatus>("trial");
  const [mrr, setMrr] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!org) return;
    if (org.subscription) {
      setPlan(org.subscription.plan);
      setStatus(org.subscription.status);
      setMrr(String(org.subscription.mrr_cents / 100));
      setNotes(org.subscription.notes ?? "");
    } else {
      setPlan("starter"); setStatus("trial"); setMrr("0"); setNotes("");
    }
  }, [org]);

  if (!org) return null;

  const save = async () => {
    setSaving(true);
    try {
      const mrrCents = Math.round(parseFloat(mrr || "0") * 100);
      const payload: any = {
        organization_id: org.id, plan, status, mrr_cents: mrrCents, notes: notes || null, assigned_by: adminId,
      };
      if (status === "active") {
        payload.current_period_start = new Date().toISOString();
        payload.current_period_end = new Date(Date.now() + 30 * 86400000).toISOString();
      }
      const { error } = org.subscription
        ? await supabase.from("subscriptions").update(payload).eq("id", org.subscription.id)
        : await supabase.from("subscriptions").insert(payload);
      if (error) throw error;
      // Sync the legacy `plan` column on organizations for display in the workspace
      await supabase.from("organizations").update({ plan }).eq("id", org.id);
      toast.success("Suscripción actualizada");
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!org} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{org.name}</DialogTitle>
          <DialogDescription>{org.owner_email ?? "Sin email"} · {org.member_count} miembro(s)</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Plan</Label>
            <Select value={plan} onValueChange={(v) => { setPlan(v as PlanType); setMrr(String(PLAN_PRICE[v as PlanType] / 100)); }}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter ($29)</SelectItem>
                <SelectItem value="pro">Pro ($79)</SelectItem>
                <SelectItem value="business">Business ($129)</SelectItem>
                <SelectItem value="enterprise">Enterprise ($199)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as SubStatus)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Prueba</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="past_due">Vencida</SelectItem>
                <SelectItem value="suspended">Suspendida</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>MRR mensual ($)</Label>
            <Input type="number" min="0" step="1" value={mrr} onChange={(e) => setMrr(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Notas internas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1.5" placeholder="Anotaciones para el equipo..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
