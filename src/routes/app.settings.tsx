import { createFileRoute } from "@tanstack/react-router";
import { Settings as Cog } from "lucide-react";
export const Route = createFileRoute("/app/settings")({ component: () => (
  <div className="p-8 max-w-4xl">
    <h1 className="font-display text-3xl font-semibold">Ajustes</h1>
    <p className="text-sm text-muted-foreground mt-1">Cuenta, facturación, integraciones y seguridad</p>
    <div className="mt-10 rounded-2xl glass p-12 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary glow-primary">
        <Cog className="h-6 w-6 text-primary-foreground" />
      </div>
      <p className="mt-5 text-muted-foreground">Próximamente</p>
    </div>
  </div>
)});
