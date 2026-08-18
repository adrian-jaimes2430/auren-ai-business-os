import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Database } from "@/integrations/supabase/types";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrgRole = Database["public"]["Enums"]["org_role"];

export type Membership = {
  organization: Organization;
  role: OrgRole;
};

export type OrganizationState = {
  loading: boolean;
  memberships: Membership[];
  currentOrg: Organization | null;
  currentRole: OrgRole | null;
  switchOrg: (id: string) => void;
  refresh: () => Promise<void>;
};

const OrganizationContext = createContext<OrganizationState | null>(null);

function useOrganizationState(): OrganizationState {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setMemberships([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("organization_members")
      .select("role, organization:organizations(*)")
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to load memberships", error);
      setMemberships([]);
    } else {
      const items = (data ?? [])
        .filter((m) => m.organization)
        .map((m) => ({ organization: m.organization as Organization, role: m.role as OrgRole }));
      setMemberships(items);
      setCurrentOrgId((prev) => {
        if (prev && items.some((m) => m.organization.id === prev)) return prev;
        const stored = typeof window !== "undefined" ? localStorage.getItem("auren.currentOrgId") : null;
        return (
          items.find((m) => m.organization.id === stored)?.organization.id ??
          items[0]?.organization.id ??
          null
        );
      });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const switchOrg = useCallback((id: string) => {
    setCurrentOrgId(id);
    if (typeof window !== "undefined") localStorage.setItem("auren.currentOrgId", id);
  }, []);

  const currentMembership = memberships.find((m) => m.organization.id === currentOrgId) ?? null;

  return useMemo(
    () => ({
      loading: authLoading || loading,
      memberships,
      currentOrg: currentMembership?.organization ?? null,
      currentRole: currentMembership?.role ?? null,
      switchOrg,
      refresh: load,
    }),
    [authLoading, loading, memberships, currentMembership, switchOrg, load],
  );
}

/**
 * Single source of truth for the active workspace. Mounted once in /app so that
 * navigating between screens never refetches memberships (that caused the whole
 * screen to reset back to a loading state on every route change).
 */
export function OrganizationProvider({ children }: { children: ReactNode }) {
  const value = useOrganizationState();
  return createElement(OrganizationContext.Provider, { value }, children);
}

export function useOrganization(): OrganizationState {
  const ctx = useContext(OrganizationContext);
  // Fallback for screens rendered outside the /app layout (e.g. invitations).
  if (ctx) return ctx;
  return useOrganizationState();
}

export async function createOrganizationWithDefaults(input: {
  name: string;
  ownerId: string;
}) {
  if (!input.ownerId) throw new Error("No se pudo identificar al usuario");
  const { data: org, error } = await (supabase as any).rpc("create_workspace_with_defaults", {
    _name: input.name,
  });
  if (error || !org) throw error ?? new Error("No se pudo crear la organización");
  return org as Organization;
}
