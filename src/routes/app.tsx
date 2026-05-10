import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Kanban, Inbox, Workflow, Users, BarChart3, Bot, Settings, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
  head: () => ({ meta: [{ title: "AUREN AI — Workspace" }] }),
});

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/crm", label: "CRM", icon: Kanban },
  { to: "/app/inbox", label: "Inbox", icon: Inbox },
  { to: "/app/automations", label: "Automatizaciones", icon: Workflow },
  { to: "/app/ai", label: "IA", icon: Bot },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/team", label: "Equipo", icon: Users },
  { to: "/app/settings", label: "Ajustes", icon: Settings },
];

function AppLayout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-r border-border/60 glass-strong flex flex-col">
        <Link to="/" className="flex items-center gap-2 px-5 py-5 border-b border-border/60">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary glow-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold">AUREN <span className="text-gradient-primary">AI</span></span>
        </Link>
        <nav className="p-3 space-y-1 flex-1">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="rounded-xl glass p-3 text-xs">
            <div className="font-medium">Plan Pro</div>
            <div className="text-muted-foreground mt-0.5">7,820 / 10,000 contactos</div>
            <div className="mt-2 h-1.5 rounded-full bg-surface overflow-hidden">
              <div className="h-full bg-gradient-primary" style={{ width: "78%" }} />
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
