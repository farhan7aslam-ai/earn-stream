import { NextRequest } from "next/server";
import { store, requireUser, error, json } from "@/lib/api";
import type { PaymentMethod } from "@/lib/types";

const METHODS: PaymentMethod[] = ["easypaisa", "jazzcash", "binance"];

export async function POST(req: NextRequest) {
  const r = await requireUser();
  if (!r.ok) return r.res;
  if (r.user.role === "admin") return json({ ok: true, admin: true });

  const { method, account } = await req.json().catch(() => ({}));
  if (!METHODS.includes(method)) return error("Invalid payment method", 422);
  if (!account || String(account).trim().length < 4)
    return error("Enter a valid account number / ID", 422);

  const settings = await store.getSettings();
  const fee = settings.subscription_fee;
  const days = settings.subscription_duration_days || 30;

  try {
    const { user, payment } = await store.paySubscription(
      r.user.id,
      method,
      String(account).trim(),
      fee,
      days
    );
    await store.pushNotification({
      user_id: r.user.id,
      title: "Subscription Activated",
      body: `Your subscription is active for ${days} days. Fee: ${fee}.`,
      type: "success",
    });
    return json({ ok: true, user, payment });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Payment failed", 400);
  }
}
