import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/crm")({ component: CRM });

const stages = [
  { name: "Prospecto", color: "bg-muted-foreground", deals: [
    { name: "Acme Corp", value: "$4,500", tag: "Web" },
    { name: "Globex", value: "$2,800", tag: "Referido" },
  ]},
  { name: "Contactado", color: "bg-ai", deals: [
    { name: "Initech", value: "$8,200", tag: "WhatsApp" },
  ]},
  { name: "Propuesta", color: "bg-primary", deals: [
    { name: "Stark Industries", value: "$22,000", tag: "Email" },
    { name: "Wayne Ent.", value: "$15,400", tag: "IG" },
  ]},
  { name: "Cerrado", color: "bg-chart-3", deals: [
    { name: "Pied Piper", value: "$9,900", tag: "WhatsApp" },
  ]},
];

function CRM() {
  return (
    <div className="p-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Pipeline visual · Drag and drop</p>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {stages.map((s) => (
          <div key={s.name} className="rounded-2xl glass p-4 min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${s.color}`} />
                <span className="text-sm font-medium">{s.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{s.deals.length}</span>
            </div>
            <div className="space-y-2">
              {s.deals.map((d) => (
                <div key={d.name} className="rounded-xl bg-surface p-3 cursor-grab hover:bg-surface-elevated transition-colors">
                  <div className="text-sm font-medium">{d.name}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{d.tag}</span>
                    <span className="text-xs font-medium text-primary">{d.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
