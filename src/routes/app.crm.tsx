import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { useAuth } from "@/hooks/use-auth";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/app/crm")({ component: CRM });

type Stage = Database["public"]["Tables"]["pipeline_stages"]["Row"];
type Pipeline = Database["public"]["Tables"]["pipelines"]["Row"];
type Deal = Database["public"]["Tables"]["deals"]["Row"];

function CRM() {
  const { currentOrg, loading: orgLoading } = useOrganization();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function loadAll(orgId: string) {
    setLoading(true);
    const { data: pipes } = await supabase
      .from("pipelines")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true })
      .limit(1);
    const pipe = pipes?.[0] ?? null;
    setPipeline(pipe);
    if (!pipe) {
      setStages([]);
      setDeals([]);
      setLoading(false);
      return;
    }
    const [{ data: st }, { data: dl }] = await Promise.all([
      supabase.from("pipeline_stages").select("*").eq("pipeline_id", pipe.id).order("position"),
      supabase.from("deals").select("*").eq("pipeline_id", pipe.id).order("position"),
    ]);
    setStages(st ?? []);
    setDeals(dl ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (currentOrg) loadAll(currentOrg.id);
  }, [currentOrg?.id]);

  // Realtime
  useEffect(() => {
    if (!pipeline) return;
    const channel = supabase
      .channel(`deals:${pipeline.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deals", filter: `pipeline_id=eq.${pipeline.id}` },
        (payload) => {
          setDeals((prev) => {
            if (payload.eventType === "INSERT") {
              const n = payload.new as Deal;
              return prev.find((d) => d.id === n.id) ? prev : [...prev, n];
            }
            if (payload.eventType === "UPDATE") {
              const n = payload.new as Deal;
              return prev.map((d) => (d.id === n.id ? n : d));
            }
            if (payload.eventType === "DELETE") {
              const o = payload.old as Deal;
              return prev.filter((d) => d.id !== o.id);
            }
            return prev;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pipeline?.id]);

  const dealsByStage = useMemo(() => {
    const map = new Map<string, Deal[]>();
    for (const s of stages) map.set(s.id, []);
    for (const d of deals) {
      const arr = map.get(d.stage_id);
      if (arr) arr.push(d);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.position - b.position);
    return map;
  }, [stages, deals]);

  function onDragStart(e: DragStartEvent) {
    const d = deals.find((x) => x.id === e.active.id);
    if (d) setActiveDeal(d);
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = e;
    if (!over) return;
    const deal = deals.find((d) => d.id === active.id);
    if (!deal) return;
    const overStageId = String(over.id);
    if (deal.stage_id === overStageId) return;

    setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage_id: overStageId } : d)));
    const { error } = await supabase
      .from("deals")
      .update({ stage_id: overStageId })
      .eq("id", deal.id);
    if (error) {
      toast.error("No se pudo mover el negocio");
      setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage_id: deal.stage_id } : d)));
    }
  }

  if (orgLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando pipeline...
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold">CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pipeline?.name ?? "Pipeline"} · {deals.length} negocios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => currentOrg && loadAll(currentOrg.id)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Nuevo negocio
              </Button>
            </DialogTrigger>
            <CreateDealDialog
              orgId={currentOrg?.id}
              userId={user?.id}
              pipelineId={pipeline?.id}
              stages={stages}
              onCreated={(d) => {
                setDeals((prev) => [...prev, d]);
                setOpenCreate(false);
              }}
            />
          </Dialog>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="mt-8 grid gap-4 overflow-x-auto" style={{ gridTemplateColumns: `repeat(${stages.length || 1}, minmax(260px, 1fr))` }}>
          {stages.map((s) => (
            <StageColumn key={s.id} stage={s} deals={dealsByStage.get(s.id) ?? []} />
          ))}
        </div>
        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function StageColumn({ stage, deals }: { stage: Stage; deals: Deal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = deals.reduce((s, d) => s + Number(d.value || 0), 0);
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl glass p-4 min-h-[400px] transition-colors ${isOver ? "ring-2 ring-primary/60" : ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: stage.color ?? "var(--primary)" }} />
          <span className="text-sm font-medium">{stage.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">{deals.length}</span>
      </div>
      <div className="text-xs text-muted-foreground mb-3">
        ${total.toLocaleString("en-US")}
      </div>
      <div className="space-y-2">
        {deals.map((d) => (
          <DraggableDeal key={d.id} deal={d} />
        ))}
        {deals.length === 0 && (
          <div className="text-xs text-muted-foreground/70 text-center py-6 border border-dashed border-border rounded-xl">
            Arrastra un negocio aquí
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableDeal({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`outline-none ${isDragging ? "opacity-40" : ""}`}
    >
      <DealCard deal={deal} />
    </div>
  );
}

function DealCard({ deal, dragging }: { deal: Deal; dragging?: boolean }) {
  return (
    <div
      className={`rounded-xl bg-surface p-3 cursor-grab active:cursor-grabbing hover:bg-surface-elevated transition-colors ${dragging ? "shadow-2xl ring-1 ring-primary/40" : ""}`}
    >
      <div className="text-sm font-medium line-clamp-1">{deal.title}</div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{deal.currency}</span>
        <span className="text-xs font-medium text-primary">
          ${Number(deal.value).toLocaleString("en-US")}
        </span>
      </div>
    </div>
  );
}

function CreateDealDialog({
  orgId,
  userId,
  pipelineId,
  stages,
  onCreated,
}: {
  orgId?: string;
  userId?: string;
  pipelineId?: string;
  stages: Stage[];
  onCreated: (d: Deal) => void;
}) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("0");
  const [stageId, setStageId] = useState(stages[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!stageId && stages[0]) setStageId(stages[0].id);
  }, [stages, stageId]);

  async function submit() {
    if (!orgId || !pipelineId || !stageId || !title.trim()) {
      toast.error("Completa el título y la etapa");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("deals")
      .insert({
        organization_id: orgId,
        pipeline_id: pipelineId,
        stage_id: stageId,
        title: title.trim(),
        value: Number(value) || 0,
        owner_id: userId ?? null,
      })
      .select()
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error(error?.message ?? "No se pudo crear");
      return;
    }
    toast.success("Negocio creado");
    setTitle("");
    setValue("0");
    onCreated(data);
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nuevo negocio</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="title">Título</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Demo con Acme Corp" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="value">Valor (USD)</Label>
            <Input id="value" type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Etapa</Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger><SelectValue placeholder="Etapa" /></SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear negocio"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
