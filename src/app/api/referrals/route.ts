import { store, requireUser, json } from "@/lib/api";

export async function GET() {
  const r = await requireUser();
  if (!r.ok) return r.res;
  const referrals = await store.getReferralsByReferrer(r.user.id);
  const settings = await store.getSettings();
  return json({
    referral_code: r.user.referral_code,
    bonus_percent: settings.referral_bonus_percent,
    referrals,
  });
}
