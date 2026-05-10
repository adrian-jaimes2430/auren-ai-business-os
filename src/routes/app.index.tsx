import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Users, MessageSquare, DollarSign, Target } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const stats = [
  { label: "Ingresos", value: "$84,320", delta: "+12.4%", icon: DollarSign },
  { label: "Leads nuevos", value: "1,284", delta: "+38%", icon: Users },
  { label: "Conversaciones", value: "5,932", delta: "+18%", icon: MessageSquare },
  { label: "Tasa cierre", value: "24.8%", delta: "+3.1%", icon: Target },
];

function Dashboard() {
  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Resumen de tu operación · Últimos 30 días</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl glass p-5">
            <div className="flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-elevated">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-primary flex items-center gap-1">
                {s.delta} <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <div className="mt-4 font-display text-3xl font-semibold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl glass p-6 min-h-[320px]">
          <div className="font-display text-lg font-semibold">Pipeline de ventas</div>
          <div className="mt-6 grid grid-cols-4 gap-3">
            {["Prospecto", "Contactado", "Propuesta", "Cerrado"].map((s, i) => (
              <div key={s} className="rounded-xl bg-surface p-3">
                <div className="text-xs text-muted-foreground">{s}</div>
                <div className="font-display text-2xl font-semibold mt-1">{[42, 28, 16, 9][i]}</div>
                <div className="mt-2 h-1 rounded-full bg-gradient-primary" style={{ opacity: 1 - i * 0.2 }} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl glass p-6">
          <div className="font-display text-lg font-semibold">IA insights</div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg bg-surface p-3">🔥 12 leads calientes esperando respuesta</div>
            <div className="rounded-lg bg-surface p-3">💡 Mejor hora para enviar: 10:00 AM</div>
            <div className="rounded-lg bg-surface p-3">📈 +28% conversión esta semana</div>
          </div>
        </div>
      </div>
    </div>
  );
}
