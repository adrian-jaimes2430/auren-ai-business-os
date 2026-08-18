import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, Plus, Send, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";

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
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/app/inbox")({ component: InboxPage });

type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
type Contact = Database["public"]["Tables"]["contacts"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];
type Channel = Database["public"]["Enums"]["channel_type"];

const CHANNELS: Channel[] = ["whatsapp", "email", "instagram", "messenger", "webchat", "sms", "telegram"];

function InboxPage() {
  const { currentOrg, loading: orgLoading } = useOrganization();
  
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConversations = useCallback(async (orgId: string) => {
    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .eq("organization_id", orgId)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    const list = convs ?? [];
    setConversations(list);
    const ids = Array.from(new Set(list.map((c) => c.contact_id).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: cts } = await supabase.from("contacts").select("*").in("id", ids);
      const map: Record<string, Contact> = {};
      (cts ?? []).forEach((c) => (map[c.id] = c));
      setContacts(map);
    } else {
      setContacts({});
    }
    setActiveId((prev) => prev ?? list[0]?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (currentOrg) loadConversations(currentOrg.id);
  }, [currentOrg?.id]);

  // Realtime: conversations
  useEffect(() => {
    if (!currentOrg) return;
    const ch = supabase
      .channel(`conv:${currentOrg.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `organization_id=eq.${currentOrg.id}` },
        () => {
          if (reloadTimer.current) clearTimeout(reloadTimer.current);
          reloadTimer.current = setTimeout(() => loadConversations(currentOrg.id), 400);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [currentOrg?.id]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });
      if (!cancelled) setMessages(data ?? []);
    })();
    // mark as read
    supabase.from("conversations").update({ unread_count: 0 }).eq("id", activeId).then();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // Realtime: messages of active conv
  useEffect(() => {
    if (!activeId) return;
    const ch = supabase
      .channel(`msg:${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const n = payload.new as Message;
          setMessages((prev) => (prev.find((m) => m.id === n.id) ? prev : [...prev, n]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const activeConv = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);
  const activeContact = activeConv?.contact_id ? contacts[activeConv.contact_id] : null;

  const [aiSuggesting, setAiSuggesting] = useState(false);

  async function sendMessage(textOverride?: string, asAi = false) {
    const content = (textOverride ?? draft).trim();
    if (!content || !activeConv || !currentOrg) return;
    setSending(true);
    if (!textOverride) setDraft("");
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ conversation_id: activeConv.id, content, ai: asAi }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "No se pudo enviar");
      if (data.delivery_error) toast.warning(`Guardado, pero entrega falló: ${data.delivery_error}`);
    } catch (e: any) {
      toast.error(e.message ?? "Error al enviar");
      if (!textOverride) setDraft(content);
    } finally {
      setSending(false);
    }
  }

  async function toggleAutoreply(value: boolean) {
    if (!activeConv) return;
    const { error } = await supabase
      .from("conversations")
      .update({ ai_autoreply: value })
      .eq("id", activeConv.id);
    if (error) {
      toast.error("No se pudo actualizar");
      return;
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConv.id ? { ...c, ai_autoreply: value } : c)),
    );
    toast.success(value ? "AI auto-reply activado" : "AI auto-reply desactivado");
  }

  async function suggestReply() {
    if (!activeConv || messages.length === 0) return;
    setAiSuggesting(true);
    try {
      const last20 = messages.slice(-20).map((m) => ({
        role: m.direction === "inbound" ? "user" : "assistant",
        content: m.content,
      }));
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
              {
                role: "system",
                content:
                  "Eres un agente de atención al cliente. Sugiere UNA respuesta breve y profesional para enviar al cliente, sin explicaciones, en el mismo idioma de la conversación.",
              },
              ...last20,
              { role: "user", content: "Sugiere la mejor respuesta para enviar ahora." },
            ],
          }),
        },
      );
      if (!res.ok || !res.body) throw new Error("AI no disponible");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) acc += delta;
          } catch {}
        }
      }
      if (acc.trim()) setDraft(acc.trim());
    } catch (e: any) {
      toast.error(e.message ?? "Error al sugerir");
    } finally {
      setAiSuggesting(false);
    }
  }

  if ((orgLoading || loading) && conversations.length === 0) {
    return (
      <div className="p-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando inbox...
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-0px)]">
      <div className="w-80 border-r border-border/60 overflow-auto flex flex-col">
        <div className="p-5 border-b border-border/60 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Inbox</h1>
            <p className="text-xs text-muted-foreground mt-1">Omnicanal · {conversations.length}</p>
          </div>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline"><Plus className="h-4 w-4" /></Button>
            </DialogTrigger>
            <NewConversationDialog
              orgId={currentOrg?.id}
              onCreated={(id) => {
                setOpenNew(false);
                if (currentOrg) loadConversations(currentOrg.id).then(() => setActiveId(id));
              }}
            />
          </Dialog>
        </div>
        <div className="flex-1">
          {conversations.length === 0 && (
            <div className="p-6 text-xs text-muted-foreground text-center">
              No hay conversaciones aún. Crea la primera con el botón +.
            </div>
          )}
          {conversations.map((c) => {
            const ct = c.contact_id ? contacts[c.contact_id] : null;
            const name = ct?.full_name ?? c.subject ?? "Sin nombre";
            const time = c.last_message_at ?? c.created_at;
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left p-4 border-b border-border/60 hover:bg-surface transition-colors ${activeId === c.id ? "bg-surface" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{name}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {relativeTime(time)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {c.subject ?? "—"}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.channel}</span>
                  {c.unread_count > 0 && (
                    <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                      {c.unread_count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            <div className="p-5 border-b border-border/60 glass-strong flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{activeContact?.full_name ?? activeConv.subject ?? "Conversación"}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {activeConv.channel} · {activeConv.status}
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Bot className="h-4 w-4" />
                <span>AI auto-reply</span>
                <Switch
                  checked={!!activeConv.ai_autoreply}
                  onCheckedChange={(v) => toggleAutoreply(!!v)}
                />
              </label>
            </div>
            <div className="flex-1 p-6 space-y-3 overflow-auto">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-md rounded-2xl px-4 py-2.5 text-sm ${
                    m.direction === "outbound"
                      ? "bg-gradient-primary text-primary-foreground ml-auto"
                      : "bg-surface"
                  }`}
                >
                  {m.is_ai && (
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider opacity-80 mb-1">
                      <Bot className="h-3 w-3" /> AI
                    </div>
                  )}
                  {m.content}
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center text-xs text-muted-foreground pt-12">
                  Aún no hay mensajes. Envía el primero abajo.
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border/60 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={suggestReply}
                disabled={aiSuggesting || messages.length === 0}
                title="Sugerir respuesta con IA"
              >
                {aiSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </Button>
              <Input
                placeholder="Escribe un mensaje..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={() => sendMessage()} disabled={sending || !draft.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Selecciona una conversación
          </div>
        )}
      </div>
    </div>
  );
}

function NewConversationDialog({
  orgId,
  onCreated,
}: {
  orgId?: string;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [subject, setSubject] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!orgId || !name.trim()) {
      toast.error("Falta el nombre del contacto");
      return;
    }
    setSaving(true);
    let channelId: string | null = null;
    if (channel === "whatsapp") {
      const { data: activeChannel } = await supabase
        .from("channels")
        .select("id")
        .eq("organization_id", orgId)
        .eq("provider", "whatsapp")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      channelId = activeChannel?.id ?? null;
    }
    const { data: contact, error: cErr } = await supabase
      .from("contacts")
      .insert({
        organization_id: orgId,
        full_name: name.trim(),
        phone: phone.trim() || null,
        external_id: channel === "whatsapp" ? phone.replace(/\D/g, "") || null : null,
        email: email.trim() || null,
        source: channel,
      })
      .select()
      .single();
    if (cErr || !contact) {
      setSaving(false);
      toast.error(cErr?.message ?? "No se pudo crear el contacto");
      return;
    }
    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .insert({
        organization_id: orgId,
        contact_id: contact.id,
        channel,
        channel_id: channelId,
        subject: subject.trim() || null,
        status: "open",
      })
      .select()
      .single();
    setSaving(false);
    if (convErr || !conv) {
      toast.error(convErr?.message ?? "No se pudo crear la conversación");
      return;
    }
    toast.success("Conversación creada");
    onCreated(conv.id);
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nueva conversación</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Nombre del contacto</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="María López" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+52..." />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
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
          <div className="space-y-1.5">
            <Label>Asunto</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Opcional" />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
