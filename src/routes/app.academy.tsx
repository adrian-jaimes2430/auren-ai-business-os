import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Rocket, Kanban, Inbox, Radio, Workflow, Bot, Megaphone, Users, GraduationCap,
  CheckCircle2, Circle, ArrowRight, Sparkles, Lightbulb,
} from "lucide-react";
import { ACADEMY_MODULES, type AcademyModule } from "@/content/academy";
import { useAcademyProgress } from "@/hooks/use-academy-progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/app/academy")({
  component: AcademyPage,
  head: () => ({ meta: [{ title: "Academia — AUREN AI" }] }),
});

const ICONS = { rocket: Rocket, kanban: Kanban, inbox: Inbox, radio: Radio, workflow: Workflow, bot: Bot, megaphone: Megaphone, users: Users };

function AcademyPage() {
  const { isDone, toggle, moduleProgress } = useAcademyProgress();
  const [active, setActive] = useState<string>(ACADEMY_MODULES[0].id);

  const overall = useMemo(() => {
    const total = ACADEMY_MODULES.reduce((a, m) => a + m.lessons.length, 0);
    const done = ACADEMY_MODULES.reduce(
      (a, m) => a + m.lessons.filter((l) => isDone(m.id, l.id)).length,
      0,
    );
    return { total, done, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
  }, [isDone]);

  const activeModule = ACADEMY_MODULES.find((m) => m.id === active) ?? ACADEMY_MODULES[0];

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
            <GraduationCap className="h-3.5 w-3.5" /> Academia Auren
          </div>
          <h1 className="font-display text-3xl font-semibold mt-2">Domina la plataforma</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Recorridos interactivos, paso a paso, para que tú y tu equipo aprovechen al 100% cada función.
          </p>
        </div>
        <Card className="p-4 min-w-[220px]">
          <div className="text-xs text-muted-foreground">Tu progreso global</div>
          <div className="font-display text-2xl font-semibold mt-1">{overall.pct}%</div>
          <Progress value={overall.pct} className="mt-2 h-1.5" />
          <div className="text-[11px] text-muted-foreground mt-2">
            {overall.done} de {overall.total} lecciones completadas
          </div>
        </Card>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Module list */}
        <aside className="space-y-2">
          {ACADEMY_MODULES.map((m) => {
            const Icon = ICONS[m.icon];
            const p = moduleProgress(m.id, m.lessons.map((l) => l.id));
            const isActive = m.id === active;
            return (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                className={`w-full text-left rounded-xl p-3 border transition ${
                  isActive ? "bg-surface-elevated border-primary/40" : "border-border/50 hover:bg-surface/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-surface">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{m.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.done}/{p.total} lecciones
                    </div>
                  </div>
                  {p.pct === 100 && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                </div>
                <Progress value={p.pct} className="mt-2 h-1" />
              </button>
            );
          })}
        </aside>

        {/* Module detail */}
        <ModuleDetail module={activeModule} isDone={isDone} toggle={toggle} />
      </div>
    </div>
  );
}

function ModuleDetail({
  module: m,
  isDone,
  toggle,
}: {
  module: AcademyModule;
  isDone: (m: string, l: string) => boolean;
  toggle: (m: string, l: string) => void;
}) {
  const Icon = ICONS[m.icon];
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold">{m.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{m.summary}</p>
        </div>
      </div>

      <Accordion type="single" collapsible className="mt-6 space-y-2" defaultValue={m.lessons[0]?.id}>
        {m.lessons.map((lesson, idx) => {
          const done = isDone(m.id, lesson.id);
          return (
            <AccordionItem
              key={lesson.id}
              value={lesson.id}
              className="rounded-xl border border-border/60 bg-surface/30 px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(m.id, lesson.id);
                    }}
                    aria-label={done ? "Marcar como pendiente" : "Marcar como completada"}
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div>
                    <div className="text-sm font-medium">
                      <span className="text-muted-foreground mr-2">{String(idx + 1).padStart(2, "0")}.</span>
                      {lesson.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" /> {lesson.duration}
                      {done && <Badge variant="outline" className="ml-2 text-[10px] border-emerald-500/30 text-emerald-300">Completado</Badge>}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ol className="space-y-2 pl-1">
                  {lesson.steps.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-elevated text-xs font-medium text-primary">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-foreground/90">{s}</span>
                    </li>
                  ))}
                </ol>
                {lesson.tip && (
                  <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs flex gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="text-amber-100/90">{lesson.tip}</span>
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2">
                  {lesson.cta && (
                    <Button asChild size="sm">
                      <Link to={lesson.cta.to}>
                        {lesson.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={done ? "outline" : "secondary"}
                    onClick={() => toggle(m.id, lesson.id)}
                  >
                    {done ? "Marcar pendiente" : "Marcar completada"}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
