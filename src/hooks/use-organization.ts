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

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || `org-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createOrganizationWithDefaults(input: {
  name: string;
  ownerId: string;
}) {
  const baseSlug = slugify(input.name);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({ name: input.name, slug, owner_id: input.ownerId, plan: "starter" })
    .select()
    .single();
  if (orgErr || !org) throw orgErr ?? new Error("No se pudo crear la organización");

  const { data: pipeline, error: pErr } = await supabase
    .from("pipelines")
    .insert({ organization_id: org.id, name: "Pipeline principal", is_default: true })
    .select()
    .single();
  if (pErr || !pipeline) throw pErr ?? new Error("No se pudo crear el pipeline");

  const stages = [
    { name: "Nuevo lead", position: 0, color: "#60a5fa", is_won: false, is_lost: false },
    { name: "Contactado", position: 1, color: "#a78bfa", is_won: false, is_lost: false },
    { name: "Calificado", position: 2, color: "#f59e0b", is_won: false, is_lost: false },
    { name: "Propuesta", position: 3, color: "#10b981", is_won: false, is_lost: false },
    { name: "Ganado", position: 4, color: "#22c55e", is_won: true, is_lost: false },
    { name: "Perdido", position: 5, color: "#ef4444", is_won: false, is_lost: true },
  ].map((s) => ({ ...s, pipeline_id: pipeline.id, organization_id: org.id }));

  const { error: stErr } = await supabase.from("pipeline_stages").insert(stages);
  if (stErr) throw stErr;

  return org;
}
