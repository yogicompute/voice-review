import crypto from "crypto";

const BASE_URL = "https://api.razorpay.com/v1";

function keyId() {
  const id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!id) throw new Error("NEXT_PUBLIC_RAZORPAY_KEY_ID is not set");
  return id;
}

function keySecret() {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET is not set");
  return secret;
}

function authHeader() {
  const token = Buffer.from(`${keyId()}:${keySecret()}`).toString("base64");
  return `Basic ${token}`;
}

async function rzp<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.description ?? `Razorpay request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export interface RazorpaySubscription {
  id: string;
  plan_id: string;
  status: string;
  customer_id?: string;
  current_start?: number | null;
  current_end?: number | null;
  short_url?: string;
}

/** Creates a recurring subscription for a given Razorpay plan. */
export async function createSubscription(params: {
  planId: string;
  totalCount?: number;
  notes?: Record<string, string>;
}): Promise<RazorpaySubscription> {
  return rzp<RazorpaySubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: params.planId,
      total_count: params.totalCount ?? 12, // monthly cycles
      customer_notify: 1,
      notes: params.notes ?? {},
    }),
  });
}

export async function cancelSubscription(
  subscriptionId: string,
  cancelAtCycleEnd = false,
): Promise<RazorpaySubscription> {
  return rzp<RazorpaySubscription>(`/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 }),
  });
}

export async function fetchSubscription(subscriptionId: string): Promise<RazorpaySubscription> {
  return rzp<RazorpaySubscription>(`/subscriptions/${subscriptionId}`);
}

/**
 * Verifies the signature returned by Razorpay Checkout after a successful
 * subscription payment: HMAC_SHA256(payment_id + "|" + subscription_id, secret).
 */
export function verifyCheckoutSignature(params: {
  razorpayPaymentId: string;
  razorpaySubscriptionId: string;
  razorpaySignature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", keySecret())
    .update(`${params.razorpayPaymentId}|${params.razorpaySubscriptionId}`)
    .digest("hex");
  return timingSafeEqual(expected, params.razorpaySignature);
}

/** Verifies an incoming webhook payload against the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not set");
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export const RAZORPAY_PUBLIC_KEY_ID =
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
