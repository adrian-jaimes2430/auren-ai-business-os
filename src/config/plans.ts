// Single source of truth for the AUREN AI plan catalog.
// Mirrors the products/prices created in Paddle (see paddle-catalog).
// Any UI that displays prices/features MUST import from here.

export type PlanId = "starter" | "pro" | "business" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  /** Monthly price in USD (display) */
  priceUSD: number;
  /** Paddle price external_id for the monthly price */
  priceId: string;
  /** Paddle product external_id */
  productId: string;
  description: string;
  features: string[];
  popular?: boolean;
  /** MRR in cents (kept in sync with webhook PRICE_TO_MRR) */
  mrrCents: number;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceUSD: 29,
    priceId: "starter_monthly",
    productId: "starter_plan",
    description: "Para emprendedores que arrancan.",
    features: ["1 usuario", "CRM básico", "1 canal", "IA limitada", "500 contactos"],
    mrrCents: 2900,
  },
  {
    id: "pro",
    name: "Pro",
    priceUSD: 79,
    priceId: "pro_monthly",
    productId: "pro_plan",
    description: "El favorito de PyMEs y agencias.",
    features: [
      "10 usuarios",
      "CRM completo",
      "Omnicanal ilimitado",
      "IA avanzada",
      "Automatizaciones",
      "10k contactos",
    ],
    popular: true,
    mrrCents: 7900,
  },
  {
    id: "business",
    name: "Business",
    priceUSD: 129,
    priceId: "business_monthly",
    productId: "business_plan",
    description: "Equipos en crecimiento con integraciones avanzadas.",
    features: [
      "Usuarios extendidos",
      "Todo de Pro",
      "Integraciones avanzadas",
      "Analítica avanzada",
      "Soporte prioritario",
    ],
    mrrCents: 12900,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceUSD: 199,
    priceId: "enterprise_monthly",
    productId: "enterprise_plan",
    description: "Para empresas que escalan.",
    features: [
      "Usuarios ilimitados",
      "Multi-empresa",
      "API & Webhooks",
      "IA personalizada",
      "Soporte dedicado",
      "SLA",
    ],
    mrrCents: 19900,
  },
];

export const PLAN_BY_ID: Record<PlanId, Plan> = Object.fromEntries(
  PLANS.map((p) => [p.id, p]),
) as Record<PlanId, Plan>;

export const PLAN_BY_PRICE_ID: Record<string, Plan> = Object.fromEntries(
  PLANS.map((p) => [p.priceId, p]),
);

export function planRank(id: PlanId): number {
  return PLANS.findIndex((p) => p.id === id);
}
