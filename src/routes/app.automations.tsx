import { createFileRoute } from "@tanstack/react-router";
import { Workflow } from "lucide-react";
export const Route = createFileRoute("/app/automations")({ component: () => <Stub title="Automatizaciones" desc="Constructor visual de flujos, disparadores y secuencias." Icon={Workflow} /> });

function Stub({ title, desc, Icon }: { title: string; desc: string; Icon: any }) {
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      <div className="mt-10 rounded-2xl glass p-12 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary glow-primary">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <p className="mt-5 text-muted-foreground">Módulo en construcción · Próximamente</p>
      </div>
    </div>
  );
}
