import { useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";

interface CheckoutOptions {
  priceId: string;
  organizationId: string;
  customerEmail?: string;
  successUrl?: string;
}

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: CheckoutOptions) => {
    setLoading(true);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(options.priceId);

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: options.customerEmail ? { email: options.customerEmail } : undefined,
        customData: { organizationId: options.organizationId },
        settings: {
          displayMode: "overlay",
          successUrl: options.successUrl || `${window.location.origin}/app/settings?checkout=success`,
          allowLogout: false,
          variant: "one-page",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
