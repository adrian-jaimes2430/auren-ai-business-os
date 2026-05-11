import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { BookOpen, Plus, Search, Sparkles, Loader2, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/knowledge")({
  component: KnowledgePage,
  head: () => ({ meta: [{ title: "Knowledge Base — AUREN AI" }] }),
});

type Article = {
  id: string;
  organization_id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[];
  is_active: boolean;
  use_count: number;
  updated_at: string;
};

function KnowledgePage() {
  const { currentOrg, currentRole } = useOrganization();
  const orgId = currentOrg?.id;
  const canManage = ["owner", "admin", "supervisor"].includes(currentRole ?? "");

  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Article | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("knowledge_articles")
      .select("*")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    else setItems((data ?? []) as Article[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [orgId]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        a.content.toLowerCase().includes(term) ||
        (a.category ?? "").toLowerCase().includes(term) ||
        a.tags.join(" ").toLowerCase().includes(term),
    );
  }, [items, q]);

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este artículo?")) return;
    const { error } = await supabase.from("knowledge_articles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Artículo eliminado");
    load();
  };

  const toggleActive = async (a: Article) => {
    const { error } = await supabase
      .from("knowledge_articles")
      .update({ is_active: !a.is_active })
      .eq("id", a.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-primary" />
            Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Información que tu IA usará para responder con precisión a tus clientes.
          </p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)} className="gap-2">
                <Plus className="h-4 w-4" /> Nuevo artículo
              </Button>
            </DialogTrigger>
            <ArticleDialog
              orgId={orgId!}
              article={editing}
              onClose={() => { setOpen(false); setEditing(null); load(); }}
            />
          </Dialog>
        )}
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título, contenido, etiquetas…" className="pl-9" />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {items.length === 0
              ? "Todavía no has añadido conocimiento. Crea tu primer artículo para que la IA pueda responder con tu información."
              : "Sin resultados para tu búsqueda."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((a) => (
            <Card key={a.id} className="p-5 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{a.title}</h3>
                    {a.category && <Badge variant="secondary">{a.category}</Badge>}
                    {!a.is_active && <Badge variant="outline" className="text-muted-foreground">Inactivo</Badge>}
                    {a.use_count > 0 && (
                      <span className="text-xs text-muted-foreground">· usado {a.use_count}×</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2 whitespace-pre-wrap">
                    {a.content}
                  </p>
                  {a.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {a.tags.map((t) => (
                        <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-border/60 text-muted-foreground">
                          <Tag className="h-2.5 w-2.5 inline mr-1" />{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {canManage && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a)} />
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(a); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Editor dialog ---------- */
function ArticleDialog({
  orgId, article, onClose,
}: { orgId: string; article: Article | null; onClose: () => void }) {
  const [title, setTitle] = useState(article?.title ?? "");
  const [category, setCategory] = useState(article?.category ?? "");
  const [tagsInput, setTagsInput] = useState((article?.tags ?? []).join(", "));
  const [content, setContent] = useState(article?.content ?? "");
  const [isActive, setIsActive] = useState(article?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setTitle(article?.title ?? "");
    setCategory(article?.category ?? "");
    setTagsInput((article?.tags ?? []).join(", "));
    setContent(article?.content ?? "");
    setIsActive(article?.is_active ?? true);
  }, [article]);

  const generateWithAI = async () => {
    if (!title.trim()) return toast.error("Escribe primero un título o pregunta");
    setAiLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "Eres un experto en documentación de producto. Redacta un artículo de knowledge base claro, conciso y útil para que un agente de IA pueda usarlo para responder a clientes. Usa lenguaje natural, evita listas excesivas. Responde solo con el contenido del artículo, sin títulos ni encabezados." },
            { role: "user", content: `Tema: ${title}${category ? `\nCategoría: ${category}` : ""}` },
          ],
        }),
      });
      if (!res.ok || !res.body) throw new Error("Fallo al generar");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      setContent("");
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) setContent((c) => c + delta);
          } catch {}
        }
      }
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo generar");
    } finally {
      setAiLoading(false);
    }
  };

  const save = async () => {
    if (!title.trim() || !content.trim()) return toast.error("Título y contenido son obligatorios");
    setSaving(true);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      organization_id: orgId,
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || null,
      tags,
      is_active: isActive,
    };
    const { error } = article
      ? await supabase.from("knowledge_articles").update(payload).eq("id", article.id)
      : await supabase.from("knowledge_articles").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(article ? "Artículo actualizado" : "Artículo creado");
    onClose();
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{article ? "Editar artículo" : "Nuevo artículo"}</DialogTitle>
        <DialogDescription>
          La IA usará este contenido para responder a clientes en tu nombre.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Título / Pregunta</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="¿Cuál es vuestro horario de atención?" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Categoría</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Soporte, Ventas, Facturación…" />
          </div>
          <div className="grid gap-2">
            <Label>Etiquetas <span className="text-muted-foreground text-xs">(separadas por coma)</span></Label>
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="precios, plan-pro, descuento" />
          </div>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>Contenido</Label>
            <Button size="sm" variant="outline" onClick={generateWithAI} disabled={aiLoading} className="gap-2 h-8">
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Generar con IA
            </Button>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe la respuesta o información que la IA debe usar…"
            className="min-h-[200px] font-mono text-sm"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
          <div>
            <p className="text-sm font-medium">Activo</p>
            <p className="text-xs text-muted-foreground">Solo los artículos activos se usan en respuestas de IA.</p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {article ? "Guardar cambios" : "Crear artículo"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
