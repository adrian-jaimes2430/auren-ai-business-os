import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import type { Database } from "@/integrations/supabase/types";

export type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

/**
 * Returns the latest subscription for an org in the current Paddle environment.
 * Sandbox and live rows coexist — always filter by env.
 */
export function useSubscription(organizationId: string | null) {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const env = getPaddleEnvironment();
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as SubscriptionRow) ?? null);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!organizationId) return;
    const channel = supabase
      .channel(`sub:${organizationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `organization_id=eq.${organizationId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, load]);

  const isPaid = !!(
    subscription &&
    subscription.paddle_subscription_id &&
    (subscription.status === "active" || subscription.status === "trial")
  );

  return { subscription, loading, isPaid, refresh: load };
}
