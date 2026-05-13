import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TicketStatus = "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type Ticket = {
  id: string;
  organization_id: string;
  created_by: string;
  assigned_to: string | null;
  subject: string;
  description: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
};

export const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Abierto",
  in_progress: "En proceso",
  waiting_user: "Esperando usuario",
  resolved: "Resuelto",
  closed: "Cerrado",
};

export const STATUS_TONE: Record<TicketStatus, string> = {
  open: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  waiting_user: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  resolved: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  closed: "bg-muted text-muted-foreground border-border",
};

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export const PRIORITY_TONE: Record<TicketPriority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  normal: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  high: "bg-orange-500/10 text-orange-300 border-orange-500/20",
  urgent: "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

export function useTickets(opts: { orgId?: string | null; mode: "org" | "all" }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = (supabase as any).from("support_tickets").select("*").order("created_at", { ascending: false });
    if (opts.mode === "org" && opts.orgId) q = q.eq("organization_id", opts.orgId);
    const { data, error } = await q;
    if (error) console.error("[tickets] load failed", error);
    setTickets((data ?? []) as Ticket[]);
    setLoading(false);
  }, [opts.mode, opts.orgId]);

  useEffect(() => {
    load();
  }, [load]);

  return { tickets, loading, refresh: load };
}

export async function createTicket(input: {
  organization_id: string;
  created_by: string;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
}) {
  const { data, error } = await (supabase as any)
    .from("support_tickets")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Ticket;
}

export async function updateTicket(id: string, patch: Partial<Ticket>) {
  if (patch.status === "resolved" && !patch.resolved_at) {
    patch.resolved_at = new Date().toISOString();
  }
  const { error } = await (supabase as any).from("support_tickets").update(patch).eq("id", id);
  if (error) throw error;
}

export async function fetchTicketMessages(ticketId: string) {
  const { data, error } = await (supabase as any)
    .from("support_ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TicketMessage[];
}

export async function postTicketMessage(input: {
  ticket_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
}) {
  const { error } = await (supabase as any).from("support_ticket_messages").insert(input);
  if (error) throw error;
}
