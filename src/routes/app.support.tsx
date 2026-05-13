import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LifeBuoy, Plus, Loader2, Send, MessageSquare, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { supabase } from "@/integrations/supabase/client";
import {
  useTickets, createTicket, updateTicket, fetchTicketMessages, postTicketMessage,
  STATUS_LABEL, STATUS_TONE, PRIORITY_LABEL, PRIORITY_TONE,
  type Ticket, type TicketMessage, type TicketPriority,
} from "@/hooks/use-tickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/app/support")({
  component: SupportPage,
  head: () => ({ meta: [{ title: "Soporte — AUREN AI" }] }),
});

function SupportPage() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id ?? null;
  const [isStaff, setIsStaff] = useState(false);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any).rpc("is_support_staff", { _user_id: user.id });
      setIsStaff(Boolean(data));
    })();
  }, [user?.id]);
  const { tickets, loading, refresh } = useTickets({ orgId, mode: isStaff ? "all" : "org" });
  const [openNew, setOpenNew] = useState(false);
  const [active, setActive] = useState<Ticket | null>(null);
  const [supportMembers, setSupportMembers] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    if (!isStaff) return;
    (async () => {
      const { data: orgs } = await supabase.from("organizations").select("id").eq("is_support_org", true);
      const orgIds = (orgs ?? []).map((o: any) => o.id);
      if (!orgIds.length) return;
      const { data: members } = await supabase.from("organization_members").select("user_id").in("organization_id", orgIds);
      const ids = Array.from(new Set((members ?? []).map((m: any) => m.user_id)));
      if (!ids.length) return;
      const { data: profiles } = await supabase.from("profiles").select("id,email,full_name").in("id", ids);
      setSupportMembers((profiles ?? []).map((p: any) => ({ id: p.id, label: p.full_name || p.email || p.id })));
    })();
  }, [isStaff]);

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
            <LifeBuoy className="h-3.5 w-3.5" /> Soporte
          </div>
          <h1 className="font-display text-3xl font-semibold mt-2">Centro de tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reporta fallas o solicita ayuda. Nuestro equipo recibe y atiende cada ticket.
          </p>
        </div>
        <Button onClick={() => setOpenNew(true)}>
          <Plus className="h-4 w-4" /> Nuevo ticket
        </Button>
      </header>

      <Card className="mt-6 overflow-hidden">
        {loading ? (
          <div className="p-12 grid place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aún no tienes tickets. Crea uno para reportar una falla o pedir ayuda.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t)}
                className="w-full text-left p-4 sm:px-5 hover:bg-surface/40 transition flex flex-col sm:flex-row sm:items-center gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{t.subject}</span>
                    <Badge variant="outline" className={`${STATUS_TONE[t.status]} text-[10px]`}>
                      {STATUS_LABEL[t.status]}
                    </Badge>
                    <Badge variant="outline" className={`${PRIORITY_TONE[t.priority]} text-[10px]`}>
                      {PRIORITY_LABEL[t.priority]}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {t.category} · creado {formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: es })}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <NewTicketDialog
        open={openNew}
        onOpenChange={setOpenNew}
        orgId={orgId}
        userId={user?.id ?? null}
        onCreated={refresh}
      />
      <TicketDetailDialog
        ticket={active}
        onClose={() => setActive(null)}
        userId={user?.id ?? null}
        onChanged={() => { refresh(); }}
        canManageStatus={false}
      />
    </div>
  );
}

function NewTicketDialog({
  open, onOpenChange, orgId, userId, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orgId: string | null;
  userId: string | null;
  onCreated: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!orgId || !userId) {
      toast.error("Sesión no disponible");
      return;
    }
    if (subject.trim().length < 4) {
      toast.error("El asunto debe tener al menos 4 caracteres");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("Describe el problema con al menos 10 caracteres");
      return;
    }
    setSaving(true);
    try {
      await createTicket({
        organization_id: orgId,
        created_by: userId,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
      });
      toast.success("Ticket creado. Te contactaremos pronto.");
      onCreated();
      onOpenChange(false);
      setSubject(""); setDescription(""); setCategory("general"); setPriority("normal");
    } catch (e: any) {
      toast.error(e?.message ?? "Error al crear el ticket");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo ticket de soporte</DialogTitle>
          <DialogDescription>Cuéntanos qué está pasando para ayudarte mejor.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Asunto</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Resumen del problema" maxLength={120} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="bug">Falla técnica</SelectItem>
                  <SelectItem value="billing">Facturación</SelectItem>
                  <SelectItem value="channel">Canales / Integraciones</SelectItem>
                  <SelectItem value="ai">IA</SelectItem>
                  <SelectItem value="feature">Sugerencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe pasos para reproducir, qué esperabas y qué ocurrió"
              rows={5}
              maxLength={2000}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TicketDetailDialog({
  ticket, onClose, userId, onChanged, canManageStatus, supportMembers,
}: {
  ticket: Ticket | null;
  onClose: () => void;
  userId: string | null;
  onChanged: () => void;
  canManageStatus: boolean;
  supportMembers?: { id: string; label: string }[];
}) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!ticket) return;
    setLoading(true);
    fetchTicketMessages(ticket.id)
      .then(setMessages)
      .catch((e) => toast.error(e?.message ?? "Error cargando mensajes"))
      .finally(() => setLoading(false));
  }, [ticket?.id]);

  if (!ticket) return null;

  const send = async () => {
    if (!userId || reply.trim().length < 2) return;
    setSending(true);
    try {
      await postTicketMessage({
        ticket_id: ticket.id,
        author_id: userId,
        body: reply.trim(),
        is_internal: internal,
      });
      setReply("");
      const msgs = await fetchTicketMessages(ticket.id);
      setMessages(msgs);
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? "Error enviando mensaje");
    } finally {
      setSending(false);
    }
  };

  const setStatus = async (status: Ticket["status"]) => {
    try {
      await updateTicket(ticket.id, { status });
      toast.success("Estado actualizado");
      onChanged();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Error actualizando");
    }
  };

  const setPriority = async (priority: Ticket["priority"]) => {
    try {
      await updateTicket(ticket.id, { priority });
      toast.success("Prioridad actualizada");
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? "Error actualizando");
    }
  };

  const assign = async (userId: string | null) => {
    try {
      await updateTicket(ticket.id, { assigned_to: userId });
      toast.success(userId ? "Ticket asignado" : "Asignación removida");
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? "Error asignando");
    }
  };

  return (
    <Dialog open={!!ticket} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-base">{ticket.subject}</DialogTitle>
            <Badge variant="outline" className={`${STATUS_TONE[ticket.status]} text-[10px]`}>{STATUS_LABEL[ticket.status]}</Badge>
            <Badge variant="outline" className={`${PRIORITY_TONE[ticket.priority]} text-[10px]`}>{PRIORITY_LABEL[ticket.priority]}</Badge>
          </div>
          <DialogDescription className="text-xs">
            {ticket.category} · creado {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: es })}
          </DialogDescription>
        </DialogHeader>

        {canManageStatus && (
          <div className="flex flex-wrap gap-2 pb-2 border-b border-border/50">
            <Select value={ticket.status} onValueChange={(v) => setStatus(v as Ticket["status"])}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as Ticket["status"][]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ticket.priority} onValueChange={(v) => setPriority(v as Ticket["priority"])}>
              <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PRIORITY_LABEL) as Ticket["priority"][]).map((p) => (
                  <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {supportMembers && (
              <Select
                value={ticket.assigned_to ?? "__none"}
                onValueChange={(v) => assign(v === "__none" ? null : v)}
              >
                <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue placeholder="Asignar a..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Sin asignar</SelectItem>
                  {supportMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          <div className="rounded-lg border border-border/60 bg-surface/40 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Descripción inicial</div>
            <div className="text-sm mt-1 whitespace-pre-wrap">{ticket.description}</div>
          </div>
          {loading ? (
            <div className="grid place-items-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-3">Aún no hay respuestas.</div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`rounded-lg p-3 text-sm ${m.is_internal ? "bg-amber-500/5 border border-amber-500/20" : "bg-surface/30 border border-border/40"}`}>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                  {m.is_internal && <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-300">Nota interna</Badge>}
                  <span>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: es })}</span>
                </div>
                <div className="whitespace-pre-wrap">{m.body}</div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border/60 pt-3 space-y-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Escribe una respuesta..."
            rows={3}
            maxLength={2000}
          />
          <div className="flex items-center justify-between gap-2">
            {canManageStatus ? (
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="rounded" />
                Nota interna (solo equipo de soporte)
              </label>
            ) : <span />}
            <Button size="sm" onClick={send} disabled={sending || reply.trim().length < 2}>
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Send className="h-3.5 w-3.5" /> Enviar</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
