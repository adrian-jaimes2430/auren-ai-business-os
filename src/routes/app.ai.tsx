import { createFileRoute } from "@tanstack/react-router";
import { Bot, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/ai")({ component: AIPage });

function AIPage() {
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-display text-3xl font-semibold">AUREN AI</h1>
      <p className="text-sm text-muted-foreground mt-1">Tu asistente comercial inteligente</p>

      <div className="mt-8 rounded-2xl glass-strong p-6 min-h-[400px] flex flex-col">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-ai animate-pulse" />
          Asistente activo · GPT-5
        </div>
        <div className="flex-1 mt-6 space-y-3">
          <div className="flex gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-ai shrink-0">
              <Bot className="h-4 w-4" style={{ color: "var(--ai-foreground)" }} />
            </div>
            <div className="rounded-2xl bg-surface px-4 py-3 text-sm">
              Hola, soy AUREN. Puedo analizar tus leads, redactar mensajes, resumir conversaciones y sugerirte el próximo paso para cerrar. ¿Por dónde empezamos?
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <input placeholder="Pregúntame algo..." className="flex-1 rounded-xl bg-surface px-4 py-3 text-sm outline-none border border-border/60 focus:border-ai/40" />
          <button className="grid place-items-center rounded-xl bg-gradient-ai px-4 glow-ai">
            <Sparkles className="h-4 w-4" style={{ color: "var(--ai-foreground)" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
