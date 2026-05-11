import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
  head: () => ({ meta: [{ title: "Aceptar invitación — AUREN AI" }] }),
});

type Inv = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  organization_id: string;
};

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [inv, setInv] = useState<Inv | null>(null);
  const [orgName, setOrgName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("organization_invitations")
        .select("id, email, role, status, expires_at, organization_id")
        .eq("token", token)
        .maybeSingle();
      if (error || !data) {
        setError("Esta invitación no existe.");
      } else {
        setInv(data as Inv);
        const { data: org } = await supabase.from("organizations").select("name").eq("id", data.organization_id).maybeSingle();
        setOrgName(org?.name ?? "");
      }
      setLoading(false);
    })();
  }, [token]);

  const accept = async () => {
    setAccepting(true);
    setError(null);
    const { data, error } = await supabase.rpc("accept_invitation", { _token: token });
    setAccepting(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data && typeof window !== "undefined") {
      localStorage.setItem("auren.currentOrgId", data as string);
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/app" }), 1200);
  };

  const expired = inv && new Date(inv.expires_at) < new Date();
  const wrongStatus = inv && inv.status !== "pending";
  const wrongEmail = inv && user && inv.email.toLowerCase() !== (user.email ?? "").toLowerCase();

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl glass p-8">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary glow-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold">AUREN <span className="text-gradient-primary">AI</span></span>
        </Link>

        {loading || authLoading ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verificando invitación…</div>
        ) : error || !inv ? (
          <Result icon={XCircle} tone="text-destructive" title="Invitación inválida" message={error ?? "No se encontró la invitación."} action={<Link to="/"><Button variant="outline">Ir al inicio</Button></Link>} />
        ) : expired || wrongStatus ? (
          <Result icon={XCircle} tone="text-destructive" title={expired ? "Invitación expirada" : "Invitación ya procesada"} message={expired ? "Pide a un administrador que te genere una nueva." : "Esta invitación ya fue aceptada o revocada."} action={<Link to="/app"><Button>Ir al workspace</Button></Link>} />
        ) : done ? (
          <Result icon={CheckCircle2} tone="text-primary" title="¡Bienvenido al equipo!" message={`Te uniste a ${orgName}. Redirigiendo…`} />
        ) : (
          <div>
            <h1 className="font-display text-2xl font-semibold">Te invitaron a {orgName || "una organización"}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Rol asignado: <span className="text-foreground capitalize font-medium">{inv.role}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Para: <span className="text-foreground font-medium">{inv.email}</span>
            </p>

            {!user ? (
              <div className="mt-6 space-y-3">
                <p className="text-sm">Inicia sesión o crea una cuenta con <span className="font-medium">{inv.email}</span> para aceptar.</p>
                <div className="flex gap-2">
                  <Link to="/login" className="flex-1"><Button className="w-full">Iniciar sesión</Button></Link>
                  <Link to="/register" className="flex-1"><Button variant="outline" className="w-full">Crear cuenta</Button></Link>
                </div>
              </div>
            ) : wrongEmail ? (
              <div className="mt-6 space-y-3">
                <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">
                  Estás autenticado como <span className="font-medium">{user.email}</span>, pero esta invitación es para <span className="font-medium">{inv.email}</span>.
                </div>
                <Button variant="outline" className="w-full" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); }}>
                  Cerrar sesión y entrar con el email correcto
                </Button>
              </div>
            ) : (
              <Button className="mt-6 w-full" onClick={accept} disabled={accepting}>
                {accepting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Aceptando…</> : "Aceptar invitación"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Result({ icon: Icon, tone, title, message, action }: { icon: any; tone: string; title: string; message: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-4">
      <Icon className={`mx-auto h-12 w-12 ${tone}`} />
      <h2 className="mt-4 font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
