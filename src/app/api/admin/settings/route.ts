import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";
import type { PlatformSettings } from "@/lib/types";

export async function GET() {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const settings = await store.getSettings();
  return json({ settings });
}

export async function PATCH(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const patch = await req.json().catch(() => ({}));

  const allowed: (keyof PlatformSettings)[] = [
    // legacy core fields
    "monthly_signup_limit",
    "subscription_fee",
    "subscription_duration_days",
    "joining_fee",
    "gmail_task_rate",
    "tiktok_like_rate",
    "video_promotion_rate",
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
    // enterprise CMS fields
    "maintenance_mode",
    "registration_open",
    "max_tasks_per_user_per_day",
    "task_review_auto_approve",
    "gmail_default_password",
    "gmail_reward",
    "gmail_module_enabled",
    "gmail_submission_enabled",
    "gmail_screenshot_required",
    "gmail_auto_approve",
    "gmail_daily_limit_per_user",
    "binance_trc20_address",
    "logo_url",
    "favicon_url",
    "social_tiktok",
    "social_instagram",
    "social_youtube",
    "social_facebook",
    "announcement_active",
    "max_withdrawal_per_day",
    "theme_primary",
    "theme_accent",
    "support_whatsapp",
    "seo_title",
    "seo_description",
    "seo_keywords",
    "timezone",
    "language",
    "referral_type",
    "referral_fixed_amount",
    "referral_lifetime",
    "referral_max",
    "referral_min_withdrawal",
    "withdrawal_fee_percent",
    "withdrawal_fee_fixed",
    "password_min_length",
    "captcha_enabled",
    "rate_limit_per_minute",
    "seo_canonical",
    "seo_robots",
    "seo_og_image",
    "seo_twitter_card",
    "google_analytics_id",
    "google_verification",
    // Phase 6 CMS fields
    "custom_head_code",
    "custom_footer_code",
    "popup_enabled",
    "popup_message",
    "popup_title",
    "announcement_bar",
    "announcement_bar_enabled",
    "maintenance_message",
    "facebook_pixel",
    "microsoft_clarity",
    "social_telegram",
    "social_discord",
    "hero_title",
    "hero_subtitle",
    "hero_image",
    "meta_image",
    "og_title",
    "og_description",
    "twitter_title",
    "twitter_description",
    // Phase 6 Gmail extensions
    "gmail_weekly_limit_per_user",
    "gmail_monthly_limit_per_user",
    "gmail_min_age_days",
    "gmail_recovery_email_required",
    "gmail_recovery_phone_required",
    "gmail_country_restriction",
    "gmail_auto_reject",
    // Phase 6 Withdrawal extensions
    "withdrawal_max_amount",
    "withdrawal_weekly_limit",
    "withdrawal_monthly_limit",
    "withdrawal_auto_approve",
    "withdrawal_processing_hours",
    "withdrawal_maintenance",
    // Phase 6 Referral extensions
    "referral_banner",
    "referral_message",
    "referral_expiry_days",
    // Phase 6 Task extensions
    "task_screenshot_required",
    "task_min_account_age_days",
    "task_min_followers",
    "task_min_likes",
    "task_allow_resubmission",
    "task_auto_reject",
  ];

  const clean: Record<string, unknown> = {};
  for (const k of allowed) {
    if (patch[k] !== undefined) clean[k] = patch[k];
  }

  // numeric fields
  const NUMERIC: (keyof PlatformSettings)[] = [
    "monthly_signup_limit",
    "subscription_fee",
    "subscription_duration_days",
    "joining_fee",
    "gmail_task_rate",
    "tiktok_like_rate",
    "video_promotion_rate",
    "referral_bonus_percent",
    "minimum_payout",
    "max_tasks_per_user_per_day",
    "gmail_reward",
    "gmail_daily_limit_per_user",
    "max_withdrawal_per_day",
    "referral_fixed_amount",
    "referral_max",
    "referral_min_withdrawal",
    "withdrawal_fee_percent",
    "withdrawal_fee_fixed",
    "password_min_length",
    "rate_limit_per_minute",
    "gmail_weekly_limit_per_user",
    "gmail_monthly_limit_per_user",
    "gmail_min_age_days",
    "withdrawal_max_amount",
    "withdrawal_weekly_limit",
    "withdrawal_monthly_limit",
    "withdrawal_processing_hours",
    "referral_expiry_days",
    "task_min_account_age_days",
    "task_min_followers",
    "task_min_likes",
  ];
  for (const nk of NUMERIC) {
    if (clean[nk as string] !== undefined) {
      const v = Number(clean[nk as string]);
      if (!Number.isFinite(v) || v < 0)
        return error(`Invalid value for ${String(nk)}`, 422);
      clean[nk as string] = v;
    }
  }

  // boolean fields
  const BOOLEAN: (keyof PlatformSettings)[] = [
    "maintenance_mode",
    "registration_open",
    "task_review_auto_approve",
    "referral_lifetime",
    "captcha_enabled",
    "gmail_module_enabled",
    "gmail_submission_enabled",
    "gmail_screenshot_required",
    "gmail_auto_approve",
    "gmail_recovery_email_required",
    "gmail_recovery_phone_required",
    "gmail_auto_reject",
    "popup_enabled",
    "announcement_bar_enabled",
    "withdrawal_auto_approve",
    "withdrawal_maintenance",
    "task_screenshot_required",
    "task_allow_resubmission",
    "task_auto_reject",
  ];
  for (const bk of BOOLEAN) {
    if (clean[bk as string] !== undefined) {
      clean[bk as string] = Boolean(clean[bk as string]);
    }
  }

  // referral_type enum
  if (clean.referral_type !== undefined) {
    if (clean.referral_type !== "fixed" && clean.referral_type !== "percentage")
      return error("referral_type must be 'fixed' or 'percentage'", 422);
  }

  // announcement_active is nullable text
  if (clean.announcement_active !== undefined && clean.announcement_active !== null) {
    clean.announcement_active = String(clean.announcement_active);
  }

  try {
    const settings = await store.updateSettings(clean);
    await store.logAudit({
      admin_id: r.user.id,
      action: "update_settings",
      entity_type: "platform_settings",
      entity_id: "1",
      new_value: clean,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ settings });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Update failed", 400);
  }
}
