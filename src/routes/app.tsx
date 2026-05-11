import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Kanban, Inbox, Workflow, Users, BarChart3, Bot, Settings, Sparkles, LogOut, Contact, Radio, Megaphone,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { OrgOnboarding } from "@/components/app/OrgOnboarding";

export const Route = createFileRoute("/app")({
  component: AppLayoutWrapper,
  head: () => ({ meta: [{ title: "AUREN AI — Workspace" }] }),
});

function AppLayoutWrapper() {
  return (
    <AuthGuard>
      <AppGate />
    </AuthGuard>
  );
}

function AppGate() {
  const { loading, currentOrg, refresh } = useOrganization();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-muted-foreground">Cargando workspace…</div>
      </div>
    );
  }
  if (!currentOrg) return <OrgOnboarding onCreated={refresh} />;
  return <AppLayout />;
}

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/crm", label: "CRM", icon: Kanban },
  { to: "/app/contacts", label: "Contactos", icon: Contact },
  { to: "/app/inbox", label: "Inbox", icon: Inbox },
  { to: "/app/channels", label: "Canales", icon: Radio },
  { to: "/app/automations", label: "Automatizaciones", icon: Workflow },
  { to: "/app/marketing", label: "Marketing", icon: Megaphone },
  { to: "/app/ai", label: "IA", icon: Bot },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/team", label: "Equipo", icon: Users },
  { to: "/app/settings", label: "Ajustes", icon: Settings },
];

function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentOrg, currentRole } = useOrganization();
  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };
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
        <div className="p-3 border-t border-border/60 space-y-2">
          <div className="rounded-xl glass p-3 text-xs">
            <div className="font-medium truncate">{currentOrg?.name ?? user?.email}</div>
            <div className="text-muted-foreground mt-0.5 capitalize">
              {currentRole ?? "miembro"} · plan {currentOrg?.plan ?? "starter"}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
