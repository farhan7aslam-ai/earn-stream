import { NextRequest } from "next/server";
import { store, requireActiveUser, error, json } from "@/lib/api";
import type { PaymentMethod } from "@/lib/types";

const METHODS: PaymentMethod[] = ["easypaisa", "jazzcash", "binance"];

export async function POST(req: NextRequest) {
  const r = await requireActiveUser();
  if (!r.ok) return r.res;

  const { amount, method, account } = await req.json().catch(() => ({}));
  const amt = Number(amount);
  if (!amt || amt <= 0) return error("Enter a valid amount", 422, "VALIDATION_ERROR");
  if (!METHODS.includes(method as PaymentMethod))
    return error("Invalid payment method. Only JazzCash, EasyPaisa, and Binance TRC20 are supported.", 422, "VALIDATION_ERROR");
  if (!account || String(account).trim().length < 4)
    return error("Enter a valid account number / ID", 422, "VALIDATION_ERROR");

  // Fetch settings for all configurable limits
  const settings = await store.getSettings();

  // Check withdrawal maintenance mode
  if (settings.withdrawal_maintenance)
    return error("Withdrawals are temporarily under maintenance. Please try again later.", 503, "WITHDRAWAL_MAINTENANCE");

  // Enforce minimum payout
  const minPayout = Number(settings.minimum_payout) || 0;
  if (minPayout > 0 && amt < minPayout)
    return error(`Minimum withdrawal is ${settings.currency_symbol || "Rs"} ${minPayout}.`, 422, "BELOW_MINIMUM");

  // Enforce maximum withdrawal
  const maxAmount = Number(settings.withdrawal_max_amount) || 0;
  if (maxAmount > 0 && amt > maxAmount)
    return error(`Maximum withdrawal is ${settings.currency_symbol || "Rs"} ${maxAmount}.`, 422, "ABOVE_MAXIMUM");

  // Check wallet balance
  const wallet = await store.getWallet(r.user.id);
  if (wallet.balance < amt)
    return error("Insufficient available balance", 422, "INSUFFICIENT_BALANCE");

  // Check daily withdrawal limit
  const maxDaily = Number(settings.max_withdrawal_per_day) || 0;
  if (maxDaily > 0) {
    const ledger = await store.getLedger(r.user.id);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayWithdrawals = ledger
      .filter((p) => p.type === "withdrawal" && new Date(p.created_at) >= todayStart)
      .reduce((sum, p) => sum + Math.abs(p.amount), 0);
    if (todayWithdrawals + amt > maxDaily)
      return error(
        `Daily withdrawal limit (${settings.currency_symbol || "Rs"} ${maxDaily}) exceeded. You have already requested ${settings.currency_symbol || "Rs"} ${todayWithdrawals.toFixed(2)} today.`,
        422,
        "DAILY_LIMIT_EXCEEDED"
      );
  }

  // Calculate fee
  const feePercent = Number(settings.withdrawal_fee_percent) || 0;
  const feeFixed = Number(settings.withdrawal_fee_fixed) || 0;
  const fee = round2((amt * feePercent) / 100 + feeFixed);
  const netAmount = round2(amt - fee);

  try {
    const payment = await store.requestWithdrawal(
      r.user.id,
      amt,
      method as PaymentMethod,
      String(account).trim()
    );

    // Auto-approve if enabled
    if (settings.withdrawal_auto_approve) {
      try {
        await store.approveWithdrawal(payment.id);
      } catch {
        /* non-fatal — admin can manually approve */
      }
    }

    await store.pushNotification({
      user_id: r.user.id,
      title: "Withdrawal Requested",
      body: `Your ${settings.currency_symbol || "Rs"} ${amt} cashout to ${method} is ${settings.withdrawal_auto_approve ? "approved" : "pending admin approval"}.${fee > 0 ? ` Fee: ${settings.currency_symbol || "Rs"} ${fee}. Net: ${settings.currency_symbol || "Rs"} ${netAmount}.` : ""}`,
      type: "payment",
    });

    return json({ payment, fee, netAmount });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Withdrawal failed", 400, "WITHDRAWAL_FAILED");
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
