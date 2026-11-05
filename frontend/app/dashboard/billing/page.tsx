"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, CheckCircle2, Loader2 } from "lucide-react";

import {
  getPlans,
  getSubscription,
  getPaymentHistory,
  startCheckout,
  Plan,
  Subscription,
  PaymentTransaction,
} from "@/services/payments";

function formatPrice(cents: number | null, currency: string) {
  if (cents === null) {
    return "Contact us";
  }

  if (cents === 0) {
    return "Free";
  }

  return `$${(cents / 100).toFixed(2)}`;
}

function BillingPageContent() {
  const searchParams = useSearchParams();
  const redirectStatus = searchParams.get("status");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(
    null
  );
  const [history, setHistory] = useState<PaymentTransaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [checkingOutPlan, setCheckingOutPlan] = useState<string | null>(
    null
  );
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const [plansData, subscriptionData, historyData] =
          await Promise.all([
            getPlans(),
            getSubscription(),
            getPaymentHistory(),
          ]);

        setPlans(plansData);
        setSubscription(subscriptionData);
        setHistory(historyData);
      } catch (err) {
        console.error("Failed to load billing data:", err);
        setError("Failed to load billing information.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleUpgrade(planCode: string) {
    try {
      setCheckingOutPlan(planCode);
      setError("");

      const result = await startCheckout(planCode);

      window.location.href = result.checkout_url;
    } catch (err: any) {
      console.error("Failed to start checkout:", err);

      setError(
        err?.response?.data?.detail ||
          "Failed to start checkout. Please try again."
      );

      setCheckingOutPlan(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">

      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-violet-100 p-3">
          <CreditCard className="text-violet-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500">
            Manage your plan and view payment history
          </p>
        </div>
      </div>

      {redirectStatus === "success" && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          Checkout completed. Your plan will update once payment is
          confirmed - this can take a few seconds.
        </div>
      )}

      {redirectStatus === "cancelled" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
          Checkout was cancelled. No charge was made.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 p-8 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading billing information...
        </div>
      ) : (
        <>
          {/* CURRENT PLAN */}
          {subscription && (
            <div className="mb-8 rounded-2xl border border-violet-200 bg-violet-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-violet-500">
                Current Plan
              </p>
              <p className="mt-1 text-2xl font-bold capitalize text-violet-900">
                {subscription.plan}
              </p>
              {subscription.status && (
                <p className="mt-1 text-sm capitalize text-violet-600">
                  Status: {subscription.status}
                </p>
              )}
            </div>
          )}

          {/* PLANS */}
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrentPlan = subscription?.plan === plan.code;

              return (
                <div
                  key={plan.code}
                  className={`rounded-2xl border p-6 shadow-sm ${
                    isCurrentPlan
                      ? "border-violet-400 ring-2 ring-violet-200"
                      : "border-slate-200"
                  }`}
                >
                  <h3 className="text-lg font-bold text-slate-900">
                    {plan.name}
                  </h3>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {formatPrice(plan.price_cents, plan.currency)}
                    {plan.interval && (
                      <span className="text-sm font-medium text-slate-400">
                        /{plan.interval}
                      </span>
                    )}
                  </p>

                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    {isCurrentPlan ? (
                      <div className="rounded-lg bg-violet-100 px-4 py-2.5 text-center text-sm font-semibold text-violet-700">
                        Current Plan
                      </div>
                    ) : plan.purchasable ? (
                      <button
                        type="button"
                        onClick={() => handleUpgrade(plan.code)}
                        disabled={checkingOutPlan === plan.code}
                        className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {checkingOutPlan === plan.code
                          ? "Redirecting..."
                          : "Upgrade"}
                      </button>
                    ) : (
                      <div className="rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-400">
                        Contact sales
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAYMENT HISTORY */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Payment History
            </h2>

            {history.length === 0 ? (
              <p className="text-sm text-slate-400">
                No payments yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="pb-3 font-medium">Plan</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((txn) => (
                      <tr
                        key={txn.id}
                        className="border-b border-slate-50 last:border-b-0"
                      >
                        <td className="py-3 capitalize text-slate-700">
                          {txn.plan_code}
                        </td>
                        <td className="py-3 text-slate-700">
                          {formatPrice(txn.amount_cents, txn.currency)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                              txn.status === "succeeded"
                                ? "bg-emerald-100 text-emerald-700"
                                : txn.status === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : txn.status === "failed"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {txn.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">
                          {new Date(txn.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading billing information...
        </div>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}
