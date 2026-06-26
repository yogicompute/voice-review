"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { RAZORPAY_ENABLED, type PlanKey } from "@/lib/plans";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadCheckout(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function UpgradeButton({
  plan,
  label,
  currentPlan,
}: {
  plan: PlanKey;
  label: string;
  currentPlan: PlanKey;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCurrent = plan === currentPlan;
  const isDowngrade = plan === "free" && currentPlan !== "free";

  async function handleClick() {
    setError("");
    setLoading(true);

    try {
      // Feature flag off: grant the plan instantly without payment.
      if (!RAZORPAY_ENABLED) {
        const res = await fetch("/api/billing/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not update plan");
        router.refresh();
        return;
      }

      if (isDowngrade) {
        const res = await fetch("/api/billing/cancel", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not cancel");
        router.refresh();
        return;
      }

      // Create the subscription
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout");

      const ok = await loadCheckout();
      if (!ok || !window.Razorpay) throw new Error("Failed to load Razorpay checkout");

      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "VoiceReview",
        description: `${label} subscription`,
        theme: { color: "#059669" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          const verify = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, plan }),
          });
          if (verify.ok) {
            router.refresh();
          } else {
            const v = await verify.json();
            setError(v.error ?? "Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (isCurrent) {
    return (
      <Button className="w-full" variant="outline" disabled>
        Current plan
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        variant={plan === "free" ? "outline" : "default"}
        onClick={handleClick}
        disabled={loading}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {label}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
