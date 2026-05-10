import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/inbox")({ component: InboxPage });

const convos = [
  { name: "María López", last: "Quiero saber sobre el plan Pro", channel: "WhatsApp", unread: 2, time: "2m" },
  { name: "Carlos Ruiz", last: "¿Tienen integración con Shopify?", channel: "Instagram", unread: 0, time: "12m" },
  { name: "Ana Torres", last: "Gracias por la demo!", channel: "Email", unread: 0, time: "1h" },
  { name: "Pedro Sánchez", last: "Cuándo podemos agendar?", channel: "Telegram", unread: 1, time: "3h" },
];

function InboxPage() {
  return (
    <div className="flex h-screen">
      <div className="w-80 border-r border-border/60 overflow-auto">
        <div className="p-5 border-b border-border/60">
          <h1 className="font-display text-2xl font-semibold">Inbox</h1>
          <p className="text-xs text-muted-foreground mt-1">Omnicanal unificado</p>
        </div>
        <div>
          {convos.map((c) => (
            <div key={c.name} className="p-4 border-b border-border/60 hover:bg-surface cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.time}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">{c.last}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.channel}</span>
                {c.unread > 0 && <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">{c.unread}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="p-5 border-b border-border/60 glass-strong">
          <div className="font-medium">María López</div>
          <div className="text-xs text-muted-foreground">WhatsApp · En línea</div>
        </div>
        <div className="flex-1 p-6 space-y-3 overflow-auto">
          <div className="max-w-md rounded-2xl bg-surface px-4 py-2.5 text-sm">Hola, quiero saber sobre el plan Pro</div>
          <div className="max-w-md rounded-2xl bg-gradient-primary px-4 py-2.5 text-sm text-primary-foreground ml-auto">¡Hola María! El plan Pro incluye automatizaciones ilimitadas e IA avanzada. ¿Quieres una demo?</div>
        </div>
        <div className="p-4 border-t border-border/60">
          <input placeholder="Escribe un mensaje..." className="w-full rounded-xl bg-surface px-4 py-3 text-sm outline-none border border-border/60 focus:border-primary/40" />
        </div>
      </div>
    </div>
  );
}
