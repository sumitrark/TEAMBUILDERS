import { api } from "@/lib/api";

export interface Plan {
  code: string;
  name: string;
  price_cents: number | null;
  currency: string;
  interval: string | null;
  purchasable: boolean;
  features: string[];
}

export interface Subscription {
  plan: string;
  status: string | null;
}

export interface PaymentTransaction {
  id: string;
  plan_code: string;
  amount_cents: number | null;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function getPlans(): Promise<Plan[]> {
  const response = await api.get("/payments/plans");
  return response.data;
}

export async function getSubscription(): Promise<Subscription> {
  const response = await api.get("/payments/subscription");
  return response.data;
}

export async function getPaymentHistory(): Promise<PaymentTransaction[]> {
  const response = await api.get("/payments/history");
  return response.data;
}

export async function startCheckout(
  planCode: string
): Promise<{ checkout_url: string; session_id: string }> {
  const response = await api.post("/payments/checkout", {
    plan_code: planCode,
  });

  return response.data;
}
