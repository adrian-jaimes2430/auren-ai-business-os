import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
};

export function useAuth(): AuthState & { signOut: () => Promise<void> } {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadRoles = async (userId: string | undefined) => {
      if (!userId) {
        if (mounted) setRoles([]);
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if (mounted) setRoles((data ?? []).map((r) => r.role as AppRole));
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // defer to avoid deadlock
      setTimeout(() => loadRoles(s?.user?.id), 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      loadRoles(data.session?.user?.id).finally(() => mounted && setLoading(false));
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    loading,
    session,
    user: session?.user ?? null,
    roles,
    isSuperAdmin: roles.includes("super_admin"),
    isAdmin: roles.includes("super_admin") || roles.includes("admin"),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
}
