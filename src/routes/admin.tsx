import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Users, CreditCard, AlertTriangle, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPanel,
  head: () => ({ meta: [{ title: "Admin · A&O Ecosystem" }] }),
});

const stats = [
  { label: "Usuarios totales", value: "12,420", icon: Users },
  { label: "MRR", value: "$184,300", icon: CreditCard },
  { label: "Tickets abiertos", value: "23", icon: AlertTriangle },
  { label: "Suscripciones activas", value: "3,820", icon: BarChart3 },
];

function AdminPanel() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 glass-strong">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary glow-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display font-semibold">Admin · A&amp;O Ecosystem</div>
              <div className="text-xs text-muted-foreground">Panel de gestión global</div>
            </div>
          </div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Salir</Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-3xl font-semibold">Visión global</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl glass p-5">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-elevated">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-4 font-display text-3xl font-semibold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl glass p-6">
            <div className="font-display text-lg font-semibold">Últimos registros</div>
            <div className="mt-4 space-y-3 text-sm">
              {["María López · Pro", "Acme SAS · Enterprise", "Carlos R. · Starter", "Globex · Pro"].map((u) => (
                <div key={u} className="flex items-center justify-between rounded-lg bg-surface p-3">
                  <span>{u}</span>
                  <span className="text-xs text-muted-foreground">hace 2h</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl glass p-6">
            <div className="font-display text-lg font-semibold">Tickets recientes</div>
            <div className="mt-4 space-y-3 text-sm">
              {["#1248 · Problema de login", "#1247 · Facturación", "#1246 · Integración WhatsApp"].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-lg bg-surface p-3">
                  <span>{t}</span>
                  <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-1">Abierto</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
