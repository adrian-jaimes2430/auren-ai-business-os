import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Plus, Radio, MessageCircle, Instagram, Mail, Phone, MessageSquare, Globe, Copy, Check,
  Trash2, Power, PowerOff, Loader2, Sparkles, Send, Settings,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Provider = Database["public"]["Enums"]["channel_provider"];
type Channel = Database["public"]["Tables"]["channels"]["Row"];

export const Route = createFileRoute("/app/channels")({
  component: ChannelsPage,
  head: () => ({ meta: [{ title: "Canales — AUREN AI" }] }),
});

const PROVIDERS: { id: Provider; name: string; icon: any; color: string; desc: string }[] = [
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, color: "#25D366", desc: "Meta Cloud API · webhook listo" },
  { id: "instagram", name: "Instagram DM", icon: Instagram, color: "#E1306C", desc: "Mensajes directos vía Meta" },
  { id: "messenger", name: "Messenger", icon: MessageSquare, color: "#0084FF", desc: "Página de Facebook" },
  { id: "email", name: "Email", icon: Mail, color: "#f59e0b", desc: "Bandeja conectada" },
  { id: "sms", name: "SMS", icon: Phone, color: "#a78bfa", desc: "Twilio u otro proveedor" },
  { id: "webchat", name: "Web chat", icon: Globe, color: "#10b981", desc: "Widget para tu sitio" },
];

function providerMeta(p: Provider) { return PROVIDERS.find((x) => x.id === p)!; }

function ChannelsPage() {
  const { currentOrg, currentRole } = useOrganization();
  const canManage = currentRole === "owner" || currentRole === "admin";
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState<Provider | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Channel | null>(null);
  const [testTarget, setTestTarget] = useState<Channel | null>(null);
  const [editTarget, setEditTarget] = useState<Channel | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const load = async () => {
    if (!currentOrg) return;
    setLoading(true);
    const { data } = await supabase.from("channels").select("*").eq("organization_id", currentOrg.id).order("created_at", { ascending: false });
    setChannels(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [currentOrg?.id]);

  useEffect(() => {
    if (!currentOrg) return;
    const ch = supabase.channel(`channels-${currentOrg.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "channels", filter: `organization_id=eq.${currentOrg.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [currentOrg?.id]);

  const toggleActive = async (c: Channel) => {
    const { error } = await supabase.from("channels").update({ is_active: !c.is_active }).eq("id", c.id);
    if (error) return toast.error(error.message);
  };

  const remove = async () => {
    if (!removeTarget) return;
    const { error } = await supabase.from("channels").delete().eq("id", removeTarget.id);
    if (error) return toast.error(error.message);
    setRemoveTarget(null);
    toast.success("Canal eliminado");
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary glow-primary">
              <Radio className="h-4 w-4 text-primary-foreground" />
            </span>
            Canales
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conecta WhatsApp, Instagram, email y más para recibir todo en tu Inbox.
          </p>
        </div>
      </div>

      {/* Provider catalog */}
      <div className="mt-8">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Conectar nuevo canal</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              disabled={!canManage}
              onClick={() => setAddOpen(p.id)}
              className="text-left rounded-2xl glass p-5 hover:border-primary/40 border border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${p.color}20` }}>
                  <p.icon className="h-5 w-5" style={{ color: p.color }} />
                </div>
                <div className="flex-1">
                  <div className="font-display font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active channels */}
      <div className="mt-10">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Canales conectados ({channels.length})</div>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : channels.length === 0 ? (
          <div className="rounded-2xl glass p-12 text-center text-sm text-muted-foreground">
            Aún no has conectado ningún canal. Empieza con WhatsApp arriba.
          </div>
        ) : (
          <div className="grid gap-3">
            {channels.map((c) => (
              <ChannelCard
                key={c.id}
                channel={c}
                baseUrl={baseUrl}
                orgId={currentOrg!.id}
                canManage={canManage}
                onToggle={() => toggleActive(c)}
                onRemove={() => setRemoveTarget(c)}
                onTest={() => setTestTarget(c)}
                onEdit={() => setEditTarget(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add channel dialog */}
      <Dialog open={!!addOpen} onOpenChange={(o) => !o && setAddOpen(null)}>
        {addOpen && currentOrg && (
          <AddChannelDialog
            provider={addOpen}
            orgId={currentOrg.id}
            baseUrl={baseUrl}
            onCreated={() => { setAddOpen(null); load(); }}
            onClose={() => setAddOpen(null)}
          />
        )}
      </Dialog>

      {/* Test dialog */}
      <Dialog open={!!testTarget} onOpenChange={(o) => !o && setTestTarget(null)}>
        {testTarget && currentOrg && (
          <TestWebhookDialog
            channel={testTarget}
            orgId={currentOrg.id}
            baseUrl={baseUrl}
            onClose={() => setTestTarget(null)}
          />
        )}
      </Dialog>

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar canal?</AlertDialogTitle>
            <AlertDialogDescription>
              Dejará de recibir mensajes de "{removeTarget?.name}". Las conversaciones existentes no se borran.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ChannelCard({ channel, baseUrl, orgId, canManage, onToggle, onRemove, onTest, onEdit }: {
  channel: Channel; baseUrl: string; orgId: string; canManage: boolean;
  onToggle: () => void; onRemove: () => void; onTest: () => void; onEdit: () => void;
}) {
  const meta = providerMeta(channel.provider);
  const [copied, setCopied] = useState<string | null>(null);
  const webhookUrl = channel.provider === "whatsapp"
    ? `${baseUrl}/api/public/webhooks/whatsapp/${orgId}/${channel.id}`
    : null;

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    toast.success("Copiado");
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: `${meta.color}20` }}>
          <meta.icon className="h-5 w-5" style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-display font-semibold">{channel.name}</div>
            <span className="text-xs rounded-full px-2 py-0.5 capitalize" style={{ background: `${meta.color}20`, color: meta.color }}>
              {meta.name}
            </span>
            {channel.is_active ? (
              <span className="text-xs rounded-full px-2 py-0.5 bg-emerald-500/15 text-emerald-400">Activo</span>
            ) : (
              <span className="text-xs rounded-full px-2 py-0.5 bg-muted text-muted-foreground">Pausado</span>
            )}
          </div>
          {channel.external_id && <div className="text-xs text-muted-foreground mt-1">ID: {channel.external_id}</div>}
          {channel.last_event_at && (
            <div className="text-xs text-muted-foreground mt-1">
              Último evento: {new Date(channel.last_event_at).toLocaleString()}
            </div>
          )}
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onTest} title="Probar"><Send className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={onToggle} title={channel.is_active ? "Pausar" : "Activar"}>
              {channel.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4 text-primary" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onRemove} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      </div>

      {webhookUrl && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <CredField label="Callback URL" value={webhookUrl} onCopy={() => copy("url", webhookUrl)} copied={copied === "url"} />
          <CredField label="Verify token" value={channel.verify_token} onCopy={() => copy("token", channel.verify_token)} copied={copied === "token"} mono />
        </div>
      )}
    </div>
  );
}

function CredField({ label, value, onCopy, copied, mono }: { label: string; value: string; onCopy: () => void; copied: boolean; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-surface p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <div className="flex items-center gap-2">
        <code className={`flex-1 truncate text-xs ${mono ? "font-mono" : ""}`}>{value}</code>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy}>
          {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}

function AddChannelDialog({ provider, orgId, baseUrl, onCreated, onClose }: {
  provider: Provider; orgId: string; baseUrl: string; onCreated: () => void; onClose: () => void;
}) {
  const meta = providerMeta(provider);
  const [name, setName] = useState(meta.name);
  const [externalId, setExternalId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Channel | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.from("channels").insert({
      organization_id: orgId,
      provider,
      name,
      external_id: externalId || null,
      access_token: accessToken || null,
      config: provider === "whatsapp" && externalId ? { phone_number_id: externalId } : {},
    }).select().single();
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setCreated(data as Channel);
    toast.success(`${meta.name} conectado`);
  };

  if (created) {
    const url = provider === "whatsapp" ? `${baseUrl}/api/public/webhooks/whatsapp/${orgId}/${created.id}` : null;
    return (
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>¡{meta.name} listo!</DialogTitle>
          <DialogDescription>
            {provider === "whatsapp"
              ? "Pega estos datos en Meta Developers → WhatsApp → Configuration → Webhook."
              : "Canal creado correctamente."}
          </DialogDescription>
        </DialogHeader>
        {url && (
          <div className="space-y-3">
            <CredField label="Callback URL" value={url} onCopy={() => navigator.clipboard.writeText(url).then(() => toast.success("URL copiada"))} copied={false} />
            <CredField label="Verify token" value={created.verify_token} onCopy={() => navigator.clipboard.writeText(created.verify_token).then(() => toast.success("Token copiado"))} copied={false} mono />
            <p className="text-xs text-muted-foreground">
              En Meta, suscríbete al campo <code className="font-mono bg-surface px-1 rounded">messages</code> para recibir mensajes entrantes.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button onClick={() => { setCreated(null); onCreated(); }}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${meta.color}20` }}>
            <meta.icon className="h-4 w-4" style={{ color: meta.color }} />
          </span>
          Conectar {meta.name}
        </DialogTitle>
        <DialogDescription>{meta.desc}</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Nombre interno</Label>
          <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej. Línea soporte" />
        </div>
        {(provider === "whatsapp" || provider === "instagram" || provider === "messenger") && (
          <>
            <div>
              <Label>{provider === "whatsapp" ? "Phone Number ID" : "Page / Account ID"} (opcional)</Label>
              <Input className="mt-1.5 font-mono" value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder="1234567890" />
            </div>
            <div>
              <Label>Access token (opcional)</Label>
              <Input className="mt-1.5 font-mono" type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="EAAG..." />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Lo necesitarás para enviar mensajes salientes. Puedes pegarlo después.
              </p>
            </div>
          </>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Conectando…</> : "Conectar"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function TestWebhookDialog({ channel, orgId, baseUrl, onClose }: {
  channel: Channel; orgId: string; baseUrl: string; onClose: () => void;
}) {
  const [from, setFrom] = useState("521234567890");
  const [name, setName] = useState("Cliente de prueba");
  const [text, setText] = useState("Hola! Quiero más información");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (channel.provider !== "whatsapp") return toast.error("Por ahora solo WhatsApp es testeable");
    setSending(true);
    const url = `${baseUrl}/api/public/webhooks/whatsapp/${orgId}/${channel.id}`;
    const payload = {
      object: "whatsapp_business_account",
      entry: [{
        id: "TEST",
        changes: [{
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: channel.external_id || "0", phone_number_id: channel.external_id || "0" },
            contacts: [{ profile: { name }, wa_id: from }],
            messages: [{ from, id: `wamid.test.${Date.now()}`, timestamp: `${Math.floor(Date.now() / 1000)}`, text: { body: text }, type: "text" }],
          },
        }],
      }],
    };
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Mensaje de prueba enviado · revisa el Inbox");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Simular mensaje entrante</DialogTitle>
        <DialogDescription>
          Envía un payload de prueba al webhook para ver el flujo completo en tu Inbox.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Teléfono del remitente</Label>
          <Input className="mt-1.5 font-mono" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label>Nombre</Label>
          <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Mensaje</Label>
          <Textarea className="mt-1.5" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={send} disabled={sending}>
          {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando…</> : <><Send className="h-4 w-4 mr-2" /> Enviar prueba</>}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
