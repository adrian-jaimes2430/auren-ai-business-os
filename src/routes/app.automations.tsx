import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2, Plus, Power, Workflow, Trash2, Pencil, Play, ArrowDown,
  UserPlus, MessageSquare, Briefcase, Tag, Hand, Mail, Bell, Bot, Webhook, Clock, GitBranch,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { useAuth } from "@/hooks/use-auth";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/app/automations")({ component: AutomationsPage });

type Trigger = Database["public"]["Enums"]["automation_trigger"];
type Automation = Database["public"]["Tables"]["automations"]["Row"];

type ActionType =
  | "send_email" | "send_message" | "create_task" | "ai_reply"
  | "add_tag" | "notify_team" | "webhook" | "wait" | "branch";

type Step = { id: string; type: ActionType; config: Record<string, unknown> };

const TRIGGERS: { id: Trigger; label: string; icon: typeof UserPlus; desc: string }[] = [
  { id: "contact_created", label: "Contacto creado", icon: UserPlus, desc: "Cuando se añade un nuevo contacto" },
  { id: "deal_created", label: "Negocio creado", icon: Briefcase, desc: "Cuando se crea un nuevo negocio" },
  { id: "deal_stage_changed", label: "Cambio de etapa", icon: GitBranch, desc: "Cuando un negocio cambia de etapa" },
  { id: "message_received", label: "Mensaje recibido", icon: MessageSquare, desc: "Cuando llega un mensaje entrante" },
  { id: "tag_added", label: "Etiqueta añadida", icon: Tag, desc: "Cuando se añade una etiqueta a un contacto" },
  { id: "manual", label: "Disparo manual", icon: Hand, desc: "Se ejecuta solo cuando lo ejecutas manualmente" },
];

const ACTIONS: { id: ActionType; label: string; icon: typeof Mail; color: string }[] = [
  { id: "send_email",    label: "Enviar email",         icon: Mail,         color: "text-blue-400" },
  { id: "send_message",  label: "Enviar mensaje",       icon: MessageSquare,color: "text-emerald-400" },
  { id: "ai_reply",      label: "Responder con IA",     icon: Bot,          color: "text-violet-400" },
  { id: "create_task",   label: "Crear tarea",          icon: Briefcase,    color: "text-amber-400" },
  { id: "add_tag",       label: "Añadir etiqueta",      icon: Tag,          color: "text-pink-400" },
  { id: "notify_team",   label: "Notificar al equipo",  icon: Bell,         color: "text-sky-400" },
  { id: "webhook",       label: "Llamar webhook",       icon: Webhook,      color: "text-indigo-400" },
  { id: "wait",          label: "Esperar",              icon: Clock,        color: "text-muted-foreground" },
  { id: "branch",        label: "Condición / rama",     icon: GitBranch,    color: "text-orange-400" },
];

function triggerMeta(t: Trigger) { return TRIGGERS.find((x) => x.id === t)!; }
function actionMeta(a: ActionType) { return ACTIONS.find((x) => x.id === a)!; }
function uid() { return Math.random().toString(36).slice(2, 10); }

function AutomationsPage() {
  const { currentOrg, loading: orgLoading } = useOrganization();
  const [items, setItems] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Automation | null>(null);

  async function load(orgId: string) {
    setLoading(true);
    const { data } = await supabase
      .from("automations")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => { if (currentOrg) load(currentOrg.id); }, [currentOrg?.id]);

  useEffect(() => {
    if (!currentOrg) return;
    const ch = supabase
      .channel(`automations:${currentOrg.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "automations", filter: `organization_id=eq.${currentOrg.id}` },
        () => load(currentOrg.id),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [currentOrg?.id]);

  async function toggleActive(a: Automation) {
    const { error } = await supabase.from("automations").update({ is_active: !a.is_active }).eq("id", a.id);
    if (error) toast.error("No se pudo actualizar");
    else toast.success(!a.is_active ? "Automatización activada" : "Automatización pausada");
  }

  async function handleDelete() {
    if (!toDelete) return;
    const id = toDelete.id; setToDelete(null);
    const { error } = await supabase.from("automations").delete().eq("id", id);
    if (error) toast.error("No se pudo eliminar"); else toast.success("Eliminada");
  }

  if (orgLoading || loading) {
    return <div className="p-8 flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Cargando automatizaciones...
    </div>;
  }

  const active = items.filter((i) => i.is_active).length;

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold">Automatizaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} workflows · {active} activos
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nueva automatización
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl glass p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-primary grid place-items-center glow-primary">
            <Workflow className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="mt-4 font-display text-xl">Crea tu primera automatización</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Conecta triggers y acciones para automatizar respuestas, asignaciones, recordatorios y más.
          </p>
          <Button className="mt-5" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nueva automatización
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((a) => {
            const t = triggerMeta(a.trigger);
            const steps = (a.steps as Step[]) ?? [];
            return (
              <div key={a.id} className="rounded-2xl glass p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-surface-elevated grid place-items-center">
                      <t.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{t.label}</div>
                    </div>
                  </div>
                  <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a)} />
                </div>
                {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {steps.slice(0, 4).map((s) => {
                    const am = actionMeta(s.type);
                    return (
                      <Badge key={s.id} variant="secondary" className="gap-1 text-[10px]">
                        <am.icon className={`h-3 w-3 ${am.color}`} /> {am.label}
                      </Badge>
                    );
                  })}
                  {steps.length === 0 && <span className="text-[10px] text-muted-foreground">Sin pasos</span>}
                  {steps.length > 4 && <Badge variant="outline" className="text-[10px]">+{steps.length - 4}</Badge>}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
                  <span>
                    {a.run_count} ejecuciones
                    {a.last_run_at && ` · última ${formatDistanceToNow(new Date(a.last_run_at), { addSuffix: true, locale: es })}`}
                  </span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(a); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setToDelete(a)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BuilderSheet
        open={open}
        onOpenChange={setOpen}
        orgId={currentOrg?.id}
        initial={editing}
        onSaved={() => { setOpen(false); setEditing(null); }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar automatización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente. "{toDelete?.name}" dejará de ejecutarse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BuilderSheet({
  open, onOpenChange, orgId, initial, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  orgId?: string;
  initial: Automation | null;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<Trigger>("contact_created");
  const [steps, setSteps] = useState<Step[]>([]);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setTrigger((initial?.trigger as Trigger) ?? "contact_created");
      setSteps(((initial?.steps as Step[]) ?? []).map((s) => ({ ...s, id: s.id ?? uid() })));
    }
  }, [open, initial?.id]);

  function addStep(type: ActionType) {
    setSteps((prev) => [...prev, { id: uid(), type, config: defaultConfig(type) }]);
  }
  function updateStep(id: string, patch: Partial<Step>) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch, config: { ...s.config, ...(patch.config ?? {}) } } : s)));
  }
  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }
  function move(id: string, dir: -1 | 1) {
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function save() {
    if (!orgId || !name.trim()) { toast.error("El nombre es requerido"); return; }
    setSaving(true);
    const payload = {
      organization_id: orgId,
      name: name.trim(),
      description: description.trim() || null,
      trigger,
      trigger_config: {},
      steps: steps as unknown as Database["public"]["Tables"]["automations"]["Insert"]["steps"],
      created_by: user?.id ?? null,
    };
    const { error } = initial
      ? await supabase.from("automations").update(payload).eq("id", initial.id)
      : await supabase.from("automations").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(initial ? "Workflow guardado" : "Workflow creado");
    onSaved();
  }

  async function testRun() {
    if (!initial || !orgId) { toast.message("Guarda primero para poder ejecutar"); return; }
    setRunning(true);
    const { error } = await supabase.from("automation_runs").insert({
      organization_id: orgId,
      automation_id: initial.id,
      status: "success",
      payload: { manual: true },
      result: { steps_executed: steps.length },
    });
    if (!error) {
      await supabase.from("automations")
        .update({ run_count: (initial.run_count ?? 0) + 1, last_run_at: new Date().toISOString() })
        .eq("id", initial.id);
    }
    setRunning(false);
    if (error) toast.error("Error al ejecutar"); else toast.success("Ejecución registrada");
  }

  const tMeta = triggerMeta(trigger);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <SheetHeader className="p-6 border-b border-border/60 sticky top-0 z-10 glass-strong">
          <SheetTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            {initial ? "Editar workflow" : "Nuevo workflow"}
          </SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Meta */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Bienvenida a nuevos leads" />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          {/* Trigger */}
          <section>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Cuando ocurre…</h3>
              <Badge variant="outline" className="gap-1"><Power className="h-3 w-3" /> Trigger</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {TRIGGERS.map((t) => {
                const active = trigger === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTrigger(t.id)}
                    className={`text-left rounded-xl p-3 border transition-all ${
                      active ? "border-primary bg-primary/10 glow-primary" : "border-border hover:border-primary/40 bg-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <t.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{t.label}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Steps timeline */}
          <section>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Entonces ejecuta…</h3>
              <span className="text-xs text-muted-foreground">{steps.length} paso{steps.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="mt-3 space-y-2">
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 flex items-center gap-3">
                <tMeta.icon className="h-4 w-4 text-primary" />
                <div className="text-xs">
                  <div className="font-medium">Trigger: {tMeta.label}</div>
                  <div className="text-muted-foreground">{tMeta.desc}</div>
                </div>
              </div>

              {steps.map((s, i) => (
                <div key={s.id}>
                  <div className="flex justify-center py-1"><ArrowDown className="h-3 w-3 text-muted-foreground" /></div>
                  <StepCard
                    index={i + 1}
                    step={s}
                    onChange={(patch) => updateStep(s.id, patch)}
                    onRemove={() => removeStep(s.id)}
                    onMove={(dir) => move(s.id, dir)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-2">Añadir acción</div>
              <div className="flex flex-wrap gap-2">
                {ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => addStep(a.id)}
                    className="text-xs rounded-lg px-3 py-2 border border-border bg-surface hover:border-primary/40 hover:bg-surface-elevated transition-all flex items-center gap-2"
                  >
                    <a.icon className={`h-3.5 w-3.5 ${a.color}`} /> {a.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-border/60 sticky bottom-0 glass-strong flex justify-between gap-2">
          <Button variant="outline" onClick={testRun} disabled={!initial || running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Play className="h-4 w-4 mr-1" /> Ejecutar test</>}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar workflow"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StepCard({
  index, step, onChange, onRemove, onMove,
}: {
  index: number;
  step: Step;
  onChange: (patch: Partial<Step>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const meta = actionMeta(step.type);
  return (
    <div className="rounded-xl bg-surface border border-border/60 p-3 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-surface-elevated grid place-items-center text-[10px] text-muted-foreground">{index}</div>
          <meta.icon className={`h-4 w-4 ${meta.color}`} />
          <Select value={step.type} onValueChange={(v) => onChange({ type: v as ActionType, config: defaultConfig(v as ActionType) })}>
            <SelectTrigger className="h-7 w-[180px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACTIONS.map((a) => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onMove(-1)}>↑</Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onMove(1)}>↓</Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onRemove}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        <StepConfig step={step} onChange={onChange} />
      </div>
    </div>
  );
}

function StepConfig({ step, onChange }: { step: Step; onChange: (patch: Partial<Step>) => void }) {
  const cfg = step.config as Record<string, string | number>;
  const set = (k: string, v: string | number) => onChange({ config: { [k]: v } });

  switch (step.type) {
    case "send_email":
      return <>
        <Input className="h-8 text-xs" placeholder="Asunto" value={(cfg.subject as string) ?? ""} onChange={(e) => set("subject", e.target.value)} />
        <Textarea rows={2} className="text-xs" placeholder="Cuerpo del email" value={(cfg.body as string) ?? ""} onChange={(e) => set("body", e.target.value)} />
      </>;
    case "send_message":
      return <Textarea rows={2} className="text-xs" placeholder="Mensaje a enviar" value={(cfg.message as string) ?? ""} onChange={(e) => set("message", e.target.value)} />;
    case "ai_reply":
      return <Textarea rows={2} className="text-xs" placeholder="Instrucciones para la IA (prompt)" value={(cfg.prompt as string) ?? ""} onChange={(e) => set("prompt", e.target.value)} />;
    case "create_task":
      return <Input className="h-8 text-xs" placeholder="Título de la tarea" value={(cfg.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} />;
    case "add_tag":
      return <Input className="h-8 text-xs" placeholder="Etiqueta" value={(cfg.tag as string) ?? ""} onChange={(e) => set("tag", e.target.value)} />;
    case "notify_team":
      return <Input className="h-8 text-xs" placeholder="Mensaje para el equipo" value={(cfg.message as string) ?? ""} onChange={(e) => set("message", e.target.value)} />;
    case "webhook":
      return <Input className="h-8 text-xs" placeholder="https://..." value={(cfg.url as string) ?? ""} onChange={(e) => set("url", e.target.value)} />;
    case "wait":
      return <div className="flex gap-2 items-center">
        <Input className="h-8 text-xs w-24" type="number" min="1" value={(cfg.amount as number) ?? 5} onChange={(e) => set("amount", Number(e.target.value))} />
        <Select value={(cfg.unit as string) ?? "minutes"} onValueChange={(v) => set("unit", v)}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="minutes">Minutos</SelectItem>
            <SelectItem value="hours">Horas</SelectItem>
            <SelectItem value="days">Días</SelectItem>
          </SelectContent>
        </Select>
      </div>;
    case "branch":
      return <Input className="h-8 text-xs" placeholder="Condición (ej: tag = 'vip')" value={(cfg.condition as string) ?? ""} onChange={(e) => set("condition", e.target.value)} />;
    default:
      return null;
  }
}

function defaultConfig(type: ActionType): Record<string, unknown> {
  switch (type) {
    case "send_email": return { subject: "", body: "" };
    case "send_message": return { message: "" };
    case "ai_reply": return { prompt: "" };
    case "create_task": return { title: "" };
    case "add_tag": return { tag: "" };
    case "notify_team": return { message: "" };
    case "webhook": return { url: "" };
    case "wait": return { amount: 5, unit: "minutes" };
    case "branch": return { condition: "" };
  }
}
