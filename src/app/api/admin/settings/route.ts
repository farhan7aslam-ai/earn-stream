import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";

export async function GET() {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const settings = await store.getSettings();
  return json({ settings });
}

export async function PATCH(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const patch = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const allowed: string[] = [
    "monthly_signup_limit",
    "subscription_fee",
    "subscription_duration_days",
    "joining_fee",
    "gmail_task_rate",
    "tiktok_like_rate",
    "referral_bonus_percent",
    "minimum_payout",
    "easypaisa_number",
    "easypaisa_account_name",
    "jazzcash_number",
    "jazzcash_account_name",
    "binance_id",
    "site_name",
    "nav_logo_text",
    "support_email",
    "footer_notice",
    "currency_symbol",
  ];
  const clean: Record<string, unknown> = {};
  for (const k of allowed) {
    if (patch[k] !== undefined) clean[k] = patch[k];
  }
  if (clean.monthly_signup_limit !== undefined) {
    const v = Number(clean.monthly_signup_limit);
    if (!Number.isFinite(v) || v < 0)
      return error("Invalid monthly signup limit", 422);
    clean.monthly_signup_limit = v;
  }
  // coerce numeric fields
  for (const nk of [
    "subscription_fee",
    "subscription_duration_days",
    "joining_fee",
    "gmail_task_rate",
    "tiktok_like_rate",
    "referral_bonus_percent",
    "minimum_payout",
  ]) {
    if (clean[nk] !== undefined) {
      const v = Number(clean[nk]);
      if (!Number.isFinite(v) || v < 0)
        return error(`Invalid value for ${nk}`, 422);
      clean[nk] = v;
    }
  }
  try {
    const settings = await store.updateSettings(clean);
    return json({ settings });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Update failed", 400);
  }
}
