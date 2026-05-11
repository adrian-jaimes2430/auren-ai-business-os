import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Database } from "@/integrations/supabase/types";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrgRole = Database["public"]["Enums"]["org_role"];

export type Membership = {
  organization: Organization;
  role: OrgRole;
};

export function useOrganization() {
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
    setLoading(true);
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
      const stored = typeof window !== "undefined" ? localStorage.getItem("auren.currentOrgId") : null;
      const nextId = items.find((m) => m.organization.id === stored)?.organization.id ?? items[0]?.organization.id ?? null;
      setCurrentOrgId(nextId);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const switchOrg = (id: string) => {
    setCurrentOrgId(id);
    if (typeof window !== "undefined") localStorage.setItem("auren.currentOrgId", id);
  };

  const currentMembership = memberships.find((m) => m.organization.id === currentOrgId) ?? null;

  return {
    loading: authLoading || loading,
    memberships,
    currentOrg: currentMembership?.organization ?? null,
    currentRole: currentMembership?.role ?? null,
    switchOrg,
    refresh: load,
  };
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
