import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type Props = {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
};

export function AuthGuard({ children, requireAdmin, requireSuperAdmin }: Props) {
  const navigate = useNavigate();
  const { loading, user, isAdmin, isSuperAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (requireSuperAdmin && !isSuperAdmin) {
      navigate({ to: "/app" });
      return;
    }
    if (requireAdmin && !isAdmin) {
      navigate({ to: "/app" });
    }
  }, [loading, user, isAdmin, isSuperAdmin, requireAdmin, requireSuperAdmin, navigate]);

  if (loading || !user || (requireSuperAdmin && !isSuperAdmin) || (requireAdmin && !isAdmin)) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
