import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
  }
  return _supabase;
}

const PRICE_TO_PLAN: Record<string, string> = {
  starter_monthly: "starter",
  pro_monthly: "pro",
  business_monthly: "business",
  enterprise_monthly: "enterprise",
};

const PRICE_TO_MRR: Record<string, number> = {
  starter_monthly: 2900,
  pro_monthly: 7900,
  business_monthly: 12900,
  enterprise_monthly: 19900,
};

function mapStatus(paddleStatus: string): string {
  // map to our subscription_status enum: trial | active | past_due | canceled
  switch (paddleStatus) {
    case "trialing":
      return "trial";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "paused":
      return "canceled";
    default:
      return "active";
  }
}

async function handleSubscriptionUpsert(data: any, env: PaddleEnv) {
  const orgId = data.customData?.organizationId;
  if (!orgId) {
    console.warn("Webhook: missing organizationId in customData", data.id);
    return;
  }

  const item = data.items?.[0];
  const priceExternalId = item?.price?.importMeta?.externalId;
  if (!priceExternalId) {
    console.warn("Webhook: missing importMeta.externalId for price", item?.price?.id);
    return;
  }

  const plan = PRICE_TO_PLAN[priceExternalId] ?? "starter";
  const mrr = PRICE_TO_MRR[priceExternalId] ?? 0;
  const status = mapStatus(data.status);
  const supabase = getSupabase();

  // Upsert subscription row keyed on paddle_subscription_id
  const { error } = await supabase.from("subscriptions").upsert(
    {
      organization_id: orgId,
      paddle_subscription_id: data.id,
      paddle_customer_id: data.customerId,
      price_id: priceExternalId,
      plan,
      status,
      current_period_start: data.currentBillingPeriod?.startsAt ?? new Date().toISOString(),
      current_period_end: data.currentBillingPeriod?.endsAt ?? null,
      cancel_at_period_end: data.scheduledChange?.action === "cancel",
      environment: env,
      mrr_cents: status === "active" || status === "trial" ? mrr : 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" },
  );

  if (error) console.error("Webhook subscriptions upsert error:", error);

  // Activation business logic: sync organization plan when active/trialing
  if (status === "active" || status === "trial") {
    const { error: orgErr } = await supabase
      .from("organizations")
      .update({ plan, updated_at: new Date().toISOString() })
      .eq("id", orgId);
    if (orgErr) console.error("Webhook organizations plan update error:", orgErr);
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  const supabase = getSupabase();

  // Immediate cancel: degrade to starter
  const { data: row } = await supabase
    .from("subscriptions")
    .select("organization_id")
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env)
    .maybeSingle();

  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      mrr_cents: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);

  if (row?.organization_id) {
    await supabase
      .from("organizations")
      .update({ plan: "starter", updated_at: new Date().toISOString() })
      .eq("id", row.organization_id);
  }
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.eventType) {
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpsert(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    default:
      console.log("Unhandled Paddle event:", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Paddle webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
