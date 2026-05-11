import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ArrowDownRight, ArrowUpRight, BarChart3, DollarSign, MessageSquare, Target,
  TrendingUp, Users, Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "Analytics — AUREN AI" }] }),
});

type Range = "7d" | "30d" | "90d";

type Metrics = {
  contacts: number;
  contactsPrev: number;
  deals: number;
  dealsValue: number;
  dealsValuePrev: number;
  conversations: number;
  conversationsPrev: number;
  messages: number;
  winRate: number;
  avgTicket: number;
  series: { date: string; deals: number; revenue: number; messages: number; contacts: number }[];
  byChannel: { name: string; value: number }[];
  byStage: { name: string; value: number; color: string }[];
  bySource: { name: string; value: number }[];
  topReps: { name: string; deals: number; revenue: number }[];
};

const RANGE_DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };
const PIE_COLORS = ["#60a5fa", "#a78bfa", "#f59e0b", "#10b981", "#ec4899", "#22d3ee", "#ef4444", "#14b8a6"];

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function fmtMoney(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n); }
function fmtNum(n: number) { return new Intl.NumberFormat("es").format(n); }
function pctDelta(curr: number, prev: number) {
  if (!prev) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function AnalyticsPage() {
  const { currentOrg } = useOrganization();
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    if (!currentOrg) return;
    let cancelled = false;
    const orgId = currentOrg.id;
    const days = RANGE_DAYS[range];
    const now = new Date();
    const from = startOfDay(new Date(now.getTime() - days * 86400000));
    const prevFrom = startOfDay(new Date(from.getTime() - days * 86400000));

    (async () => {
      setLoading(true);
      const [
        contactsRes, contactsPrevRes,
        dealsRes, dealsPrevRes,
        convsRes, convsPrevRes,
        messagesRes, stagesRes,
      ] = await Promise.all([
        supabase.from("contacts").select("id, source, created_at").eq("organization_id", orgId).gte("created_at", from.toISOString()),
        supabase.from("contacts").select("id", { count: "exact", head: true }).eq("organization_id", orgId).gte("created_at", prevFrom.toISOString()).lt("created_at", from.toISOString()),
        supabase.from("deals").select("id, value, status, stage_id, owner_id, created_at").eq("organization_id", orgId).gte("created_at", from.toISOString()),
        supabase.from("deals").select("id, value, status", { count: "exact" }).eq("organization_id", orgId).gte("created_at", prevFrom.toISOString()).lt("created_at", from.toISOString()),
        supabase.from("conversations").select("id, channel, created_at").eq("organization_id", orgId).gte("created_at", from.toISOString()),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("organization_id", orgId).gte("created_at", prevFrom.toISOString()).lt("created_at", from.toISOString()),
        supabase.from("messages").select("id, created_at, direction").eq("organization_id", orgId).gte("created_at", from.toISOString()),
        supabase.from("pipeline_stages").select("id, name, color, is_won, is_lost").eq("organization_id", orgId),
      ]);

      if (cancelled) return;

      const contacts = contactsRes.data ?? [];
      const deals = dealsRes.data ?? [];
      const dealsPrev = dealsPrevRes.data ?? [];
      const convs = convsRes.data ?? [];
      const messages = messagesRes.data ?? [];
      const stages = stagesRes.data ?? [];

      // Owners lookup
      const ownerIds = Array.from(new Set(deals.map((d: any) => d.owner_id).filter(Boolean)));
      let ownerMap: Record<string, string> = {};
      if (ownerIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds);
        ownerMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.full_name || p.email || "Sin nombre"]));
      }

      const dealsValue = deals.reduce((s: number, d: any) => s + Number(d.value || 0), 0);
      const dealsValuePrev = dealsPrev.reduce((s: number, d: any) => s + Number(d.value || 0), 0);
      const wonStages = new Set(stages.filter((s: any) => s.is_won).map((s: any) => s.id));
      const wonCount = deals.filter((d: any) => wonStages.has(d.stage_id) || d.status === "won").length;
      const closedCount = deals.filter((d: any) => d.status !== "open").length || deals.length;
      const winRate = closedCount ? (wonCount / closedCount) * 100 : 0;
      const avgTicket = deals.length ? dealsValue / deals.length : 0;

      // Time series
      const seriesMap = new Map<string, { date: string; deals: number; revenue: number; messages: number; contacts: number }>();
      for (let i = days - 1; i >= 0; i--) {
        const d = startOfDay(new Date(now.getTime() - i * 86400000));
        const key = d.toISOString().slice(0, 10);
        seriesMap.set(key, { date: key, deals: 0, revenue: 0, messages: 0, contacts: 0 });
      }
      deals.forEach((d: any) => {
        const k = d.created_at.slice(0, 10);
        const row = seriesMap.get(k); if (!row) return;
        row.deals += 1; row.revenue += Number(d.value || 0);
      });
      messages.forEach((m: any) => {
        const k = m.created_at.slice(0, 10);
        const row = seriesMap.get(k); if (!row) return;
        row.messages += 1;
      });
      contacts.forEach((c: any) => {
        const k = c.created_at.slice(0, 10);
        const row = seriesMap.get(k); if (!row) return;
        row.contacts += 1;
      });
      const series = Array.from(seriesMap.values());

      // By channel
      const channelMap = new Map<string, number>();
      convs.forEach((c: any) => channelMap.set(c.channel, (channelMap.get(c.channel) ?? 0) + 1));
      const byChannel = Array.from(channelMap.entries()).map(([name, value]) => ({ name, value }));

      // By stage
      const stageMap = new Map<string, number>();
      deals.forEach((d: any) => stageMap.set(d.stage_id, (stageMap.get(d.stage_id) ?? 0) + 1));
      const byStage = stages
        .map((s: any, i: number) => ({ name: s.name, value: stageMap.get(s.id) ?? 0, color: s.color || PIE_COLORS[i % PIE_COLORS.length] }))
        .filter((s) => s.value > 0);

      // By source
      const sourceMap = new Map<string, number>();
      contacts.forEach((c: any) => sourceMap.set(c.source || "Sin origen", (sourceMap.get(c.source || "Sin origen") ?? 0) + 1));
      const bySource = Array.from(sourceMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

      // Top reps
      const repMap = new Map<string, { deals: number; revenue: number }>();
      deals.forEach((d: any) => {
        if (!d.owner_id) return;
        const k = d.owner_id;
        const cur = repMap.get(k) ?? { deals: 0, revenue: 0 };
        cur.deals += 1; cur.revenue += Number(d.value || 0);
        repMap.set(k, cur);
      });
      const topReps = Array.from(repMap.entries())
        .map(([id, v]) => ({ name: ownerMap[id] || "Sin asignar", ...v }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setMetrics({
        contacts: contacts.length,
        contactsPrev: contactsPrevRes.count ?? 0,
        deals: deals.length,
        dealsValue,
        dealsValuePrev,
        conversations: convs.length,
        conversationsPrev: convsPrevRes.count ?? 0,
        messages: messages.length,
        winRate,
        avgTicket,
        series,
        byChannel,
        byStage,
        bySource,
        topReps,
      });
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [currentOrg, range]);

  const kpis = useMemo(() => {
    if (!metrics) return [];
    return [
      { label: "Ingresos", value: fmtMoney(metrics.dealsValue), delta: pctDelta(metrics.dealsValue, metrics.dealsValuePrev), icon: DollarSign },
      { label: "Nuevos contactos", value: fmtNum(metrics.contacts), delta: pctDelta(metrics.contacts, metrics.contactsPrev), icon: Users },
      { label: "Conversaciones", value: fmtNum(metrics.conversations), delta: pctDelta(metrics.conversations, metrics.conversationsPrev), icon: MessageSquare },
      { label: "Tasa de cierre", value: `${metrics.winRate.toFixed(1)}%`, delta: 0, icon: Target, hideDelta: true },
    ];
  }, [metrics]);

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary glow-primary">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </span>
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Métricas reales de tu operación · {currentOrg?.name}</p>
        </div>
        <div className="inline-flex rounded-lg border border-border/60 bg-surface p-1 text-xs">
          {(["7d", "30d", "90d"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                range === r ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "7d" ? "7 días" : r === "30d" ? "30 días" : "90 días"}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading || !metrics
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          : kpis.map((k) => {
              const up = k.delta >= 0;
              return (
                <div key={k.label} className="rounded-2xl glass p-5">
                  <div className="flex items-center justify-between">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-elevated">
                      <k.icon className="h-4 w-4 text-primary" />
                    </div>
                    {!k.hideDelta && (
                      <span className={`text-xs flex items-center gap-1 ${up ? "text-primary" : "text-destructive"}`}>
                        {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(k.delta).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="mt-4 font-display text-3xl font-semibold">{k.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
                </div>
              );
            })}
      </div>

      {/* Revenue + Activity */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl glass p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="font-display text-lg font-semibold">Ingresos generados</div>
              <div className="text-xs text-muted-foreground">Suma diaria del valor de los deals creados</div>
            </div>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="h-72 mt-4">
            {loading || !metrics ? <Skeleton className="h-full w-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.series}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => fmtMoney(v)}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl glass p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="font-display text-lg font-semibold">Actividad</div>
              <div className="text-xs text-muted-foreground">Mensajes vs contactos nuevos</div>
            </div>
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div className="h-72 mt-4">
            {loading || !metrics ? <Skeleton className="h-full w-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.series}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="messages" name="Mensajes" stroke="#a78bfa" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="contacts" name="Contactos" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline + Channel + Source */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl glass p-6">
          <div className="font-display text-lg font-semibold">Pipeline por etapa</div>
          <div className="text-xs text-muted-foreground">Distribución de deals creados</div>
          <div className="h-64 mt-4">
            {loading || !metrics ? <Skeleton className="h-full w-full rounded-xl" /> : metrics.byStage.length === 0 ? (
              <EmptyState text="Sin deals en el rango" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.byStage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {metrics.byStage.map((s, i) => (<Cell key={i} fill={s.color} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl glass p-6">
          <div className="font-display text-lg font-semibold">Canal</div>
          <div className="text-xs text-muted-foreground">Conversaciones por canal</div>
          <div className="h-64 mt-4">
            {loading || !metrics ? <Skeleton className="h-full w-full rounded-xl" /> : metrics.byChannel.length === 0 ? (
              <EmptyState text="Sin conversaciones" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.byChannel} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {metrics.byChannel.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl glass p-6">
          <div className="font-display text-lg font-semibold">Origen de leads</div>
          <div className="text-xs text-muted-foreground">Top fuentes de contactos</div>
          <div className="h-64 mt-4">
            {loading || !metrics ? <Skeleton className="h-full w-full rounded-xl" /> : metrics.bySource.length === 0 ? (
              <EmptyState text="Sin contactos en el rango" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.bySource}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top reps + ticket promedio */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl glass p-6">
          <div className="font-display text-lg font-semibold">Top vendedores</div>
          <div className="text-xs text-muted-foreground">Por ingresos generados en el período</div>
          {loading || !metrics ? (
            <div className="mt-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : metrics.topReps.length === 0 ? (
            <div className="mt-6"><EmptyState text="Sin vendedores con deals" /></div>
          ) : (
            <div className="mt-5 space-y-2">
              {metrics.topReps.map((r, i) => {
                const max = metrics.topReps[0]?.revenue || 1;
                const pct = (r.revenue / max) * 100;
                return (
                  <div key={i} className="rounded-xl bg-surface p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold">
                          {r.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-muted-foreground">{r.deals} deals</div>
                        </div>
                      </div>
                      <div className="font-display font-semibold">{fmtMoney(r.revenue)}</div>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                      <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl glass p-6 flex flex-col">
          <div className="font-display text-lg font-semibold">Insights</div>
          <div className="text-xs text-muted-foreground">Resumen del período</div>
          {loading || !metrics ? (
            <Skeleton className="mt-4 flex-1 rounded-xl" />
          ) : (
            <div className="mt-5 space-y-3 text-sm">
              <InsightRow label="Ticket promedio" value={fmtMoney(metrics.avgTicket)} />
              <InsightRow label="Deals creados" value={fmtNum(metrics.deals)} />
              <InsightRow label="Mensajes intercambiados" value={fmtNum(metrics.messages)} />
              <InsightRow label="Tasa de cierre" value={`${metrics.winRate.toFixed(1)}%`} />
              <div className="rounded-xl bg-surface p-3 text-xs text-muted-foreground mt-4">
                {metrics.deals === 0
                  ? "Aún no tienes deals en este rango. Crea oportunidades desde el CRM para alimentar este dashboard."
                  : metrics.winRate >= 30
                  ? "🚀 Tu tasa de cierre está por encima del promedio. Mantén el ritmo."
                  : "💡 Considera automatizar follow-ups para subir tu tasa de cierre."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-display font-semibold">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-full grid place-items-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}
