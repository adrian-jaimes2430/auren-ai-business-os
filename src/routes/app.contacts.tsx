import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2, Plus, Search, Trash2, Pencil, Mail, Phone, Tag as TagIcon, X, Download, Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/app/contacts")({ component: ContactsPage });

type Contact = Database["public"]["Tables"]["contacts"]["Row"];

function ContactsPage() {
  const { currentOrg, loading: orgLoading } = useOrganization();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [toDelete, setToDelete] = useState<Contact | null>(null);

  async function load(orgId: string) {
    setLoading(true);
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    setContacts(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (currentOrg) load(currentOrg.id);
  }, [currentOrg?.id]);

  // realtime
  useEffect(() => {
    if (!currentOrg) return;
    const ch = supabase
      .channel(`contacts:${currentOrg.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts", filter: `organization_id=eq.${currentOrg.id}` },
        () => load(currentOrg.id),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [currentOrg?.id]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    contacts.forEach((c) => (c.tags ?? []).forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [contacts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (activeTag && !(c.tags ?? []).includes(activeTag)) return false;
      if (!q) return true;
      return (
        c.full_name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [contacts, search, activeTag]);

  async function handleDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    setToDelete(null);
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) toast.error("No se pudo eliminar");
    else toast.success("Contacto eliminado");
  }

  function exportCSV() {
    const rows = [
      ["Nombre", "Email", "Teléfono", "Origen", "Etiquetas", "Creado"],
      ...filtered.map((c) => [
        c.full_name,
        c.email ?? "",
        c.phone ?? "",
        c.source ?? "",
        (c.tags ?? []).join("|"),
        c.created_at,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contactos-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (orgLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando contactos...
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold">Contactos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {contacts.length} contactos · {allTags.length} etiquetas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Dialog
            open={openForm}
            onOpenChange={(o) => { setOpenForm(o); if (!o) setEditing(null); }}
          >
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4 mr-1" /> Nuevo contacto
              </Button>
            </DialogTrigger>
            <ContactFormDialog
              orgId={currentOrg?.id}
              contact={editing}
              onSaved={() => { setOpenForm(false); setEditing(null); }}
            />
          </Dialog>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={contacts.length} icon={<Users className="h-4 w-4" />} />
        <StatCard
          label="Con email"
          value={contacts.filter((c) => c.email).length}
          icon={<Mail className="h-4 w-4" />}
        />
        <StatCard
          label="Con teléfono"
          value={contacts.filter((c) => c.phone).length}
          icon={<Phone className="h-4 w-4" />}
        />
      </div>

      {/* Search + tag filters */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono o etiqueta..."
            className="pl-9"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTag(null)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                !activeTag ? "bg-primary text-primary-foreground border-transparent" : "border-border hover:bg-surface"
              }`}
            >
              Todas
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(t === activeTag ? null : t)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                  activeTag === t ? "bg-primary text-primary-foreground border-transparent" : "border-border hover:bg-surface"
                }`}
              >
                <TagIcon className="h-3 w-3" /> {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="mt-6 rounded-2xl glass overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {contacts.length === 0
              ? "Aún no tienes contactos. Crea el primero con el botón arriba."
              : "Sin resultados para tu búsqueda."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="text-left font-medium px-5 py-3">Contacto</th>
                  <th className="text-left font-medium px-5 py-3">Comunicación</th>
                  <th className="text-left font-medium px-5 py-3">Etiquetas</th>
                  <th className="text-left font-medium px-5 py-3">Origen</th>
                  <th className="text-left font-medium px-5 py-3">Creado</th>
                  <th className="text-right font-medium px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/40 hover:bg-surface/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                            {initials(c.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{c.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {c.email && <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{c.email}</span>}
                        {c.phone && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{c.phone}</span>}
                        {!c.email && !c.phone && <span>—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags ?? []).slice(0, 3).map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                        ))}
                        {(c.tags?.length ?? 0) > 3 && (
                          <Badge variant="outline" className="text-[10px]">+{c.tags!.length - 3}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground capitalize">{c.source ?? "—"}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: es })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => { setEditing(c); setOpenForm(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => setToDelete(c)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{toDelete?.full_name}" de forma permanente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl glass p-4 flex items-center justify-between">
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-display text-2xl font-semibold mt-1">{value.toLocaleString("es")}</div>
      </div>
      <div className="h-9 w-9 rounded-lg bg-surface-elevated grid place-items-center text-muted-foreground">
        {icon}
      </div>
    </div>
  );
}

function ContactFormDialog({
  orgId, contact, onSaved,
}: {
  orgId?: string;
  contact: Contact | null;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(contact?.full_name ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [source, setSource] = useState(contact?.source ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [tags, setTags] = useState<string[]>(contact?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(contact?.full_name ?? "");
    setEmail(contact?.email ?? "");
    setPhone(contact?.phone ?? "");
    setSource(contact?.source ?? "");
    setNotes(contact?.notes ?? "");
    setTags(contact?.tags ?? []);
  }, [contact?.id]);

  function addTag() {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  async function submit() {
    if (!orgId || !fullName.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    setSaving(true);
    const payload = {
      organization_id: orgId,
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      source: source.trim() || null,
      notes: notes.trim() || null,
      tags,
    };
    const { error } = contact
      ? await supabase.from("contacts").update(payload).eq("id", contact.id)
      : await supabase.from("contacts").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(contact ? "Contacto actualizado" : "Contacto creado");
    onSaved();
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{contact ? "Editar contacto" : "Nuevo contacto"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        <div className="space-y-1.5">
          <Label>Nombre completo *</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="María López" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+52..." />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Origen</Label>
          <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Web, Referido, WhatsApp..." />
        </div>
        <div className="space-y-1.5">
          <Label>Etiquetas</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Añade una etiqueta y pulsa Enter"
            />
            <Button type="button" variant="outline" onClick={addTag}>Añadir</Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1 pr-1">
                  {t}
                  <button
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Notas</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : contact ? "Guardar cambios" : "Crear contacto"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}
