import { createServerFn } from "@tanstack/react-start";
import { gatewayFetch, getPaddleClient, type PaddleEnv } from "@/lib/paddle.server";

export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: { priceId: string; environment: PaddleEnv }) => data)
  .handler(async ({ data }) => {
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const result = await response.json();
    if (!result.data?.length) throw new Error("Price not found");
    return result.data[0].id as string;
  });

/**
 * Change plan on an existing Paddle subscription.
 * Upgrade -> immediate + prorated. Downgrade -> at end of current period.
 */
export const changePlan = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      subscriptionId: string;
      newPriceId: string; // human-readable external_id (e.g. "pro_monthly")
      mode: "upgrade" | "downgrade";
      environment: PaddleEnv;
    }) => data,
  )
  .handler(async ({ data }) => {
    // Resolve external_id -> Paddle internal price id
    const res = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.newPriceId)}`,
    );
    const json = await res.json();
    const paddlePriceId = json.data?.[0]?.id;
    if (!paddlePriceId) throw new Error("Price not found in Paddle");

    const paddle = getPaddleClient(data.environment);
    const updated = await paddle.subscriptions.update(data.subscriptionId, {
      items: [{ priceId: paddlePriceId, quantity: 1 }],
      prorationBillingMode:
        data.mode === "upgrade" ? "prorated_immediately" : "do_not_bill",
      ...(data.mode === "downgrade" ? { effectiveFrom: "next_billing_period" } : {}),
    } as any);

    return { id: updated.id, status: updated.status };
  });

/** Cancel immediately (per business rule). */
export const cancelSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { subscriptionId: string; environment: PaddleEnv }) => data,
  )
  .handler(async ({ data }) => {
    const paddle = getPaddleClient(data.environment);
    const result = await paddle.subscriptions.cancel(data.subscriptionId, {
      effectiveFrom: "immediately",
    });
    return { id: result.id, status: result.status };
  });

/** Customer portal session URL — opens Paddle hosted portal in a new tab. */
export const createPortalSession = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { customerId: string; subscriptionIds: string[]; environment: PaddleEnv }) => data,
  )
  .handler(async ({ data }) => {
    const paddle = getPaddleClient(data.environment);
    const session = await paddle.customerPortalSessions.create(
      data.customerId,
      data.subscriptionIds,
    );
    return {
      overviewUrl: session.urls.general.overview,
      subscriptionUrls: session.urls.subscriptions,
    };
  });
