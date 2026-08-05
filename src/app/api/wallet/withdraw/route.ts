import { NextRequest } from "next/server";
import { store, requireUser, error, json } from "@/lib/api";
import type { PaymentMethod } from "@/lib/types";

const METHODS: PaymentMethod[] = ["easypaisa", "jazzcash", "binance"];

export async function POST(req: NextRequest) {
  const r = await requireUser();
  if (!r.ok) return r.res;

  const { amount, method, account } = await req.json().catch(() => ({}));
  const amt = Number(amount);
  if (!amt || amt <= 0) return error("Enter a valid amount", 422);
  if (!METHODS.includes(method)) return error("Invalid payment method", 422);
  if (!account || String(account).trim().length < 4)
    return error("Enter a valid account number / ID", 422);

  // Enforce the admin-configured minimum payout (server-side, can't be bypassed)
  const settings = await store.getSettings();
  const minPayout = Number(settings.minimum_payout) || 0;
  if (minPayout > 0 && amt < minPayout) {
    return error(
      `Minimum withdrawal is ${settings.currency_symbol || "Rs"} ${minPayout}.`,
      422
    );
  }

  const wallet = await store.getWallet(r.user.id);
  if (wallet.balance < amt)
    return error("Insufficient available balance", 422);

  try {
    const payment = await store.requestWithdrawal(
      r.user.id,
      amt,
      method,
      String(account).trim()
    );
    await store.pushNotification({
      user_id: r.user.id,
      title: "Withdrawal Requested",
      body: `Your ${amt} cashout to ${method} is pending admin approval.`,
      type: "payment",
    });
    return json({ payment });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Withdrawal failed", 400);
  }
}
