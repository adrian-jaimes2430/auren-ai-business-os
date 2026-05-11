import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, Trash2, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/app/ai")({ component: AiPage });

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "auren.ai.history";

const SUGGESTIONS = [
  { title: "Mensaje de bienvenida WhatsApp", prompt: "Redacta un mensaje de bienvenida por WhatsApp para un nuevo lead que solicitó información sobre nuestros planes. Tono cercano, profesional y con un CTA claro a agendar demo." },
  { title: "Email de seguimiento", prompt: "Escribe un email corto de seguimiento para un prospecto que vio nuestra demo hace 3 días y no ha respondido. Objetivo: reactivar la conversación sin presionar." },
  { title: "Calificar lead", prompt: "Dame las 5 preguntas clave para calificar un lead B2B que llega desde un anuncio de Instagram pidiendo información de precios." },
  { title: "Resumen de pipeline", prompt: "Tengo 12 negocios abiertos: 4 en propuesta, 5 en contactado, 3 en calificado. ¿Qué acciones priorizo esta semana?" },
];

function AiPage() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load history
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  async function send(text: string) {
    const value = text.trim();
    if (!value || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: value }];
    setMessages(next);
    setLoading(true);

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
    const controller = new AbortController();
    abortRef.current = controller;

    let assistant = "";
    const upsert = (chunk: string) => {
      assistant += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistant } : m));
        }
        return [...prev, { role: "assistant", content: assistant }];
      });
    };

    try {
      const resp = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Error" }));
        if (resp.status === 429) toast.error("Demasiadas solicitudes. Intenta en un momento.");
        else if (resp.status === 402) toast.error("Sin créditos. Añade saldo en Lovable Cloud.");
        else toast.error(err.error ?? "Error en la IA");
        setMessages((prev) => prev.slice(0, -1));
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (c) upsert(c);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        console.error(e);
        toast.error("Error de conexión con la IA");
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function clear() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="px-6 py-4 border-b border-border/60 glass-strong flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary glow-primary grid place-items-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold">AUREN Assistant</h1>
            <p className="text-xs text-muted-foreground">IA comercial · {currentOrg?.name ?? "workspace"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">Gemini 3 Flash</Badge>
          <Button variant="ghost" size="sm" onClick={clear} disabled={!messages.length}>
            <Trash2 className="h-4 w-4 mr-1" /> Limpiar
          </Button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          {messages.length === 0 ? (
            <div className="text-center pt-8 animate-fade-in">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-primary glow-primary grid place-items-center">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl mt-5">{greeting}, {user?.email?.split("@")[0]}</h2>
              <p className="text-sm text-muted-foreground mt-2">¿En qué te ayudo hoy? Aquí algunas ideas:</p>
              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => send(s.prompt)}
                    className="text-left rounded-xl border border-border bg-surface hover:border-primary/40 hover:bg-surface-elevated transition-all p-4"
                  >
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.prompt}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
              {loading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 animate-fade-in">
                  <Avatar role="assistant" />
                  <div className="rounded-2xl bg-surface px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pensando…
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/60 p-4">
        <div className="mx-auto max-w-3xl flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Pregunta lo que necesites… (Enter para enviar, Shift+Enter para salto)"
            rows={1}
            className="resize-none min-h-[48px] max-h-40"
          />
          <Button onClick={() => send(input)} disabled={loading || !input.trim()} size="icon" className="h-12 w-12 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mx-auto max-w-3xl text-[10px] text-muted-foreground text-center mt-2">
          La IA puede cometer errores. Revisa información sensible antes de enviar.
        </p>
      </div>
    </div>
  );
}

function Avatar({ role }: { role: "user" | "assistant" }) {
  if (role === "user") {
    return (
      <div className="h-8 w-8 rounded-lg bg-surface-elevated grid place-items-center shrink-0">
        <User className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="h-8 w-8 rounded-lg bg-gradient-primary glow-primary grid place-items-center shrink-0">
      <Sparkles className="h-4 w-4 text-primary-foreground" />
    </div>
  );
}

function ChatBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar role={msg.role} />
      <div
        className={`rounded-2xl px-4 py-3 text-sm max-w-[85%] ${
          isUser ? "bg-gradient-primary text-primary-foreground" : "bg-surface"
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{msg.content}</div>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:mt-3 prose-headings:mb-2 prose-pre:bg-surface-elevated prose-pre:text-foreground prose-code:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || "…"}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
