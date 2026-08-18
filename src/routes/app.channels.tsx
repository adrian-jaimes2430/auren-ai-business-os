import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Plus, Radio, MessageCircle, Instagram, Mail, Phone, MessageSquare, Globe, Copy, Check,
  Trash2, Power, PowerOff, Loader2, Sparkles, Send, Settings, ShieldCheck, ShieldAlert, ShieldQuestion, Facebook, ExternalLink,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { META_APP_ID, META_WA_CONFIG_ID } from "@/config/meta";
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

      <MetaConnectBanner orgId={currentOrg?.id ?? ""} disabled={!canManage} onConnected={load} />

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

      {/* Edit credentials dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        {editTarget && (
          <EditChannelDialog
            channel={editTarget}
            onSaved={() => { setEditTarget(null); load(); }}
            onClose={() => setEditTarget(null)}
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
  const [verifying, setVerifying] = useState(false);
  const webhookUrl = channel.provider === "whatsapp"
    ? `${baseUrl}/api/public/webhooks/whatsapp/${orgId}/${channel.id}`
    : null;

  const ch = channel as Channel & {
    verification_status?: string | null;
    verified_at?: string | null;
    verification_error?: string | null;
  };
  const status = ch.verification_status ?? "unverified";

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    toast.success("Copiado");
    setTimeout(() => setCopied(null), 1500);
  };

  const verify = async () => {
    setVerifying(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-channel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ channel_id: channel.id }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Error de verificación");
      if (data.ok) {
        const info = data.info?.display_phone_number || data.info?.username || data.info?.name || "OK";
        toast.success(`Conexión verificada: ${info}`);
      } else {
        toast.error(`No verificada: ${data.error}`);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Error de verificación");
    } finally {
      setVerifying(false);
    }
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
            {status === "verified" && (
              <span className="text-xs rounded-full px-2 py-0.5 bg-emerald-500/15 text-emerald-400 inline-flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Verificado
              </span>
            )}
            {status === "failed" && (
              <span className="text-xs rounded-full px-2 py-0.5 bg-destructive/15 text-destructive inline-flex items-center gap-1" title={ch.verification_error ?? ""}>
                <ShieldAlert className="h-3 w-3" /> No verificado
              </span>
            )}
            {status === "unverified" && (
              <span className="text-xs rounded-full px-2 py-0.5 bg-muted text-muted-foreground inline-flex items-center gap-1">
                <ShieldQuestion className="h-3 w-3" /> Sin verificar
              </span>
            )}
          </div>
          {channel.external_id && <div className="text-xs text-muted-foreground mt-1">ID: {channel.external_id}</div>}
          {ch.verified_at && (
            <div className="text-xs text-muted-foreground mt-1">
              Verificado: {new Date(ch.verified_at).toLocaleString()}
            </div>
          )}
          {status === "failed" && ch.verification_error && (
            <div className="text-xs text-destructive mt-1 break-words">⚠ {ch.verification_error}</div>
          )}
          {channel.last_event_at && (
            <div className="text-xs text-muted-foreground mt-1">
              Último evento: {new Date(channel.last_event_at).toLocaleString()}
            </div>
          )}
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={verify} disabled={verifying} title="Verificar credenciales contra Meta">
              {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              <span className="ml-1.5">Verificar</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit} title="Editar credenciales"><Settings className="h-4 w-4" /></Button>
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

function EditChannelDialog({ channel, onSaved, onClose }: {
  channel: Channel; onSaved: () => void; onClose: () => void;
}) {
  const meta = providerMeta(channel.provider);
  const [name, setName] = useState(channel.name);
  const cfg = (channel.config as any) || {};
  const [phoneNumberId, setPhoneNumberId] = useState<string>(cfg.phone_number_id || channel.external_id || "");
  const [accessToken, setAccessToken] = useState<string>(channel.access_token || "");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const newConfig = channel.provider === "whatsapp"
      ? { ...cfg, phone_number_id: phoneNumberId || null }
      : cfg;
    const { error } = await supabase.from("channels").update({
      name,
      external_id: phoneNumberId || null,
      access_token: accessToken || null,
      config: newConfig,
    }).eq("id", channel.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Credenciales actualizadas");
    onSaved();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" /> Editar {meta.name}
        </DialogTitle>
        <DialogDescription>
          Actualiza el Phone Number ID y el Access Token. Sin estos datos los mensajes salientes no se entregan.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div>
          <Label>Nombre interno</Label>
          <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        {channel.provider === "whatsapp" && (
          <>
            <div>
              <Label>Phone Number ID</Label>
              <Input className="mt-1.5 font-mono" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="1234567890" />
              <p className="text-[11px] text-muted-foreground mt-1.5">Lo encuentras en Meta → WhatsApp → API Setup.</p>
            </div>
            <div>
              <Label>Access Token (permanente)</Label>
              <Input className="mt-1.5 font-mono" type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="EAAG..." />
            </div>
          </>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando…</> : "Guardar"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function MetaConnectBanner({ orgId, disabled, onConnected }: { orgId: string; disabled: boolean; onConnected: () => void }) {
  const metaAppId = META_APP_ID;
  const metaConfigId = META_WA_CONFIG_ID;
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const startEmbeddedSignup = () => {
    if (!metaAppId || !metaConfigId) {
      setShowHelp(true);
      return;
    }
    setLoading(true);
    // Load Facebook SDK on demand
    const initFB = () => {
      const w = window as any;
      w.FB.init({ appId: metaAppId, autoLogAppEvents: true, xfbml: true, version: "v20.0" });
      w.FB.login(
        async (response: any) => {
          setLoading(false);
          if (response.authResponse?.code) {
            // Send the auth code + selected WABA/phone info to backend to exchange for permanent token
            const { data: sess } = await supabase.auth.getSession();
            const token = sess.session?.access_token;
            const res = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-embedded-signup`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  organization_id: orgId,
                  code: response.authResponse.code,
                  data: response.authResponse,
                }),
              },
            );
            const out = await res.json().catch(() => ({}));
            if (!res.ok) {
              toast.error(out?.error ?? "No se pudo completar la conexión");
            } else {
              toast.success("WhatsApp conectado vía Meta");
              onConnected();
            }
          } else {
            toast.info("Conexión cancelada");
          }
        },
        {
          config_id: metaConfigId,
          response_type: "code",
          override_default_response_type: true,
          extras: { setup: {}, featureType: "whatsapp_business_app_onboarding", sessionInfoVersion: "3" },
        },
      );
    };
    if ((window as any).FB) return initFB();
    const s = document.createElement("script");
    s.src = "https://connect.facebook.net/en_US/sdk.js";
    s.async = true;
    s.defer = true;
    s.crossOrigin = "anonymous";
    s.onload = initFB;
    s.onerror = () => { setLoading(false); toast.error("No se pudo cargar el SDK de Meta"); };
    document.body.appendChild(s);
  };

  const ready = !!metaAppId && !!metaConfigId;

  return (
    <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#1877F2]/15">
          <Facebook className="h-5 w-5 text-[#1877F2]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold flex items-center gap-2">
            Conectar con Meta (Embedded Signup)
            {ready ? (
              <span className="text-xs rounded-full px-2 py-0.5 bg-emerald-500/15 text-emerald-400">Disponible</span>
            ) : (
              <span className="text-xs rounded-full px-2 py-0.5 bg-amber-500/15 text-amber-400">Pendiente de configuración</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Inicia sesión con Facebook y elige el portafolio de negocio (Business Manager), la cuenta de WhatsApp Business (WABA) y los números a conectar. Igual que Kommo o Attio: un solo flujo, sin pegar tokens.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={startEmbeddedSignup} disabled={disabled || loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Facebook className="h-4 w-4 mr-2" />}
            {ready ? "Conectar con Meta" : "Cómo activarlo"}
          </Button>
        </div>
      </div>

      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Activar el flujo nativo de Meta</DialogTitle>
            <DialogDescription>
              Para usar Embedded Signup necesitas una app propia en Meta Developers (no hay forma de saltarse este paso).
            </DialogDescription>
          </DialogHeader>
          <ol className="text-sm space-y-3 list-decimal pl-5">
            <li>
              Crea una app de tipo <strong>Business</strong> en{" "}
              <a className="text-primary inline-flex items-center gap-1" href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer">
                developers.facebook.com <ExternalLink className="h-3 w-3" />
              </a>
              y verifica tu negocio.
            </li>
            <li>Solicita el caso de uso <strong>WhatsApp Business Platform</strong> con permisos <code>whatsapp_business_management</code>, <code>whatsapp_business_messaging</code> y <code>business_management</code>.</li>
            <li>Crea una <strong>configuration</strong> de Embedded Signup en el panel de WhatsApp y copia el <code>config_id</code>.</li>
            <li>App ID y config ID ya están configurados en la plataforma. Solo falta el <code>META_APP_SECRET</code> en el backend para poder canjear el código por un token permanente.</li>
          </ol>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHelp(false)}>Entendido</Button>
            <Button asChild>
              <a href="https://developers.facebook.com/docs/whatsapp/embedded-signup" target="_blank" rel="noreferrer">
                Documentación oficial <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

