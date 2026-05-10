import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/team")({ component: TeamPage });

const team = [
  { name: "Alejandro Ortiz", role: "Admin", email: "ale@ao.com", status: "Activo" },
  { name: "María López", role: "Supervisor", email: "maria@ao.com", status: "Activo" },
  { name: "Carlos Ruiz", role: "Agente", email: "carlos@ao.com", status: "Activo" },
];

function TeamPage() {
  return (
    <div className="p-8 max-w-5xl">
      <h1 className="font-display text-3xl font-semibold">Equipo</h1>
      <p className="text-sm text-muted-foreground mt-1">Multiusuario · Roles · Permisos</p>
      <div className="mt-8 rounded-2xl glass overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border/60">
            <tr><th className="px-5 py-3">Nombre</th><th className="px-5 py-3">Rol</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Estado</th></tr>
          </thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.email} className="border-b border-border/40 hover:bg-surface">
                <td className="px-5 py-4 font-medium">{m.name}</td>
                <td className="px-5 py-4 text-muted-foreground">{m.role}</td>
                <td className="px-5 py-4 text-muted-foreground">{m.email}</td>
                <td className="px-5 py-4"><span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-1">{m.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
