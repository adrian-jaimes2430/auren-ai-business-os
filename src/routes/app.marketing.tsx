import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Megaphone, Plus, Send, Loader2, FileText, Mail, MessageCircle,
  CheckCircle2, XCircle, Clock, Trash2, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type Channel = Database["public"]["Enums"]["channel_type"];
type Template = Database["public"]["Tables"]["message_templates"]["Row"];
type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type ChannelRow = Database["public"]["Tables"]["channels"]["Row"];

export const Route = createFileRoute("/app/marketing")({
  component: MarketingPage,
  head: () => ({ meta: [{ title: "Marketing — AUREN AI" }] }),
});

const CHANNELS: Channel[] = ["whatsapp", "email", "sms", "instagram", "messenger", "webchat", "telegram"];

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: any }> = {
  draft: { label: "Borrador", cls: "bg-muted text-muted-foreground", icon: FileText },
  scheduled: { label: "Programada", cls: "bg-amber-500/10 text-amber-500", icon: Clock },
  running: { label: "Enviando", cls: "bg-blue-500/10 text-blue-500", icon: Loader2 },
  completed: { label: "Completada", cls: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 },
  failed: { label: "Fallida", cls: "bg-red-500/10 text-red-500", icon: XCircle },
};

function MarketingPage() {
  const { currentOrg } = useOrganization();
  const [tab, setTab] = useState("campaigns");

  if (!currentOrg) return <div className="p-8 text-muted-foreground">Cargando…</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-3">
            <Megaphone className="h-7 w-7 text-primary" /> Marketing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea plantillas reutilizables y envía campañas masivas por tus canales.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="campaigns">Campañas</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
        </TabsList>
        <TabsContent value="campaigns" className="mt-6">
          <CampaignsTab orgId={currentOrg.id} />
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <TemplatesTab orgId={currentOrg.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ TEMPLATES ============

function TemplatesTab({ orgId }: { orgId: string }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("message_templates")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    setTemplates(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [orgId]);

  async function remove(id: string) {
    const { error } = await supabase.from("message_templates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Plantilla eliminada");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-2" /> Nueva plantilla</Button>
          </DialogTrigger>
          <TemplateDialog
            orgId={orgId}
            template={editing}
            onSaved={() => { setOpen(false); setEditing(null); load(); }}
          />
        </Dialog>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : templates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Crea tu primera plantilla reutilizable.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Card key={t.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground capitalize mt-0.5">
                    {t.channel} {t.category ? `· ${t.category}` : ""}
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">{t.channel}</Badge>
              </div>
              {t.subject && (
                <div className="text-xs text-muted-foreground"><span className="font-medium">Asunto:</span> {t.subject}</div>
              )}
              <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{t.body}</p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => { setEditing(t); setOpen(true); }}>
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
                      <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(t.id)}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateDialog({
  orgId, template, onSaved,
}: { orgId: string; template: Template | null; onSaved: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState(template?.name ?? "");
  const [channel, setChannel] = useState<Channel>(template?.channel ?? "whatsapp");
  const [category, setCategory] = useState(template?.category ?? "");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  async function aiAssist() {
    if (!name) return toast.info("Pon un nombre o objetivo primero");
    setAiBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: `Genera una plantilla de ${channel} clara y profesional. Usa variables tipo {{first_name}} cuando aplique. Responde solo con el cuerpo del mensaje, sin explicaciones.` },
              { role: "user", content: `Objetivo / contexto: ${name}. Categoría: ${category || "general"}.` },
            ],
          }),
        },
      );
      if (!res.ok || !res.body) throw new Error("AI no disponible");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = ""; let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const d = line.slice(6).trim();
          if (d === "[DONE]") continue;
          try { const j = JSON.parse(d); const t = j.choices?.[0]?.delta?.content; if (t) acc += t; } catch {}
        }
      }
      if (acc.trim()) setBody(acc.trim());
    } catch (e: any) {
      toast.error(e.message ?? "Error AI");
    } finally {
      setAiBusy(false);
    }
  }

  async function save() {
    if (!name.trim() || !body.trim()) return toast.error("Nombre y cuerpo son obligatorios");
    setSaving(true);
    const payload = {
      organization_id: orgId,
      name: name.trim(),
      channel,
      category: category.trim() || null,
      subject: subject.trim() || null,
      body: body.trim(),
      created_by: user?.id ?? null,
    };
    const q = template
      ? supabase.from("message_templates").update(payload).eq("id", template.id)
      : supabase.from("message_templates").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Plantilla guardada");
    onSaved();
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{template ? "Editar plantilla" : "Nueva plantilla"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bienvenida" />
          </div>
          <div className="space-y-1.5">
            <Label>Canal</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Onboarding, Promociones..." />
          </div>
          {channel === "email" && (
            <div className="space-y-1.5">
              <Label>Asunto</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Cuerpo del mensaje</Label>
            <Button type="button" variant="ghost" size="sm" onClick={aiAssist} disabled={aiBusy}>
              {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              Generar con AI
            </Button>
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="Hola {{first_name}}, gracias por escribirnos…"
          />
          <p className="text-[11px] text-muted-foreground">
            Variables: <code>{"{{first_name}}"}</code>, <code>{"{{full_name}}"}</code>, <code>{"{{email}}"}</code>, <code>{"{{phone}}"}</code>
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ============ CAMPAIGNS ============

function CampaignsTab({ orgId }: { orgId: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    setCampaigns(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [orgId]);

  // Realtime updates
  useEffect(() => {
    const ch = supabase.channel(`campaigns:${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns", filter: `organization_id=eq.${orgId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId]);

  async function launch(id: string) {
    setSending(id);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-campaign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
          },
          body: JSON.stringify({ campaign_id: id }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Error");
      toast.success(`Enviada a ${data.sent}/${data.total} contactos`);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Error");
    } finally {
      setSending(null);
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Campaña eliminada");
    load();
  }

  const stats = useMemo(() => ({
    total: campaigns.length,
    sent: campaigns.reduce((a, c) => a + c.sent_count, 0),
    failed: campaigns.reduce((a, c) => a + c.failed_count, 0),
    completed: campaigns.filter((c) => c.status === "completed").length,
  }), [campaigns]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total campañas" value={stats.total} icon={Megaphone} />
        <StatCard label="Mensajes enviados" value={stats.sent} icon={Send} />
        <StatCard label="Completadas" value={stats.completed} icon={CheckCircle2} />
        <StatCard label="Fallidos" value={stats.failed} icon={XCircle} />
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nueva campaña</Button>
          </DialogTrigger>
          <CampaignDialog orgId={orgId} onSaved={() => { setOpen(false); load(); }} />
        </Dialog>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : campaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <Megaphone className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Aún no hay campañas. Crea la primera arriba.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const st = STATUS_BADGE[c.status] ?? STATUS_BADGE.draft;
            const Icon = st.icon;
            return (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium">{c.name}</h3>
                      <Badge variant="outline" className="capitalize">{c.channel}</Badge>
                      <Badge className={st.cls}>
                        <Icon className={`h-3 w-3 mr-1 ${c.status === "running" ? "animate-spin" : ""}`} />
                        {st.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2 whitespace-pre-wrap">{c.body}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-3">
                      <span>📤 {c.sent_count} enviados</span>
                      <span>❌ {c.failed_count} fallidos</span>
                      <span>👥 {c.total_count} total</span>
                      <span>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: es })}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {(c.status === "draft" || c.status === "failed") && (
                      <Button size="sm" onClick={() => launch(c.id)} disabled={sending === c.id}>
                        {sending === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                        Enviar
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar campaña?</AlertDialogTitle>
                          <AlertDialogDescription>Se borrarán también los registros de destinatarios.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(c.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </Card>
  );
}

function CampaignDialog({ orgId, onSaved }: { orgId: string; onSaved: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [channelId, setChannelId] = useState<string>("");
  const [body, setBody] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("message_templates").select("*").eq("organization_id", orgId)
      .then(({ data }) => setTemplates(data ?? []));
    supabase.from("channels").select("*").eq("organization_id", orgId).eq("is_active", true)
      .then(({ data }) => setChannels(data ?? []));
  }, [orgId]);

  // Compute audience preview
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let q = supabase.from("contacts").select("*", { count: "exact", head: true })
        .eq("organization_id", orgId);
      const tags = tagFilter.split(",").map((t) => t.trim()).filter(Boolean);
      if (tags.length) q = q.overlaps("tags", tags);
      if (channel === "whatsapp") q = q.not("phone", "is", null);
      if (channel === "email") q = q.not("email", "is", null);
      const { count } = await q;
      if (!cancelled) setAudienceCount(count ?? 0);
    })();
    return () => { cancelled = true; };
  }, [orgId, channel, tagFilter]);

  function applyTemplate(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setBody(t.body);
    setChannel(t.channel);
  }

  async function save() {
    if (!name.trim() || !body.trim()) return toast.error("Nombre y cuerpo son obligatorios");
    setSaving(true);
    const tags = tagFilter.split(",").map((t) => t.trim()).filter(Boolean);
    const { error } = await supabase.from("campaigns").insert({
      organization_id: orgId,
      name: name.trim(),
      channel,
      channel_id: channelId || null,
      body: body.trim(),
      audience_filter: { tags },
      status: "draft",
      created_by: user?.id ?? null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Campaña creada como borrador");
    onSaved();
  }

  const channelsForType = channels.filter((c) => c.provider === channel);

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Nueva campaña</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Black Friday" />
          </div>
          <div className="space-y-1.5">
            <Label>Canal</Label>
            <Select value={channel} onValueChange={(v) => { setChannel(v as Channel); setChannelId(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {channelsForType.length > 0 && (
          <div className="space-y-1.5">
            <Label>Cuenta conectada</Label>
            <Select value={channelId} onValueChange={setChannelId}>
              <SelectTrigger><SelectValue placeholder="Sin entrega externa (solo registrar)" /></SelectTrigger>
              <SelectContent>
                {channelsForType.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {templates.length > 0 && (
          <div className="space-y-1.5">
            <Label>Usar plantilla (opcional)</Label>
            <Select onValueChange={applyTemplate}>
              <SelectTrigger><SelectValue placeholder="— Selecciona —" /></SelectTrigger>
              <SelectContent>
                {templates
                  .filter((t) => t.channel === channel)
                  .map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Mensaje</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="Hola {{first_name}}, tenemos una promo para ti…"
          />
          <p className="text-[11px] text-muted-foreground">
            Variables: <code>{"{{first_name}}"}</code>, <code>{"{{full_name}}"}</code>, <code>{"{{email}}"}</code>, <code>{"{{phone}}"}</code>
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Filtrar por etiquetas (separadas por coma)</Label>
          <Input value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="vip, lead-frio" />
        </div>

        <Card className="p-4 bg-surface flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium">Audiencia estimada</div>
            <div className="text-xs text-muted-foreground">
              Contactos en el canal {channel} {tagFilter ? "con las etiquetas" : ""}
            </div>
          </div>
          <div className="text-2xl font-display font-semibold text-primary">
            {audienceCount ?? "…"}
          </div>
        </Card>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar borrador"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
