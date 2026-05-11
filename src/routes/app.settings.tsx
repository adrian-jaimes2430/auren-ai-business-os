import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Building2, User as UserIcon, Palette, CreditCard, Globe, Upload, Loader2, Check, Sparkles,
  Settings as Cog, Shield, Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Ajustes — AUREN AI" }] }),
});

import { PLANS, PLAN_BY_ID, planRank, type PlanId } from "@/config/plans";
import { useSubscription } from "@/hooks/use-subscription";
import { usePaddleCheckout } from "@/hooks/use-paddle-checkout";
import { useServerFn } from "@tanstack/react-start";
import { changePlan, cancelSubscription, createPortalSession } from "@/utils/payments.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TIMEZONES = ["UTC", "America/Mexico_City", "America/Bogota", "America/Argentina/Buenos_Aires", "America/Lima", "America/Santiago", "Europe/Madrid", "America/New_York", "America/Los_Angeles"];
const LOCALES = [{ id: "es", label: "Español" }, { id: "en", label: "English" }, { id: "pt", label: "Português" }];

function SettingsPage() {
  const { currentOrg, currentRole, refresh } = useOrganization();
  const canManageOrg = currentRole === "owner" || currentRole === "admin";

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary glow-primary">
          <Cog className="h-4 w-4 text-primary-foreground" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold">Ajustes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Organización, perfil, branding y plan</p>
        </div>
      </div>

      <Tabs defaultValue="organization" className="mt-8">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="organization" className="gap-2"><Building2 className="h-4 w-4" /> Organización</TabsTrigger>
          <TabsTrigger value="profile" className="gap-2"><UserIcon className="h-4 w-4" /> Perfil</TabsTrigger>
          <TabsTrigger value="branding" className="gap-2"><Palette className="h-4 w-4" /> Branding</TabsTrigger>
          <TabsTrigger value="plan" className="gap-2"><CreditCard className="h-4 w-4" /> Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-6">
          {currentOrg && <OrgSettings orgId={currentOrg.id} canManage={canManageOrg} onSaved={refresh} />}
        </TabsContent>
        <TabsContent value="profile" className="mt-6">
          <ProfileSettings />
        </TabsContent>
        <TabsContent value="branding" className="mt-6">
          {currentOrg && <BrandingSettings orgId={currentOrg.id} canManage={canManageOrg} onSaved={refresh} />}
        </TabsContent>
        <TabsContent value="plan" className="mt-6">
          {currentOrg && <PlanSettings orgId={currentOrg.id} currentPlan={currentOrg.plan} canManage={canManageOrg} onSaved={refresh} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Organization ---------------- */
function OrgSettings({ orgId, canManage, onSaved }: { orgId: string; canManage: boolean; onSaved: () => void }) {
  const [data, setData] = useState({ name: "", website: "", timezone: "UTC", locale: "es" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: org } = await supabase.from("organizations").select("name, website, timezone, locale").eq("id", orgId).maybeSingle();
      if (org) setData({ name: org.name ?? "", website: org.website ?? "", timezone: org.timezone ?? "UTC", locale: org.locale ?? "es" });
      setLoading(false);
    })();
  }, [orgId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("organizations").update(data).eq("id", orgId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Cambios guardados");
    onSaved();
  };

  return (
    <SettingsCard title="Información de la organización" description="Estos datos aparecen en tu workspace y comunicaciones.">
      {loading ? <FormSkeleton /> : (
        <div className="grid gap-5">
          <Field label="Nombre">
            <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} disabled={!canManage} />
          </Field>
          <Field label="Sitio web">
            <Input type="url" placeholder="https://..." value={data.website} onChange={(e) => setData({ ...data, website: e.target.value })} disabled={!canManage} />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Zona horaria">
              <Select value={data.timezone} onValueChange={(v) => setData({ ...data, timezone: v })} disabled={!canManage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Idioma">
              <Select value={data.locale} onValueChange={(v) => setData({ ...data, locale: v })} disabled={!canManage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LOCALES.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          {canManage && (
            <div className="flex justify-end pt-2">
              <Button onClick={save} disabled={saving}>{saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando…</> : "Guardar cambios"}</Button>
            </div>
          )}
        </div>
      )}
    </SettingsCard>
  );
}

/* ---------------- Profile ---------------- */
function ProfileSettings() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState({ full_name: "", avatar_url: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle();
      if (p) setData({ full_name: p.full_name ?? "", avatar_url: p.avatar_url ?? "" });
      setLoading(false);
    })();
  }, [user]);

  const upload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `user/${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("branding").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data: pub } = supabase.storage.from("branding").getPublicUrl(path);
    setData((d) => ({ ...d, avatar_url: pub.publicUrl }));
    setUploading(false);
    toast.success("Avatar cargado");
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: data.full_name, avatar_url: data.avatar_url || null }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil actualizado");
  };

  return (
    <SettingsCard title="Tu perfil" description="Cómo te ven el resto de los miembros del equipo.">
      {loading ? <FormSkeleton /> : (
        <div className="grid gap-5">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-primary text-primary-foreground grid place-items-center text-xl font-semibold">
              {data.avatar_url ? <img src={data.avatar_url} alt="avatar" className="h-full w-full object-cover" /> : (data.full_name || user?.email || "?").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Subiendo…" : "Cambiar avatar"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">PNG o JPG · máx 2MB recomendado</p>
            </div>
          </div>
          <Field label="Nombre completo">
            <Input value={data.full_name} onChange={(e) => setData({ ...data, full_name: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={user?.email ?? ""} disabled />
          </Field>
          <div className="flex justify-end pt-2">
            <Button onClick={save} disabled={saving}>{saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando…</> : "Guardar perfil"}</Button>
          </div>
        </div>
      )}
    </SettingsCard>
  );
}

/* ---------------- Branding ---------------- */
const BRAND_PRESETS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

function BrandingSettings({ orgId, canManage, onSaved }: { orgId: string; canManage: boolean; onSaved: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState({ logo_url: "", brand_color: "#ef4444", name: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: o } = await supabase.from("organizations").select("name, logo_url, brand_color").eq("id", orgId).maybeSingle();
      if (o) setData({ name: o.name, logo_url: o.logo_url ?? "", brand_color: o.brand_color ?? "#ef4444" });
      setLoading(false);
    })();
  }, [orgId]);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("El archivo debe ser una imagen (PNG, JPG, SVG, WEBP)");
    if (file.size > 5 * 1024 * 1024) return toast.error("El logo no puede superar los 5 MB");

    // Instant local preview while uploading
    const previewUrl = URL.createObjectURL(file);
    setData((d) => ({ ...d, logo_url: previewUrl }));
    setUploading(true);

    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `org/${orgId}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("branding")
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("branding").getPublicUrl(path);
      const finalUrl = `${pub.publicUrl}?t=${Date.now()}`;
      // Persist immediately so refresh keeps the logo
      const { error: updErr } = await supabase
        .from("organizations")
        .update({ logo_url: finalUrl })
        .eq("id", orgId);
      if (updErr) throw updErr;
      URL.revokeObjectURL(previewUrl);
      setData((d) => ({ ...d, logo_url: finalUrl }));
      toast.success("Logo cargado");
      onSaved();
    } catch (err: any) {
      URL.revokeObjectURL(previewUrl);
      setData((d) => ({ ...d, logo_url: "" }));
      toast.error(err?.message ?? "No se pudo subir el logo");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("organizations").update({ logo_url: data.logo_url || null, brand_color: data.brand_color }).eq("id", orgId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Branding guardado");
    onSaved();
  };

  return (
    <SettingsCard title="Branding" description="Personaliza la identidad visual de tu workspace.">
      {loading ? <FormSkeleton /> : (
        <div className="grid gap-6">
          <div>
            <Label>Logo</Label>
            <div className="mt-2 flex items-center gap-5">
              <div className="h-20 w-20 rounded-2xl overflow-hidden border border-border/60 grid place-items-center" style={{ background: data.brand_color }}>
                {data.logo_url ? <img src={data.logo_url} alt="logo" className="h-full w-full object-contain" /> : <Sparkles className="h-7 w-7 text-white" />}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading || !canManage} className="gap-2">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Subiendo…" : "Cargar logo"}
                </Button>
                {data.logo_url && canManage && (
                  <Button variant="ghost" onClick={() => setData({ ...data, logo_url: "" })} className="ml-2">Quitar</Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label>Color de marca</Label>
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {BRAND_PRESETS.map((c) => (
                <button key={c} type="button" onClick={() => canManage && setData({ ...data, brand_color: c })}
                  className={`h-10 w-10 rounded-xl border-2 transition-all ${data.brand_color === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ background: c }}>
                  {data.brand_color === c && <Check className="h-4 w-4 text-white mx-auto" />}
                </button>
              ))}
              <Input type="color" value={data.brand_color} onChange={(e) => setData({ ...data, brand_color: e.target.value })} disabled={!canManage} className="h-10 w-20 p-1 cursor-pointer" />
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-2xl border border-border/60 p-5">
            <Label className="text-xs text-muted-foreground">Vista previa</Label>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg grid place-items-center overflow-hidden" style={{ background: data.brand_color }}>
                {data.logo_url ? <img src={data.logo_url} className="h-full w-full object-contain" /> : <Sparkles className="h-5 w-5 text-white" />}
              </div>
              <div>
                <div className="font-display font-semibold">{data.name}</div>
                <div className="text-xs text-muted-foreground">tu workspace AUREN AI</div>
              </div>
            </div>
          </div>

          {canManage && (
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>{saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando…</> : "Guardar branding"}</Button>
            </div>
          )}
        </div>
      )}
    </SettingsCard>
  );
}

/* ---------------- Plan ---------------- */
function PlanSettings({ orgId, currentPlan, canManage, onSaved }: { orgId: string; currentPlan: string; canManage: boolean; onSaved: () => void }) {
  const { user } = useAuth();
  const { subscription, isPaid, refresh: refreshSub } = useSubscription(orgId);
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const changePlanFn = useServerFn(changePlan);
  const cancelFn = useServerFn(cancelSubscription);
  const portalFn = useServerFn(createPortalSession);

  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  // Auto-open checkout if redirected from /pricing or /register with ?upgrade=
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const upgrade = params.get("upgrade") as PlanId | null;
    if (upgrade && PLAN_BY_ID[upgrade] && canManage && !isPaid) {
      handleSelect(upgrade);
      params.delete("upgrade");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, isPaid]);

  const handleSelect = async (planId: PlanId) => {
    if (!user || !canManage) return;
    const plan = PLAN_BY_ID[planId];
    setBusyPlan(planId);
    try {
      // No active Paddle subscription -> open new checkout
      if (!isPaid || !subscription?.paddle_subscription_id) {
        await openCheckout({
          priceId: plan.priceId,
          organizationId: orgId,
          customerEmail: user.email ?? undefined,
        });
        return;
      }
      // Already subscribed -> upgrade or downgrade
      const currentRank = planRank(currentPlan as PlanId);
      const targetRank = planRank(planId);
      if (currentRank === targetRank) return;
      const mode: "upgrade" | "downgrade" = targetRank > currentRank ? "upgrade" : "downgrade";
      await changePlanFn({
        data: {
          subscriptionId: subscription.paddle_subscription_id,
          newPriceId: plan.priceId,
          mode,
          environment: getPaddleEnvironment(),
        },
      });
      toast.success(
        mode === "upgrade"
          ? `Upgrade a ${plan.name} aplicado (prorrateado).`
          : `Downgrade a ${plan.name} programado al final del periodo.`,
      );
      await refreshSub();
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo cambiar el plan");
    } finally {
      setBusyPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!subscription?.paddle_subscription_id) return;
    try {
      await cancelFn({
        data: {
          subscriptionId: subscription.paddle_subscription_id,
          environment: getPaddleEnvironment(),
        },
      });
      toast.success("Suscripción cancelada. Volverás al plan Starter.");
      await refreshSub();
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo cancelar");
    } finally {
      setConfirmCancel(false);
    }
  };

  const handlePortal = async () => {
    if (!subscription?.paddle_customer_id || !subscription?.paddle_subscription_id) return;
    setOpeningPortal(true);
    try {
      const res = await portalFn({
        data: {
          customerId: subscription.paddle_customer_id,
          subscriptionIds: [subscription.paddle_subscription_id],
          environment: getPaddleEnvironment(),
        },
      });
      window.open(res.overviewUrl, "_blank", "noopener");
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo abrir el portal");
    } finally {
      setOpeningPortal(false);
    }
  };

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;

  return (
    <SettingsCard title="Plan & Facturación" description="Suscríbete, cambia o cancela en cualquier momento. Pagos seguros con Paddle.">
      {subscription && (
        <div className="mb-5 rounded-xl bg-surface p-4 text-sm flex flex-wrap items-center gap-3 justify-between">
          <div>
            <span className="text-muted-foreground">Estado: </span>
            <span className="font-medium uppercase tracking-wide">{subscription.status}</span>
            {periodEnd && <span className="text-muted-foreground"> · Renueva {periodEnd}</span>}
            {subscription.cancel_at_period_end && (
              <span className="ml-2 text-amber-300">· cambio programado al final del periodo</span>
            )}
          </div>
          {isPaid && subscription.paddle_customer_id && (
            <Button size="sm" variant="outline" onClick={handlePortal} disabled={openingPortal}>
              {openingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gestionar facturación"}
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p) => {
          const active = p.id === currentPlan;
          const busy = busyPlan === p.id || (checkoutLoading && busyPlan === p.id);
          return (
            <div key={p.id} className={`rounded-2xl border p-5 transition-all flex flex-col ${active ? "border-primary bg-primary/5" : "border-border/60 hover:border-border"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-lg font-semibold flex items-center gap-2">
                    {p.name}
                    {p.popular && <span className="text-[10px] uppercase tracking-wider rounded-full bg-gradient-primary text-primary-foreground px-2 py-0.5">Popular</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-semibold">${p.priceUSD}</div>
                  <div className="text-[11px] text-muted-foreground">/ mes</div>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSelect(p.id)}
                disabled={!canManage || active || busy}
                variant={active ? "outline" : "default"}
                className="w-full mt-5"
              >
                {active
                  ? "Plan activo"
                  : busy
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando…</>
                    : isPaid
                      ? (planRank(p.id) > planRank(currentPlan as PlanId) ? "Hacer upgrade" : "Hacer downgrade")
                      : "Suscribirme"}
              </Button>
            </div>
          );
        })}
      </div>

      {isPaid && canManage && subscription?.paddle_subscription_id && (
        <div className="mt-6 flex justify-end">
          <Button variant="ghost" className="text-destructive" onClick={() => setConfirmCancel(true)}>
            Cancelar suscripción
          </Button>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-surface p-4 text-xs text-muted-foreground flex items-start gap-3">
        <Shield className="h-4 w-4 text-primary mt-0.5" />
        <div>
          Los upgrades se aplican de inmediato (prorrateados). Los downgrades se programan al final del periodo. Las cancelaciones son inmediatas y vuelves a Starter.
        </div>
      </div>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar suscripción</AlertDialogTitle>
            <AlertDialogDescription>
              Tu plan {PLAN_BY_ID[currentPlan as PlanId]?.name ?? currentPlan} se cancelará inmediatamente y volverás al plan Starter. Perderás acceso a las funciones premium.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsCard>
  );
}

/* ---------------- Helpers ---------------- */
function SettingsCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl glass p-6">
      <div className="font-display text-lg font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{description}</div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function FormSkeleton() {
  return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 rounded-md bg-surface animate-pulse" />)}</div>;
}
