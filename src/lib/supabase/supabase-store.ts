import { createServerClient } from "./server";
import { generateId, generateReferralCode, generateToken, hashPassword, verifyPassword } from "../password";
import type { Store } from "../store";
import type {
  AdminStats,
  Announcement,
  AuditLog,
  BlockedIP,
  CmsContent,
  DashboardAnalytics,
  GmailCampaign,
  GmailSubmission,
  LoginSession,
  Notification,
  NotificationQueueEntry,
  NotificationType,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  PlatformSettings,
  Referral,
  Session,
  SystemHealth,
  TaskAttempt,
  TaskRow,
  TaskStatus,
  TaskSubmission,
  TaskType,
  TikTokTask,
  TikTokTaskStatus,
  TikTokTaskType,
  User,
  WalletLedgerEntry,
  WalletSummary,
} from "../types";
import { TASK_TYPE_TABLE } from "../types";

const DEFAULT_SETTINGS: Omit<PlatformSettings, "updated_at"> = {
  id: 1,
  monthly_signup_limit: 5,
  subscription_fee: 500,
  subscription_duration_days: 30,
  joining_fee: 100,
  gmail_task_rate: 5,
  tiktok_like_rate: 3,
  video_promotion_rate: 10,
  referral_bonus_percent: 10,
  minimum_payout: 50,
  easypaisa_number: "0300-1234567",
  easypaisa_account_name: "EarnStream Official",
  jazzcash_number: "0301-7654321",
  jazzcash_account_name: "EarnStream Official",
  binance_id: "",
  site_name: "EarnStream",
  nav_logo_text: "EarnStream",
  support_email: "support@earnstream.io",
  footer_notice: "© EarnStream. All rights reserved.",
  currency_symbol: "Rs",
  // Enterprise CMS fields
  maintenance_mode: false,
  registration_open: true,
  max_tasks_per_user_per_day: 10,
  task_review_auto_approve: false,
  gmail_default_password: "aass1122",
  gmail_reward: 5,
  gmail_module_enabled: true,
  gmail_submission_enabled: true,
  gmail_screenshot_required: false,
  gmail_auto_approve: false,
  gmail_daily_limit_per_user: 0,
  binance_trc20_address: "",
  logo_url: "",
  favicon_url: "",
  social_tiktok: "",
  social_instagram: "",
  social_youtube: "",
  social_facebook: "",
  announcement_active: null,
  max_withdrawal_per_day: 5000,
  theme_primary: "#8b5cf6",
  theme_accent: "#d946ef",
  support_whatsapp: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  timezone: "America/Los_Angeles",
  language: "en",
  referral_type: "percentage",
  referral_fixed_amount: 50,
  referral_lifetime: false,
  referral_max: 0,
  referral_min_withdrawal: 0,
  withdrawal_fee_percent: 0,
  withdrawal_fee_fixed: 0,
  password_min_length: 6,
  captcha_enabled: false,
  rate_limit_per_minute: 60,
  seo_canonical: "",
  seo_robots: "index, follow",
  seo_og_image: "",
  seo_twitter_card: "summary_large_image",
  google_analytics_id: "",
  google_verification: "",
  // Phase 6 CMS fields
  custom_head_code: "",
  custom_footer_code: "",
  popup_enabled: false,
  popup_message: "",
  popup_title: "",
  announcement_bar: "",
  announcement_bar_enabled: false,
  maintenance_message: "We are performing maintenance. Please check back soon.",
  facebook_pixel: "",
  microsoft_clarity: "",
  social_telegram: "",
  social_discord: "",
  hero_title: "Turn spare minutes into real earnings.",
  hero_subtitle: "Complete TikTok tasks and withdraw instantly to EasyPaisa, JazzCash, or Binance.",
  hero_image: "",
  meta_image: "",
  og_title: "",
  og_description: "",
  twitter_title: "",
  twitter_description: "",
  // Phase 6 Gmail extensions
  gmail_weekly_limit_per_user: 0,
  gmail_monthly_limit_per_user: 0,
  gmail_min_age_days: 0,
  gmail_recovery_email_required: false,
  gmail_recovery_phone_required: false,
  gmail_country_restriction: "",
  gmail_auto_reject: false,
  // Phase 6 Withdrawal extensions
  withdrawal_max_amount: 50000,
  withdrawal_weekly_limit: 0,
  withdrawal_monthly_limit: 0,
  withdrawal_auto_approve: false,
  withdrawal_processing_hours: 24,
  withdrawal_maintenance: false,
  // Phase 6 Referral extensions
  referral_banner: "",
  referral_message: "Join EarnStream and start earning today!",
  referral_expiry_days: 0,
  // Phase 6 Task extensions
  task_screenshot_required: true,
  task_min_account_age_days: 0,
  task_min_followers: 0,
  task_min_likes: 0,
  task_allow_resubmission: false,
  task_auto_reject: false,
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v: unknown): number =>
  v === null || v === undefined ? 0 : Number(v);
const str = (v: unknown, fallback = ""): string =>
  v === null || v === undefined ? fallback : String(v);
const nullableStr = (v: unknown): string | null =>
  v === null || v === undefined ? null : String(v);
/** Safely extracts a nested record (for Supabase join results like `tasks.title`). */
function nested(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function mapUser(r: Record<string, unknown>): User {
  const paid = Boolean(r.joining_fee_paid);
  const status = (r.joining_fee_status as User["joining_fee_status"]) ?? null;
  return {
    id: String(r.id),
    email: String(r.email ?? ""),
    password_hash: String(r.password_hash ?? ""),
    full_name: String(r.full_name ?? ""),
    phone: String(r.phone ?? ""),
    role: (r.role as User["role"]) ?? "user",
    balance: num(r.balance),
    pending_earnings: num(r.pending_earnings),
    total_withdrawn: num(r.total_withdrawn),
    total_earned: r.total_earned === null || r.total_earned === undefined ? 0 : num(r.total_earned),
    joining_fee_paid: paid,
    joining_fee_status: status ?? (paid ? "approved" : "none"),
    joining_fee_screenshot: r.joining_fee_screenshot
      ? String(r.joining_fee_screenshot)
      : null,
    joining_fee_submitted_at: r.joining_fee_submitted_at
      ? String(r.joining_fee_submitted_at)
      : null,
    is_banned: Boolean(r.is_banned),
    is_suspended: Boolean(r.is_suspended),
    subscription_end_date: r.subscription_end_date
      ? String(r.subscription_end_date)
      : null,
    referral_code: String(r.referral_code ?? ""),
    referred_by: r.referred_by ? String(r.referred_by) : null,
    custom_referral_bonus_percent:
      r.custom_referral_bonus_percent === null || r.custom_referral_bonus_percent === undefined
        ? null
        : num(r.custom_referral_bonus_percent),
    avatar_url: nullableStr(r.avatar_url),
    country: nullableStr(r.country),
    timezone: str(r.timezone, "America/Los_Angeles"),
    language: str(r.language, "en"),
    last_login_at: nullableStr(r.last_login_at),
    last_ip: nullableStr(r.last_ip),
    last_device: nullableStr(r.last_device),
    created_at: String(r.created_at ?? new Date().toISOString()),
  };
}

function mapSettings(r: Record<string, unknown>): PlatformSettings {
  const defs = DEFAULT_SETTINGS as Record<string, unknown>;
  const get = (k: string, fallback: unknown) =>
    r[k] === null || r[k] === undefined ? fallback : r[k];
  const getBool = (k: string, fallback: boolean) =>
    r[k] === null || r[k] === undefined ? fallback : Boolean(r[k]);
  return {
    id: num(r.id) || 1,
    monthly_signup_limit: num(get("monthly_signup_limit", defs.monthly_signup_limit)),
    subscription_fee: num(get("subscription_fee", defs.subscription_fee)),
    subscription_duration_days: num(get("subscription_duration_days", defs.subscription_duration_days)),
    joining_fee: num(get("joining_fee", defs.joining_fee)),
    gmail_task_rate: num(get("gmail_task_rate", defs.gmail_task_rate)),
    tiktok_like_rate: num(get("tiktok_like_rate", defs.tiktok_like_rate)),
    video_promotion_rate: num(get("video_promotion_rate", defs.video_promotion_rate)),
    referral_bonus_percent: num(get("referral_bonus_percent", defs.referral_bonus_percent)),
    minimum_payout: num(get("minimum_payout", defs.minimum_payout)),
    easypaisa_number: String(get("easypaisa_number", defs.easypaisa_number)),
    easypaisa_account_name: String(get("easypaisa_account_name", defs.easypaisa_account_name)),
    jazzcash_number: String(get("jazzcash_number", defs.jazzcash_number)),
    jazzcash_account_name: String(get("jazzcash_account_name", defs.jazzcash_account_name)),
    binance_id: String(get("binance_id", defs.binance_id)),
    site_name: String(get("site_name", defs.site_name)),
    nav_logo_text: String(get("nav_logo_text", defs.nav_logo_text)),
    support_email: String(get("support_email", defs.support_email)),
    footer_notice: String(get("footer_notice", defs.footer_notice)),
    currency_symbol: String(get("currency_symbol", defs.currency_symbol)),
    // Enterprise CMS fields
    maintenance_mode: Boolean(get("maintenance_mode", defs.maintenance_mode)),
    registration_open: Boolean(get("registration_open", defs.registration_open)),
    max_tasks_per_user_per_day: num(get("max_tasks_per_user_per_day", defs.max_tasks_per_user_per_day)),
    task_review_auto_approve: Boolean(get("task_review_auto_approve", defs.task_review_auto_approve)),
    gmail_default_password: String(get("gmail_default_password", defs.gmail_default_password)),
    gmail_reward: num(get("gmail_reward", defs.gmail_reward)),
    gmail_module_enabled: getBool("gmail_module_enabled", true),
    gmail_submission_enabled: getBool("gmail_submission_enabled", true),
    gmail_screenshot_required: getBool("gmail_screenshot_required", false),
    gmail_auto_approve: getBool("gmail_auto_approve", false),
    gmail_daily_limit_per_user: num(get("gmail_daily_limit_per_user", defs.gmail_daily_limit_per_user)),
    binance_trc20_address: String(get("binance_trc20_address", defs.binance_trc20_address)),
    logo_url: String(get("logo_url", defs.logo_url)),
    favicon_url: String(get("favicon_url", defs.favicon_url)),
    social_tiktok: String(get("social_tiktok", defs.social_tiktok)),
    social_instagram: String(get("social_instagram", defs.social_instagram)),
    social_youtube: String(get("social_youtube", defs.social_youtube)),
    social_facebook: String(get("social_facebook", defs.social_facebook)),
    announcement_active: nullableStr(get("announcement_active", defs.announcement_active)),
    max_withdrawal_per_day: num(get("max_withdrawal_per_day", defs.max_withdrawal_per_day)),
    theme_primary: String(get("theme_primary", defs.theme_primary)),
    theme_accent: String(get("theme_accent", defs.theme_accent)),
    support_whatsapp: String(get("support_whatsapp", defs.support_whatsapp)),
    seo_title: String(get("seo_title", defs.seo_title)),
    seo_description: String(get("seo_description", defs.seo_description)),
    seo_keywords: String(get("seo_keywords", defs.seo_keywords)),
    timezone: String(get("timezone", defs.timezone)),
    language: String(get("language", defs.language)),
    referral_type: (get("referral_type", defs.referral_type) === "fixed" ? "fixed" : "percentage") as PlatformSettings["referral_type"],
    referral_fixed_amount: num(get("referral_fixed_amount", defs.referral_fixed_amount)),
    referral_lifetime: Boolean(get("referral_lifetime", defs.referral_lifetime)),
    referral_max: num(get("referral_max", defs.referral_max)),
    referral_min_withdrawal: num(get("referral_min_withdrawal", defs.referral_min_withdrawal)),
    withdrawal_fee_percent: num(get("withdrawal_fee_percent", defs.withdrawal_fee_percent)),
    withdrawal_fee_fixed: num(get("withdrawal_fee_fixed", defs.withdrawal_fee_fixed)),
    password_min_length: num(get("password_min_length", defs.password_min_length)),
    captcha_enabled: Boolean(get("captcha_enabled", defs.captcha_enabled)),
    rate_limit_per_minute: num(get("rate_limit_per_minute", defs.rate_limit_per_minute)),
    seo_canonical: String(get("seo_canonical", defs.seo_canonical)),
    seo_robots: String(get("seo_robots", defs.seo_robots)),
    seo_og_image: String(get("seo_og_image", defs.seo_og_image)),
    seo_twitter_card: String(get("seo_twitter_card", defs.seo_twitter_card)),
    google_analytics_id: String(get("google_analytics_id", defs.google_analytics_id)),
    google_verification: String(get("google_verification", defs.google_verification)),
    // Phase 6 CMS fields
    custom_head_code: String(get("custom_head_code", defs.custom_head_code)),
    custom_footer_code: String(get("custom_footer_code", defs.custom_footer_code)),
    popup_enabled: getBool("popup_enabled", false),
    popup_message: String(get("popup_message", defs.popup_message)),
    popup_title: String(get("popup_title", defs.popup_title)),
    announcement_bar: String(get("announcement_bar", defs.announcement_bar)),
    announcement_bar_enabled: getBool("announcement_bar_enabled", false),
    maintenance_message: String(get("maintenance_message", defs.maintenance_message)),
    facebook_pixel: String(get("facebook_pixel", defs.facebook_pixel)),
    microsoft_clarity: String(get("microsoft_clarity", defs.microsoft_clarity)),
    social_telegram: String(get("social_telegram", defs.social_telegram)),
    social_discord: String(get("social_discord", defs.social_discord)),
    hero_title: String(get("hero_title", defs.hero_title)),
    hero_subtitle: String(get("hero_subtitle", defs.hero_subtitle)),
    hero_image: String(get("hero_image", defs.hero_image)),
    meta_image: String(get("meta_image", defs.meta_image)),
    og_title: String(get("og_title", defs.og_title)),
    og_description: String(get("og_description", defs.og_description)),
    twitter_title: String(get("twitter_title", defs.twitter_title)),
    twitter_description: String(get("twitter_description", defs.twitter_description)),
    // Phase 6 Gmail extensions
    gmail_weekly_limit_per_user: num(get("gmail_weekly_limit_per_user", defs.gmail_weekly_limit_per_user)),
    gmail_monthly_limit_per_user: num(get("gmail_monthly_limit_per_user", defs.gmail_monthly_limit_per_user)),
    gmail_min_age_days: num(get("gmail_min_age_days", defs.gmail_min_age_days)),
    gmail_recovery_email_required: getBool("gmail_recovery_email_required", false),
    gmail_recovery_phone_required: getBool("gmail_recovery_phone_required", false),
    gmail_country_restriction: String(get("gmail_country_restriction", defs.gmail_country_restriction)),
    gmail_auto_reject: getBool("gmail_auto_reject", false),
    // Phase 6 Withdrawal extensions
    withdrawal_max_amount: num(get("withdrawal_max_amount", defs.withdrawal_max_amount)),
    withdrawal_weekly_limit: num(get("withdrawal_weekly_limit", defs.withdrawal_weekly_limit)),
    withdrawal_monthly_limit: num(get("withdrawal_monthly_limit", defs.withdrawal_monthly_limit)),
    withdrawal_auto_approve: getBool("withdrawal_auto_approve", false),
    withdrawal_processing_hours: num(get("withdrawal_processing_hours", defs.withdrawal_processing_hours)),
    withdrawal_maintenance: getBool("withdrawal_maintenance", false),
    // Phase 6 Referral extensions
    referral_banner: String(get("referral_banner", defs.referral_banner)),
    referral_message: String(get("referral_message", defs.referral_message)),
    referral_expiry_days: num(get("referral_expiry_days", defs.referral_expiry_days)),
    // Phase 6 Task extensions
    task_screenshot_required: getBool("task_screenshot_required", true),
    task_min_account_age_days: num(get("task_min_account_age_days", defs.task_min_account_age_days)),
    task_min_followers: num(get("task_min_followers", defs.task_min_followers)),
    task_min_likes: num(get("task_min_likes", defs.task_min_likes)),
    task_allow_resubmission: getBool("task_allow_resubmission", false),
    task_auto_reject: getBool("task_auto_reject", false),
    updated_at: String(r.updated_at ?? new Date().toISOString()),
  };
}

function mapPayment(r: Record<string, unknown>): Payment {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    type: r.type as PaymentType,
    amount: num(r.amount),
    method: (r.method as PaymentMethod) ?? "admin",
    account: String(r.account ?? ""),
    status: (r.status as PaymentStatus) ?? "pending",
    note: r.note ? String(r.note) : null,
    balance_after: r.balance_after === null || r.balance_after === undefined ? null : num(r.balance_after),
    created_at: String(r.created_at ?? new Date().toISOString()),
    processed_at: r.processed_at ? String(r.processed_at) : null,
  };
}

function mapTask(r: Record<string, unknown>, type: TaskType): TaskRow {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    type,
    task_url: String(r.task_url ?? ""),
    screenshot_url: String(r.screenshot_url ?? ""),
    status: (r.status as TaskStatus) ?? "pending",
    reward: num(r.reward),
    note: r.note ? String(r.note) : null,
    created_at: String(r.created_at ?? new Date().toISOString()),
    reviewed_at: r.reviewed_at ? String(r.reviewed_at) : null,
  };
}

// ─── Enterprise mappers ──────────────────────────────────────────────
function mapTaskCMS(r: Record<string, unknown>): TikTokTask {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    description: String(r.description ?? ""),
    platform: "tiktok",
    tiktok_username: String(r.tiktok_username ?? ""),
    tiktok_video_url: String(r.tiktok_video_url ?? ""),
    tiktok_video_id: nullableStr(r.tiktok_video_id) ?? "",
    task_type: (r.task_type as TikTokTaskType) ?? "LIKE",
    reward_per_user: num(r.reward_per_user),
    max_participants: num(r.max_participants),
    total_budget: num(r.total_budget),
    completed_count: num(r.completed_count),
    remaining_slots: num(r.remaining_slots),
    expiry_date: nullableStr(r.expiry_date),
    priority: num(r.priority),
    instructions: String(r.instructions ?? ""),
    comment_text: nullableStr(r.comment_text),
    status: (r.status as TikTokTaskStatus) ?? "active",
    featured: Boolean(r.featured),
    pinned: Boolean(r.pinned),
    visibility: (r.visibility as "public" | "private") ?? "public",
    auto_close: Boolean(r.auto_close),
    remarks: nullableStr(r.remarks),
    created_by: nullableStr(r.created_by),
    updated_by: nullableStr(r.updated_by),
    created_at: String(r.created_at ?? new Date().toISOString()),
    updated_at: String(r.updated_at ?? new Date().toISOString()),
    deleted_at: nullableStr(r.deleted_at),
  };
}

function mapTaskSubmission(r: Record<string, unknown>): TaskSubmission {
  return {
    id: String(r.id),
    task_id: String(r.task_id),
    user_id: String(r.user_id),
    screenshot_url: String(r.screenshot_url ?? ""),
    status: (r.status as TaskSubmission["status"]) ?? "pending",
    reward: num(r.reward),
    reject_reason: nullableStr(r.reject_reason),
    approval_notes: nullableStr(r.approval_notes),
    reviewed_by: nullableStr(r.reviewed_by),
    reviewed_at: nullableStr(r.reviewed_at),
    device: nullableStr(r.device),
    browser: nullableStr(r.browser),
    ip_address: nullableStr(r.ip_address),
    created_at: String(r.created_at ?? new Date().toISOString()),
    updated_at: String(r.updated_at ?? new Date().toISOString()),
    task_title: nullableStr(nested(r.tasks)?.title) ?? undefined,
    task_type: (nested(r.tasks)?.task_type as TikTokTaskType | undefined) ?? undefined,
    user_email: nullableStr(nested(r.users)?.email) ?? undefined,
    user_name: nullableStr(nested(r.users)?.full_name) ?? undefined,
  };
}

function mapGmail(r: Record<string, unknown>): GmailSubmission {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    campaign_id: nullableStr(r.campaign_id),
    gmail_address: String(r.gmail_address ?? ""),
    gmail_password: String(r.gmail_password ?? ""),
    recovery_email: nullableStr(r.recovery_email),
    recovery_phone: nullableStr(r.recovery_phone),
    country: nullableStr(r.country),
    creation_date: nullableStr(r.creation_date),
    status: (r.status as GmailSubmission["status"]) ?? "pending",
    reward: num(r.reward),
    reject_reason: nullableStr(r.reject_reason),
    admin_notes: nullableStr(r.admin_notes),
    screenshot_url: nullableStr(r.screenshot_url),
    reviewed_by: nullableStr(r.reviewed_by),
    reviewed_at: nullableStr(r.reviewed_at),
    created_at: String(r.created_at ?? new Date().toISOString()),
    updated_at: String(r.updated_at ?? new Date().toISOString()),
    deleted_at: nullableStr(r.deleted_at),
    user_email: nullableStr(nested(r.users)?.email) ?? undefined,
    user_name: nullableStr(nested(r.users)?.full_name) ?? undefined,
  };
}

function mapCampaign(r: Record<string, unknown>): GmailCampaign {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    description: String(r.description ?? ""),
    reward: num(r.reward),
    daily_limit: num(r.daily_limit),
    start_date: nullableStr(r.start_date),
    end_date: nullableStr(r.end_date),
    status: (r.status as GmailCampaign["status"]) ?? "active",
    rules: String(r.rules ?? ""),
    created_by: nullableStr(r.created_by),
    created_at: String(r.created_at ?? new Date().toISOString()),
    updated_at: String(r.updated_at ?? new Date().toISOString()),
    deleted_at: nullableStr(r.deleted_at),
  };
}

function mapAudit(r: Record<string, unknown>): AuditLog {
  return {
    id: String(r.id),
    admin_id: String(r.admin_id),
    action: String(r.action ?? ""),
    entity_type: String(r.entity_type ?? ""),
    entity_id: nullableStr(r.entity_id),
    old_value: r.old_value,
    new_value: r.new_value,
    ip_address: nullableStr(r.ip_address),
    user_agent: nullableStr(r.user_agent),
    created_at: String(r.created_at ?? new Date().toISOString()),
    admin_email: nullableStr(nested(r.users)?.email) ?? undefined,
  };
}

function mapAnnouncement(r: Record<string, unknown>): Announcement {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    body: String(r.body ?? ""),
    type: (r.type as Announcement["type"]) ?? "info",
    is_active: Boolean(r.is_active),
    image_url: nullableStr(r.image_url),
    priority: num(r.priority),
    publish_date: nullableStr(r.publish_date),
    expiry_date: nullableStr(r.expiry_date),
    visible_to: (r.visible_to as Announcement["visible_to"]) ?? "all",
    created_by: nullableStr(r.created_by),
    created_at: String(r.created_at ?? new Date().toISOString()),
    updated_at: String(r.updated_at ?? new Date().toISOString()),
    deleted_at: nullableStr(r.deleted_at),
  };
}

function mapLedger(r: Record<string, unknown>): WalletLedgerEntry {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    credit: num(r.credit),
    debit: num(r.debit),
    opening_balance: num(r.opening_balance),
    closing_balance: num(r.closing_balance),
    reference_type: String(r.reference_type ?? ""),
    reference_id: nullableStr(r.reference_id),
    description: String(r.description ?? ""),
    admin_id: nullableStr(r.admin_id),
    created_at: String(r.created_at ?? new Date().toISOString()),
  };
}

function mapLoginSession(r: Record<string, unknown>): LoginSession {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    token: String(r.token ?? ""),
    ip_address: nullableStr(r.ip_address),
    device: nullableStr(r.device),
    browser: nullableStr(r.browser),
    user_agent: nullableStr(r.user_agent),
    is_active: Boolean(r.is_active),
    created_at: String(r.created_at ?? new Date().toISOString()),
    expires_at: nullableStr(r.expires_at),
    revoked_at: nullableStr(r.revoked_at),
    user_email: nullableStr(nested(r.users)?.email) ?? undefined,
  };
}

function mapBlockedIP(r: Record<string, unknown>): BlockedIP {
  return {
    id: String(r.id),
    ip_address: String(r.ip_address ?? ""),
    reason: String(r.reason ?? ""),
    blocked_by: nullableStr(r.blocked_by),
    created_at: String(r.created_at ?? new Date().toISOString()),
    blocked_by_email: nullableStr(nested(r.users)?.email) ?? undefined,
  };
}

function mapNotificationQueue(r: Record<string, unknown>): NotificationQueueEntry {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    body: String(r.body ?? ""),
    type: (r.type as NotificationType) ?? "info",
    target_type: (r.target_type as NotificationQueueEntry["target_type"]) ?? "all",
    target_data: r.target_data,
    user_id: nullableStr(r.user_id),
    sent_by: nullableStr(r.sent_by),
    status: (r.status as NotificationQueueEntry["status"]) ?? "queued",
    scheduled_at: nullableStr(r.scheduled_at),
    sent_at: nullableStr(r.sent_at),
    created_at: String(r.created_at ?? new Date().toISOString()),
    sent_by_email: nullableStr(nested(r.users)?.email) ?? undefined,
  };
}

function mapCms(r: Record<string, unknown>): CmsContent {
  return {
    id: String(r.id),
    key: String(r.key ?? ""),
    title: String(r.title ?? ""),
    body: String(r.body ?? ""),
    type: (r.type as CmsContent["type"]) ?? "page",
    is_published: Boolean(r.is_published),
    updated_by: nullableStr(r.updated_by),
    created_at: String(r.created_at ?? new Date().toISOString()),
    updated_at: String(r.updated_at ?? new Date().toISOString()),
  };
}

function dayKey(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function emptyDailySeries(days: number): { date: string; value: number }[] {
  const out: { date: string; value: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push({ date: dayKey(d), value: 0 });
  }
  return out;
}

function bumpSeries(
  series: { date: string; value: number }[],
  date: string,
  delta: number
) {
  const key = dayKey(date);
  const row = series.find((s) => s.date === key);
  if (row) row.value = round2(row.value + delta);
}

export const supabaseStore: Store = {
  kind: "supabase",

  async getSettings() {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("platform_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    if (data) return mapSettings(data);
    // bootstrap default row
    const insert = { ...DEFAULT_SETTINGS, updated_at: new Date().toISOString() };
    const { data: created, error: insErr } = await sb
      .from("platform_settings")
      .upsert(insert)
      .select()
      .single();
    if (insErr) throw insErr;
    return mapSettings(created as Record<string, unknown>);
  },
  async updateSettings(patch) {
    const sb = createServerClient();
    const payload = {
      ...patch,
      id: 1,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await sb
      .from("platform_settings")
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return mapSettings(data as Record<string, unknown>);
  },

  async getUserByEmail(email) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("users")
      .select("*")
      .ilike("email", email)
      .maybeSingle();
    if (error) throw error;
    return data ? mapUser(data as Record<string, unknown>) : null;
  },
  async getUserById(id) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapUser(data as Record<string, unknown>) : null;
  },
  async getUserByReferralCode(code) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("users")
      .select("*")
      .ilike("referral_code", code)
      .maybeSingle();
    if (error) throw error;
    return data ? mapUser(data as Record<string, unknown>) : null;
  },
  async createUser(input) {
    const sb = createServerClient();
    const row = {
      email: input.email,
      password_hash: input.password_hash,
      full_name: input.full_name,
      phone: input.phone,
      role: input.role,
      balance: 0,
      pending_earnings: 0,
      total_withdrawn: 0,
      total_earned: 0,
      joining_fee_paid: false,
      joining_fee_status: "none",
      joining_fee_screenshot: null,
      joining_fee_submitted_at: null,
      is_banned: false,
      is_suspended: false,
      subscription_end_date: null,
      referral_code: input.referral_code,
      referred_by: input.referred_by,
      custom_referral_bonus_percent: null,
      avatar_url: null,
      country: null,
      timezone: "America/Los_Angeles",
      language: "en",
      last_login_at: null,
      last_ip: null,
      last_device: null,
    };
    const { data, error } = await sb
      .from("users")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapUser(data as Record<string, unknown>);
  },
  async countSignupsThisMonth() {
    const sb = createServerClient();
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const { count, error } = await sb
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", start.toISOString());
    if (error) throw error;
    return count ?? 0;
  },
  async countAllUsers() {
    const sb = createServerClient();
    const { count, error } = await sb
      .from("users")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  },

  async createSession(user_id) {
    const sb = createServerClient();
    const session = {
      id: generateId(),
      user_id,
      token: generateToken(),
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
    };
    const { data, error } = await sb
      .from("sessions")
      .insert(session)
      .select()
      .single();
    if (error) throw error;
    return {
      id: String(data.id),
      user_id: String(data.user_id),
      token: String(data.token),
      expires_at: String(data.expires_at),
      created_at: String(data.created_at),
    } satisfies Session;
  },
  async getSession(token) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("sessions")
      .select("*")
      .eq("token", token)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const s = {
      id: String(data.id),
      user_id: String(data.user_id),
      token: String(data.token),
      expires_at: String(data.expires_at),
      created_at: String(data.created_at),
    } satisfies Session;
    if (new Date(s.expires_at) < new Date()) return null;
    return s;
  },
  async deleteSession(token) {
    const sb = createServerClient();
    await sb.from("sessions").delete().eq("token", token);
  },

  async getWallet(user_id) {
    const u = await this.getUserById(user_id);
    if (!u) return { balance: 0, pending_earnings: 0, total_withdrawn: 0 };
    return {
      balance: u.balance,
      pending_earnings: u.pending_earnings,
      total_withdrawn: u.total_withdrawn,
    } satisfies WalletSummary;
  },
  async getLedger(user_id) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("payments")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d) => mapPayment(d as Record<string, unknown>));
  },
  async requestWithdrawal(user_id, amount, method, account) {
    const sb = createServerClient();
    const u = await this.getUserById(user_id);
    if (!u) throw new Error("User not found");
    if (amount <= 0) throw new Error("Invalid amount");
    if (u.balance < amount) throw new Error("Insufficient balance");
    const newBalance = round2(u.balance - amount);
    const { error: updErr } = await sb
      .from("users")
      .update({ balance: newBalance })
      .eq("id", user_id);
    if (updErr) throw updErr;
    const payment = {
      id: generateId(),
      user_id,
      type: "withdrawal",
      amount: -amount,
      method,
      account,
      status: "pending",
      note: "Withdrawal request",
      balance_after: newBalance,
      created_at: new Date().toISOString(),
      processed_at: null,
    };
    const { data, error } = await sb
      .from("payments")
      .insert(payment)
      .select()
      .single();
    if (error) throw error;
    return mapPayment(data as Record<string, unknown>);
  },

  async submitTask(user_id, type, task_url, screenshot_url) {
    const sb = createServerClient();
    const settings = await this.getSettings();
    const reward =
      type === "gmail"
        ? settings.gmail_task_rate
        : settings.tiktok_like_rate;
    const row = {
      id: generateId(),
      user_id,
      task_url,
      screenshot_url,
      status: "pending",
      reward,
      note: null,
      created_at: new Date().toISOString(),
      reviewed_at: null,
    };
    const { data, error } = await sb
      .from(TASK_TYPE_TABLE[type])
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapTask(data as Record<string, unknown>, type);
  },
  async listTasks(filter) {
    const sb = createServerClient();
    const types: TaskType[] = filter?.type ? [filter.type] : ["gmail", "tiktok"];
    const results: TaskRow[] = [];
    for (const type of types) {
      let q = sb.from(TASK_TYPE_TABLE[type]).select("*");
      if (filter?.status) q = q.eq("status", filter.status);
      if (filter?.user_id) q = q.eq("user_id", filter.user_id);
      q = q.order("created_at", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      for (const d of data ?? []) results.push(mapTask(d as Record<string, unknown>, type));
    }
    return results.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  async getTask(id) {
    const sb = createServerClient();
    for (const type of ["gmail", "tiktok"] as TaskType[]) {
      const { data, error } = await sb
        .from(TASK_TYPE_TABLE[type])
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) continue;
      if (data) return mapTask(data as Record<string, unknown>, type);
    }
    return null;
  },
  async approveTask(id) {
    const sb = createServerClient();
    const task = await this.getTask(id);
    if (!task) throw new Error("Task not found");
    if (task.status === "approved") return task;
    const table = TASK_TYPE_TABLE[task.type];
    const { error: updErr } = await sb
      .from(table)
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updErr) throw updErr;
    const u = await this.getUserById(task.user_id);
    if (u) {
      const newBalance = round2(u.balance + task.reward);
      await sb.from("users").update({ balance: newBalance }).eq("id", u.id);
      await sb.from("payments").insert({
        id: generateId(),
        user_id: u.id,
        type: "task_reward",
        amount: task.reward,
        method: "admin",
        account: "",
        status: "approved",
        note: `${task.type} task reward`,
        balance_after: newBalance,
        created_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
      });
      if (u.referred_by) {
        const ref = await this.getUserById(u.referred_by);
        if (ref) {
          const settings = await this.getSettings();
          const bonus = round2(task.reward * (settings.referral_bonus_percent / 100));
          const refBal = round2(ref.balance + bonus);
          await sb.from("users").update({ balance: refBal }).eq("id", ref.id);
          await sb.from("payments").insert({
            id: generateId(),
            user_id: ref.id,
            type: "referral_bonus",
            amount: bonus,
            method: "admin",
            account: "",
            status: "approved",
            note: `10% referral bonus for ${u.email}`,
            balance_after: refBal,
            created_at: new Date().toISOString(),
            processed_at: new Date().toISOString(),
          });
          await sb
            .from("referrals")
            .update({ bonus_amount: bonus, status: "credited" })
            .eq("referred_id", u.id);
        }
      }
    }
    return { ...task, status: "approved", reviewed_at: new Date().toISOString() };
  },
  async rejectTask(id, note) {
    const sb = createServerClient();
    const task = await this.getTask(id);
    if (!task) throw new Error("Task not found");
    const table = TASK_TYPE_TABLE[task.type];
    const { error } = await sb
      .from(table)
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        note: note ?? "Rejected by admin",
      })
      .eq("id", id);
    if (error) throw error;
    await sb.from("notifications").insert({
      id: generateId(),
      user_id: task.user_id,
      title: "Task Rejected",
      body: `Your ${task.type} submission was rejected. ${note ?? "Rejected by admin"}`,
      type: "task",
      is_read: false,
      created_at: new Date().toISOString(),
    });
    return {
      ...task,
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      note: note ?? "Rejected by admin",
    };
  },

  async startTaskAttempt(user_id, task_type, task_url) {
    const sb = createServerClient();
    const row = {
      id: generateId(),
      user_id,
      task_type,
      task_url,
      started_at: new Date().toISOString(),
    };
    const { data, error } = await sb
      .from("task_attempts")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return {
      id: String(data.id),
      user_id: String(data.user_id),
      task_type: data.task_type as TaskType,
      task_url: String(data.task_url ?? ""),
      started_at: String(data.started_at),
      completed_at: data.completed_at ? String(data.completed_at) : null,
      duration_ms: data.duration_ms ? Number(data.duration_ms) : null,
    } satisfies TaskAttempt;
  },
  async completeTaskAttempt(attempt_id, duration_ms) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("task_attempts")
      .update({
        completed_at: new Date().toISOString(),
        duration_ms,
      })
      .eq("id", attempt_id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: String(data.id),
      user_id: String(data.user_id),
      task_type: data.task_type as TaskType,
      task_url: String(data.task_url ?? ""),
      started_at: String(data.started_at),
      completed_at: String(data.completed_at),
      duration_ms: Number(data.duration_ms),
    } satisfies TaskAttempt;
  },

  async listNotifications(user_id) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("notifications")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d) => ({
      id: String(d.id),
      user_id: String(d.user_id),
      title: String(d.title ?? ""),
      body: String(d.body ?? ""),
      type: (d.type as NotificationType) ?? "info",
      link: d.link ? String(d.link) : null,
      is_read: Boolean(d.is_read),
      created_at: String(d.created_at ?? new Date().toISOString()),
    } satisfies Notification));
  },
  async markNotificationRead(id) {
    const sb = createServerClient();
    await sb.from("notifications").update({ is_read: true }).eq("id", id);
  },
  async markAllNotificationsRead(user_id) {
    const sb = createServerClient();
    await sb
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user_id)
      .eq("is_read", false);
  },
  async pushNotification(input) {
    const sb = createServerClient();
    const row = {
      id: generateId(),
      user_id: input.user_id,
      title: input.title,
      body: input.body,
      type: input.type,
      link: input.link ?? null,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await sb
      .from("notifications")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return {
      id: String(data.id),
      user_id: String(data.user_id),
      title: String(data.title ?? ""),
      body: String(data.body ?? ""),
      type: (data.type as NotificationType) ?? "info",
      link: data.link ? String(data.link) : null,
      is_read: Boolean(data.is_read),
      created_at: String(data.created_at),
    } satisfies Notification;
  },

  async getUserActivity(user_id) {
    const [tasks, payments, referrals] = await Promise.all([
      this.listTasks({ user_id }),
      this.listPayments({ user_id }),
      this.getReferralsByReferrer(user_id),
    ]);
    const referredByMe = referrals;
    return { tasks, payments, referrals: referredByMe };
  },

  async getReferralsByReferrer(referrer_id) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("referrals")
      .select("*")
      .eq("referrer_id", referrer_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d) => ({
      id: String(d.id),
      referrer_id: String(d.referrer_id),
      referred_id: String(d.referred_id),
      bonus_amount: num(d.bonus_amount),
      status: (d.status as Referral["status"]) ?? "pending",
      created_at: String(d.created_at ?? new Date().toISOString()),
    } satisfies Referral));
  },
  async createReferral(referrer_id, referred_id) {
    const sb = createServerClient();
    const row = {
      id: generateId(),
      referrer_id,
      referred_id,
      bonus_amount: 0,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    const { data, error } = await sb
      .from("referrals")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return {
      id: String(data.id),
      referrer_id: String(data.referrer_id),
      referred_id: String(data.referred_id),
      bonus_amount: num(data.bonus_amount),
      status: (data.status as Referral["status"]) ?? "pending",
      created_at: String(data.created_at),
    } satisfies Referral;
  },

  async paySubscription(user_id, method, account, fee, durationDays) {
    const sb = createServerClient();
    const u = await this.getUserById(user_id);
    if (!u) throw new Error("User not found");
    const base = u.subscription_end_date
      ? Math.max(Date.now(), new Date(u.subscription_end_date).getTime())
      : Date.now();
    const end = new Date(base + durationDays * 86400000).toISOString();
    const { error } = await sb
      .from("users")
      .update({ subscription_end_date: end, is_suspended: false })
      .eq("id", user_id);
    if (error) throw error;
    const payment = {
      id: generateId(),
      user_id,
      type: "subscription",
      amount: -fee,
      method,
      account,
      status: "approved",
      note: `Subscription extended by ${durationDays} days`,
      balance_after: u.balance,
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
    };
    const { data, error: pErr } = await sb
      .from("payments")
      .insert(payment)
      .select()
      .single();
    if (pErr) throw pErr;
    const updated = await this.getUserById(user_id);
    return { user: updated!, payment: mapPayment(data as Record<string, unknown>) };
  },
  async requestJoiningFee(user_id, method, account, screenshot_url, fee) {
    const sb = createServerClient();
    const u = await this.getUserById(user_id);
    if (!u) throw new Error("User not found");
    // SECURITY: set pending state — do NOT flip joining_fee_paid here.
    const { error } = await sb
      .from("users")
      .update({
        joining_fee_paid: false,
        joining_fee_status: "pending_approval",
        joining_fee_screenshot: screenshot_url,
        joining_fee_submitted_at: new Date().toISOString(),
      })
      .eq("id", user_id);
    if (error) throw error;
    const payment = {
      id: generateId(),
      user_id,
      type: "joining_fee",
      amount: -fee,
      method,
      account,
      status: "pending",
      note: "Joining fee — pending admin approval",
      balance_after: u.balance,
      created_at: new Date().toISOString(),
      processed_at: null,
    };
    const { data, error: pErr } = await sb
      .from("payments")
      .insert(payment)
      .select()
      .single();
    if (pErr) throw pErr;
    const updated = await this.getUserById(user_id);
    return { user: updated!, payment: mapPayment(data as Record<string, unknown>) };
  },

  async listUsers(search) {
    const sb = createServerClient();
    let q = sb.from("users").select("*").order("created_at", { ascending: false });
    if (search && search.trim()) {
      q = q.or(
        `email.ilike.%${search.trim()}%,full_name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%,referral_code.ilike.%${search.trim()}%`
      );
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((d) => mapUser(d as Record<string, unknown>));
  },
  async updateUser(id, patch) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("users")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapUser(data as Record<string, unknown>);
  },

  async updateAdminCredentials(admin_id, input) {
    const admin = await this.getUserById(admin_id);
    if (!admin || admin.role !== "admin")
      throw new Error("Admin account not found");
    let valid = verifyPassword(input.currentPassword, admin.password_hash);
    if (!valid && admin.password_hash.startsWith("seed:")) {
      if (input.currentPassword === admin.password_hash.slice(5)) valid = true;
    }
    if (!valid) throw new Error("Current password is incorrect");

    const sb = createServerClient();
    const patch: Record<string, unknown> = {};
    if (input.email) {
      const email = input.email.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
        throw new Error("Please enter a valid email address");
      const { data: dup } = await sb
        .from("users")
        .select("id")
        .ilike("email", email)
        .neq("id", admin_id)
        .maybeSingle();
      if (dup) throw new Error("That email is already in use");
      patch.email = email;
    }
    if (input.newPassword) {
      if (input.newPassword.length < 6)
        throw new Error("New password must be at least 6 characters");
      patch.password_hash = hashPassword(input.newPassword);
    }
    if (Object.keys(patch).length === 0)
      throw new Error("No changes to apply");
    const { data, error } = await sb
      .from("users")
      .update(patch)
      .eq("id", admin_id)
      .select()
      .single();
    if (error) throw error;
    return mapUser(data as Record<string, unknown>);
  },

  async listPendingJoiningFees() {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("users")
      .select("*")
      .eq("joining_fee_status", "pending_approval")
      .order("joining_fee_submitted_at", { ascending: false });
    if (error) throw error;
    const users = (data ?? []).map((d) => mapUser(d as Record<string, unknown>));
    const result: { user: User; payment: Payment | null }[] = [];
    for (const u of users) {
      const { data: pays } = await sb
        .from("payments")
        .select("*")
        .eq("user_id", u.id)
        .eq("type", "joining_fee")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);
      const payment =
        pays && pays.length > 0
          ? mapPayment(pays[0] as Record<string, unknown>)
          : null;
      result.push({ user: u, payment });
    }
    return result;
  },

  async approveJoiningFee(user_id) {
    const sb = createServerClient();
    const u = await this.getUserById(user_id);
    if (!u) throw new Error("User not found");
    const { error } = await sb
      .from("users")
      .update({
        joining_fee_paid: true,
        joining_fee_status: "approved",
      })
      .eq("id", user_id);
    if (error) throw error;
    // mark the pending joining_fee payment approved
    let payment: Payment | null = null;
    const { data: pendArr } = await sb
      .from("payments")
      .select("*")
      .eq("user_id", user_id)
      .eq("type", "joining_fee")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);
    if (pendArr && pendArr.length > 0) {
      const pendId = String(pendArr[0].id);
      const { data: upd } = await sb
        .from("payments")
        .update({
          status: "approved",
          processed_at: new Date().toISOString(),
          note: "Joining fee approved by admin",
          balance_after: u.balance,
        })
        .eq("id", pendId)
        .select()
        .single();
      if (upd) payment = mapPayment(upd as Record<string, unknown>);
    }
    await sb.from("notifications").insert({
      id: generateId(),
      user_id,
      title: "Joining Fee Approved",
      body: "Your joining fee payment was verified. Tasks, withdrawals, and referrals are now unlocked.",
      type: "success",
      is_read: false,
      created_at: new Date().toISOString(),
    });
    const updated = await this.getUserById(user_id);
    return { user: updated!, payment };
  },

  async rejectJoiningFee(user_id, reason) {
    const sb = createServerClient();
    const u = await this.getUserById(user_id);
    if (!u) throw new Error("User not found");
    const { error } = await sb
      .from("users")
      .update({
        joining_fee_status: "rejected",
        joining_fee_paid: false,
      })
      .eq("id", user_id);
    if (error) throw error;
    let payment: Payment | null = null;
    const { data: pendArr } = await sb
      .from("payments")
      .select("*")
      .eq("user_id", user_id)
      .eq("type", "joining_fee")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);
    if (pendArr && pendArr.length > 0) {
      const pendId = String(pendArr[0].id);
      const { data: upd } = await sb
        .from("payments")
        .update({
          status: "rejected",
          processed_at: new Date().toISOString(),
          note: reason ?? "Joining fee rejected by admin — please resubmit",
        })
        .eq("id", pendId)
        .select()
        .single();
      if (upd) payment = mapPayment(upd as Record<string, unknown>);
    }
    await sb.from("notifications").insert({
      id: generateId(),
      user_id,
      title: "Joining Fee Rejected",
      body:
        reason ??
        "Your joining fee screenshot was rejected. Please resubmit a valid payment screenshot.",
      type: "warning",
      is_read: false,
      created_at: new Date().toISOString(),
    });
    const updated = await this.getUserById(user_id);
    return { user: updated!, payment };
  },

  async getStats() {
    const sb = createServerClient();
    const { data: users } = await sb.from("users").select("*");
    const allUsers = (users ?? []).map((d) => mapUser(d as Record<string, unknown>));
    const { data: pays } = await sb
      .from("payments")
      .select("*")
      .in("type", ["subscription", "joining_fee", "withdrawal", "task_reward", "referral_bonus"]);
    const allPays = (pays ?? []).map((d) => mapPayment(d as Record<string, unknown>));
    let pendingTasks: number = (
      await Promise.all(
        ["gmail_tasks", "tiktok_likes"].map(async (t) => {
          const { count } = await sb
            .from(t)
            .select("*", { count: "exact", head: true })
            .eq("status", "pending");
          return count ?? 0;
        })
      )
    ).reduce((a, b) => a + b, 0);

    // Also count CMS task_submissions pending
    try {
      const { count: cmsPending } = await sb
        .from("task_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      pendingTasks += cmsPending ?? 0;
    } catch { /* table may not exist yet */ }

    const revenue = allPays
      .filter(
        (p) =>
          (p.type === "subscription" || p.type === "joining_fee") &&
          p.status === "approved"
      )
      .reduce((s, p) => s + Math.abs(p.amount), 0);
    const pendW = allPays.filter(
      (p) => p.type === "withdrawal" && p.status === "pending"
    );
    const pendingJoiningFeesCount = allUsers.filter(
      (u) => u.joining_fee_status === "pending_approval"
    ).length;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's signups
    const today_signups = allUsers.filter((u) => new Date(u.created_at) >= todayStart).length;

    // Today's revenue (approved subscription + joining_fee created today)
    const today_revenue = round2(
      allPays
        .filter((p) =>
          (p.type === "subscription" || p.type === "joining_fee") &&
          p.status === "approved" &&
          new Date(p.created_at) >= todayStart
        )
        .reduce((s, p) => s + Math.abs(p.amount), 0)
    );

    // Monthly revenue
    const monthly_revenue = round2(
      allPays
        .filter((p) =>
          (p.type === "subscription" || p.type === "joining_fee") &&
          p.status === "approved" &&
          new Date(p.created_at) >= monthStart
        )
        .reduce((s, p) => s + Math.abs(p.amount), 0)
    );

    // Task expense (all approved task_reward payments)
    const task_expense = round2(
      allPays
        .filter((p) => p.type === "task_reward" && p.status === "approved")
        .reduce((s, p) => s + Math.abs(p.amount), 0)
    );

    // Referral expense (all approved referral_bonus payments)
    const referral_expense = round2(
      allPays
        .filter((p) => p.type === "referral_bonus" && p.status === "approved")
        .reduce((s, p) => s + Math.abs(p.amount), 0)
    );

    // Current profit = total revenue - task expense - referral expense - wallet liability
    const total_balance_owed = round2(allUsers.reduce((s, u) => s + u.balance, 0));
    const current_profit = round2(revenue - task_expense - referral_expense - total_balance_owed);

    // Pending gmail count
    let pending_gmail_count = 0;
    try {
      const { count: gPending } = await sb
        .from("gmail_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      pending_gmail_count = gPending ?? 0;
    } catch { /* table may not exist yet */ }

    return {
      total_users: allUsers.length,
      active_users: allUsers.filter((u) => !u.is_banned && !u.is_suspended).length,
      suspended_users: allUsers.filter((u) => u.is_suspended).length,
      banned_users: allUsers.filter((u) => u.is_banned).length,
      total_revenue: round2(revenue),
      pending_withdrawals: round2(pendW.reduce((s, p) => s + Math.abs(p.amount), 0)),
      pending_withdrawals_count: pendW.length,
      pending_tasks_count: pendingTasks,
      pending_joining_fees_count: pendingJoiningFeesCount,
      monthly_signups: allUsers.filter((u) => {
        const d = new Date(u.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length,
      total_balance_owed,
      // Enterprise dashboard fields
      today_signups,
      today_revenue,
      monthly_revenue,
      task_expense,
      referral_expense,
      current_profit,
      pending_gmail_count,
    } satisfies AdminStats;
  },
  async approveWithdrawal(payment_id) {
    const sb = createServerClient();
    const { data: pay } = await sb
      .from("payments")
      .select("*")
      .eq("id", payment_id)
      .maybeSingle();
    if (!pay) throw new Error("Payment not found");
    const p = mapPayment(pay as Record<string, unknown>);
    if (p.type !== "withdrawal") throw new Error("Not a withdrawal");
    const u = await this.getUserById(p.user_id);
    if (u) {
      const newTw = round2(u.total_withdrawn + Math.abs(p.amount));
      await sb.from("users").update({ total_withdrawn: newTw }).eq("id", u.id);
    }
    const { data, error } = await sb
      .from("payments")
      .update({
        status: "approved",
        processed_at: new Date().toISOString(),
        note: "Withdrawal approved",
        balance_after: u ? u.balance : null,
      })
      .eq("id", payment_id)
      .select()
      .single();
    if (error) throw error;
    await sb.from("notifications").insert({
      id: generateId(),
      user_id: p.user_id,
      title: "Withdrawal Approved",
      body: `Your ${Math.abs(p.amount)} cashout to ${p.method} was approved.`,
      type: "payment",
      is_read: false,
      created_at: new Date().toISOString(),
    });
    return mapPayment(data as Record<string, unknown>);
  },
  async rejectWithdrawal(payment_id) {
    const sb = createServerClient();
    const { data: pay } = await sb
      .from("payments")
      .select("*")
      .eq("id", payment_id)
      .maybeSingle();
    if (!pay) throw new Error("Payment not found");
    const p = mapPayment(pay as Record<string, unknown>);
    if (p.type !== "withdrawal") throw new Error("Not a withdrawal");
    const u = await this.getUserById(p.user_id);
    let refundBal: number | null = null;
    if (u) {
      refundBal = round2(u.balance + Math.abs(p.amount));
      await sb.from("users").update({ balance: refundBal }).eq("id", u.id);
    }
    const { data, error } = await sb
      .from("payments")
      .update({
        status: "rejected",
        processed_at: new Date().toISOString(),
        note: "Withdrawal rejected — refunded",
        balance_after: refundBal,
      })
      .eq("id", payment_id)
      .select()
      .single();
    if (error) throw error;
    await sb.from("notifications").insert({
      id: generateId(),
      user_id: p.user_id,
      title: "Withdrawal Rejected",
      body: `Your ${Math.abs(p.amount)} cashout was rejected and refunded to your balance.`,
      type: "warning",
      is_read: false,
      created_at: new Date().toISOString(),
    });
    return mapPayment(data as Record<string, unknown>);
  },
  async markPaidWithdrawal(payment_id) {
    const sb = createServerClient();
    const { data: pay } = await sb
      .from("payments")
      .select("*")
      .eq("id", payment_id)
      .maybeSingle();
    if (!pay) throw new Error("Payment not found");
    const p = mapPayment(pay as Record<string, unknown>);
    if (p.type !== "withdrawal") throw new Error("Not a withdrawal");
    if (p.status !== "approved")
      throw new Error("Only approved withdrawals can be marked as paid");
    const u = await this.getUserById(p.user_id);
    const { data, error } = await sb
      .from("payments")
      .update({
        status: "paid",
        processed_at: new Date().toISOString(),
        note: "Withdrawal marked as paid",
        balance_after: u ? u.balance : null,
      })
      .eq("id", payment_id)
      .select()
      .single();
    if (error) throw error;
    await sb.from("notifications").insert({
      id: generateId(),
      user_id: p.user_id,
      title: "Withdrawal Paid",
      body: `Your ${Math.abs(p.amount)} cashout to ${p.method} has been marked as paid.`,
      type: "success",
      is_read: false,
      created_at: new Date().toISOString(),
    });
    return mapPayment(data as Record<string, unknown>);
  },
  async cancelWithdrawal(payment_id) {
    const sb = createServerClient();
    const { data: pay } = await sb
      .from("payments")
      .select("*")
      .eq("id", payment_id)
      .maybeSingle();
    if (!pay) throw new Error("Payment not found");
    const p = mapPayment(pay as Record<string, unknown>);
    if (p.type !== "withdrawal") throw new Error("Not a withdrawal");
    if (p.status === "cancelled" || p.status === "rejected")
      throw new Error("Withdrawal already cancelled");
    if (p.status === "paid")
      throw new Error("Cannot cancel a paid withdrawal");
    const u = await this.getUserById(p.user_id);
    let refundBal: number | null = null;
    if (u) {
      refundBal = round2(u.balance + Math.abs(p.amount));
      await sb.from("users").update({ balance: refundBal }).eq("id", u.id);
    }
    const { data, error } = await sb
      .from("payments")
      .update({
        status: "cancelled",
        processed_at: new Date().toISOString(),
        note: "Withdrawal cancelled — refunded",
        balance_after: refundBal,
      })
      .eq("id", payment_id)
      .select()
      .single();
    if (error) throw error;
    await sb.from("notifications").insert({
      id: generateId(),
      user_id: p.user_id,
      title: "Withdrawal Cancelled",
      body: `Your ${Math.abs(p.amount)} cashout was cancelled and the amount refunded to your balance.`,
      type: "warning",
      is_read: false,
      created_at: new Date().toISOString(),
    });
    return mapPayment(data as Record<string, unknown>);
  },
  async listPayments(filter) {
    const sb = createServerClient();
    let q = sb.from("payments").select("*").order("created_at", { ascending: false });
    if (filter?.user_id) q = q.eq("user_id", filter.user_id);
    if (filter?.type) q = q.eq("type", filter.type);
    if (filter?.status) q = q.eq("status", filter.status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((d) => mapPayment(d as Record<string, unknown>));
  },

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — TikTok Task CMS
  // ════════════════════════════════════════════════════════════════
  async createTask(input) {
    const sb = createServerClient();
    const reward = num(input.reward_per_user ?? 0);
    const maxP = num(input.max_participants ?? 0);
    const row = {
      title: input.title,
      description: input.description ?? "",
      platform: "tiktok",
      tiktok_username: input.tiktok_username ?? "",
      tiktok_video_url: input.tiktok_video_url ?? "",
      tiktok_video_id: null,
      task_type: input.task_type,
      reward_per_user: reward,
      max_participants: maxP,
      total_budget: round2(reward * maxP),
      completed_count: 0,
      remaining_slots: maxP,
      expiry_date: input.expiry_date ?? null,
      priority: num(input.priority ?? 0),
      instructions: input.instructions ?? "",
      comment_text: input.comment_text ?? null,
      status: "active",
      featured: false,
      pinned: false,
      visibility: "public",
      auto_close: true,
      remarks: null,
      created_by: input.created_by ?? null,
      updated_by: input.created_by ?? null,
    };
    const { data, error } = await sb
      .from("tasks")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapTaskCMS(data as Record<string, unknown>);
  },
  async listTasksCMS(filter) {
    const sb = createServerClient();
    let q = sb
      .from("tasks")
      .select("*")
      .is("deleted_at", null)
      .order("pinned", { ascending: false })
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (filter?.status) q = q.eq("status", filter.status);
    if (filter?.limit) q = q.limit(filter.limit);
    if (filter?.offset) q = q.range(filter.offset, filter.offset + (filter.limit ?? 50) - 1);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((d) => mapTaskCMS(d as Record<string, unknown>));
  },
  async getTaskCMS(id) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("tasks")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapTaskCMS(data as Record<string, unknown>) : null;
  },
  async updateTask(id, patch) {
    const sb = createServerClient();
    const payload: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() };
    // recompute budget/remaining if reward or max_participants changed
    if (patch.reward_per_user !== undefined || patch.max_participants !== undefined) {
      const existing = await this.getTaskCMS(id);
      if (existing) {
        const reward = num(patch.reward_per_user ?? existing.reward_per_user);
        const maxP = num(patch.max_participants ?? existing.max_participants);
        payload.total_budget = round2(reward * maxP);
        if (patch.max_participants !== undefined) {
          payload.remaining_slots = Math.max(0, maxP - existing.completed_count);
        }
      }
    }
    const { data, error } = await sb
      .from("tasks")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapTaskCMS(data as Record<string, unknown>);
  },
  async deleteTask(id) {
    const sb = createServerClient();
    const { error } = await sb
      .from("tasks")
      .update({ deleted_at: new Date().toISOString(), status: "cancelled" })
      .eq("id", id);
    if (error) throw error;
  },
  async submitTaskCMS(user_id, task_id, screenshot_url, meta) {
    const sb = createServerClient();
    const task = await this.getTaskCMS(task_id);
    if (!task) throw new Error("Task not found");
    if (task.status !== "active" && task.status !== "published")
      throw new Error(`Task is ${task.status}, cannot accept submissions`);
    if (task.remaining_slots <= 0)
      throw new Error("Task is fully booked");
    if (task.expiry_date && new Date(task.expiry_date) < new Date())
      throw new Error("Task has expired");
    const row = {
      task_id,
      user_id,
      screenshot_url,
      status: "pending",
      reward: task.reward_per_user,
      device: meta?.device ?? null,
      browser: meta?.browser ?? null,
      ip_address: meta?.ip_address ?? null,
    };
    const { data, error } = await sb
      .from("task_submissions")
      .insert(row)
      .select()
      .single();
    if (error) {
      // 23505 = unique_violation (task_id, user_id)
      if (String(error.code ?? "") === "23505" || /duplicate/i.test(error.message))
        throw new Error("You have already submitted this task. Each task allows one submission per user.");
      throw error;
    }
    return mapTaskSubmission(data as Record<string, unknown>);
  },
  async listUserTaskSubmissions(user_id) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("task_submissions")
      .select("*, tasks(title, task_type), users(email, full_name)")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d) => mapTaskSubmission(d as Record<string, unknown>));
  },
  async listTaskSubmissions(filter) {
    const sb = createServerClient();
    let q = sb
      .from("task_submissions")
      .select("*, tasks(title, task_type), users(email, full_name)")
      .order("created_at", { ascending: false });
    if (filter?.status) q = q.eq("status", filter.status);
    if (filter?.task_id) q = q.eq("task_id", filter.task_id);
    if (filter?.limit) q = q.limit(filter.limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((d) => mapTaskSubmission(d as Record<string, unknown>));
  },
  async approveTaskSubmission(submission_id, admin_id) {
    const sb = createServerClient();
    const { data: existing, error: getErr } = await sb
      .from("task_submissions")
      .select("*, tasks!inner(id, title, reward_per_user, completed_count, remaining_slots, auto_close)")
      .eq("id", submission_id)
      .maybeSingle();
    if (getErr) throw getErr;
    if (!existing) throw new Error("Submission not found");
    const sub = mapTaskSubmission(existing as Record<string, unknown>);
    if (sub.status === "approved")
      throw new Error("Submission already approved");

    const u = await this.getUserById(sub.user_id);
    if (!u) throw new Error("User not found");

    const reward = sub.reward || num((existing.tasks as Record<string, unknown>)?.reward_per_user);
    const newBalance = round2(u.balance + reward);
    const newTotalEarned = round2(u.total_earned + reward);

    // update submission status
    const { data: upd, error: updErr } = await sb
      .from("task_submissions")
      .update({
        status: "approved",
        reviewed_by: admin_id,
        reviewed_at: new Date().toISOString(),
        approval_notes: "Approved by admin",
      })
      .eq("id", submission_id)
      .select()
      .single();
    if (updErr) throw updErr;

    // credit wallet
    await sb.from("users").update({ balance: newBalance, total_earned: newTotalEarned }).eq("id", u.id);

    const payment = {
      id: generateId(),
      user_id: u.id,
      type: "task_reward",
      amount: reward,
      method: "admin",
      account: "",
      status: "approved",
      note: `TikTok task reward — ${(existing.tasks as Record<string, unknown>)?.title ?? "task"}`,
      balance_after: newBalance,
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      approved_by: admin_id,
      approved_at: new Date().toISOString(),
    };
    const { data: payRow, error: payErr } = await sb
      .from("payments")
      .insert(payment)
      .select()
      .single();
    if (payErr) throw payErr;

    // record in wallet ledger via RPC
    try {
      await sb.rpc("record_wallet_transaction", {
        p_user_id: u.id,
        p_credit: reward,
        p_debit: 0,
        p_reference_type: "task_reward",
        p_reference_id: submission_id,
        p_description: `Task reward: ${(existing.tasks as Record<string, unknown>)?.title ?? "task"}`,
        p_admin_id: admin_id,
      });
    } catch {
      /* non-fatal — RPC may not be reachable */
    }

    // notification to user
    await sb.from("notifications").insert({
      id: generateId(),
      user_id: u.id,
      title: "Task Approved",
      body: `Your task submission was approved. ${reward} credited to your wallet.`,
      type: "task",
      is_read: false,
      created_at: new Date().toISOString(),
    });

    const submission = mapTaskSubmission(upd as Record<string, unknown>);
    return { submission, payment: mapPayment(payRow as Record<string, unknown>) };
  },
  async rejectTaskSubmission(submission_id, admin_id, reason) {
    const sb = createServerClient();
    const { data: existing, error: getErr } = await sb
      .from("task_submissions")
      .select("*, tasks!inner(title)")
      .eq("id", submission_id)
      .maybeSingle();
    if (getErr) throw getErr;
    if (!existing) throw new Error("Submission not found");
    const sub = mapTaskSubmission(existing as Record<string, unknown>);
    if (sub.status === "rejected") return sub;

    const { data: upd, error: updErr } = await sb
      .from("task_submissions")
      .update({
        status: "rejected",
        reviewed_by: admin_id,
        reviewed_at: new Date().toISOString(),
        reject_reason: reason ?? "Rejected by admin",
      })
      .eq("id", submission_id)
      .select()
      .single();
    if (updErr) throw updErr;

    await sb.from("notifications").insert({
      id: generateId(),
      user_id: sub.user_id,
      title: "Task Submission Rejected",
      body: reason ??
        "Your task submission was rejected. Please review the task instructions and try again.",
      type: "warning",
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return mapTaskSubmission(upd as Record<string, unknown>);
  },

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Gmail submissions
  // ════════════════════════════════════════════════════════════════
  async submitGmail(input) {
    const sb = createServerClient();
    const settings = await this.getSettings();
    let reward = settings.gmail_reward;
    let campaignId = input.campaign_id ?? null;
    if (campaignId) {
      const { data: camp } = await sb
        .from("gmail_campaigns")
        .select("reward, status")
        .eq("id", campaignId)
        .maybeSingle();
      if (camp) {
        reward = num(camp.reward) || reward;
        if (camp.status !== "active") campaignId = null;
      }
    }
    const row = {
      user_id: input.user_id,
      campaign_id: campaignId,
      gmail_address: input.gmail_address,
      gmail_password: settings.gmail_default_password,
      recovery_email: input.recovery_email ?? null,
      recovery_phone: input.recovery_phone ?? null,
      country: input.country ?? null,
      creation_date: input.creation_date ?? null,
      status: "pending",
      reward,
      ...(input.screenshot_url ? { screenshot_url: input.screenshot_url } : {}),
    };
    const { data, error } = await sb
      .from("gmail_submissions")
      .insert(row)
      .select()
      .single();
    if (error) {
      if (String(error.code ?? "") === "23505" || /duplicate/i.test(error.message))
        throw new Error("This Gmail address has already been submitted.");
      throw error;
    }
    return mapGmail(data as Record<string, unknown>);
  },
  async listUserGmail(user_id) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("gmail_submissions")
      .select("*, users(email, full_name)")
      .eq("user_id", user_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d) => mapGmail(d as Record<string, unknown>));
  },
  async listGmailSubmissions(filter) {
    const sb = createServerClient();
    let q = sb
      .from("gmail_submissions")
      .select("*, users(email, full_name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (filter?.status) q = q.eq("status", filter.status);
    if (filter?.limit) q = q.limit(filter.limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((d) => mapGmail(d as Record<string, unknown>));
  },
  async approveGmail(submission_id, admin_id) {
    const sb = createServerClient();
    const { data: existing, error: getErr } = await sb
      .from("gmail_submissions")
      .select("*")
      .eq("id", submission_id)
      .maybeSingle();
    if (getErr) throw getErr;
    if (!existing) throw new Error("Gmail submission not found");
    const sub = mapGmail(existing as Record<string, unknown>);
    if (sub.status === "approved")
      throw new Error("Submission already approved");

    const u = await this.getUserById(sub.user_id);
    if (!u) throw new Error("User not found");

    const reward = sub.reward;
    const newBalance = round2(u.balance + reward);
    const newTotalEarned = round2(u.total_earned + reward);

    const { data: upd, error: updErr } = await sb
      .from("gmail_submissions")
      .update({
        status: "approved",
        reviewed_by: admin_id,
        reviewed_at: new Date().toISOString(),
        admin_notes: "Approved by admin",
      })
      .eq("id", submission_id)
      .select()
      .single();
    if (updErr) throw updErr;

    await sb.from("users").update({ balance: newBalance, total_earned: newTotalEarned }).eq("id", u.id);

    const payment = {
      id: generateId(),
      user_id: u.id,
      type: "task_reward",
      amount: reward,
      method: "admin",
      account: "",
      status: "approved",
      note: `Gmail submission reward — ${sub.gmail_address}`,
      balance_after: newBalance,
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      approved_by: admin_id,
      approved_at: new Date().toISOString(),
    };
    const { data: payRow, error: payErr } = await sb
      .from("payments")
      .insert(payment)
      .select()
      .single();
    if (payErr) throw payErr;

    try {
      await sb.rpc("record_wallet_transaction", {
        p_user_id: u.id,
        p_credit: reward,
        p_debit: 0,
        p_reference_type: "gmail_reward",
        p_reference_id: submission_id,
        p_description: `Gmail reward: ${sub.gmail_address}`,
        p_admin_id: admin_id,
      });
    } catch {
      /* non-fatal */
    }

    await sb.from("notifications").insert({
      id: generateId(),
      user_id: u.id,
      title: "Gmail Submission Approved",
      body: `Your Gmail submission (${sub.gmail_address}) was approved. ${reward} credited to your wallet.`,
      type: "success",
      is_read: false,
      created_at: new Date().toISOString(),
    });

    const submission = mapGmail(upd as Record<string, unknown>);
    return { submission, payment: mapPayment(payRow as Record<string, unknown>) };
  },
  async rejectGmail(submission_id, admin_id, reason) {
    const sb = createServerClient();
    const { data: existing, error: getErr } = await sb
      .from("gmail_submissions")
      .select("*")
      .eq("id", submission_id)
      .maybeSingle();
    if (getErr) throw getErr;
    if (!existing) throw new Error("Gmail submission not found");
    const sub = mapGmail(existing as Record<string, unknown>);
    if (sub.status === "rejected") return sub;

    const { data: upd, error: updErr } = await sb
      .from("gmail_submissions")
      .update({
        status: "rejected",
        reviewed_by: admin_id,
        reviewed_at: new Date().toISOString(),
        reject_reason: reason ?? "Rejected by admin",
      })
      .eq("id", submission_id)
      .select()
      .single();
    if (updErr) throw updErr;

    await sb.from("notifications").insert({
      id: generateId(),
      user_id: sub.user_id,
      title: "Gmail Submission Rejected",
      body: reason ??
        "Your Gmail submission was rejected. Please contact support for details.",
      type: "warning",
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return mapGmail(upd as Record<string, unknown>);
  },
  async deleteGmailSubmission(submission_id) {
    const sb = createServerClient();
    const { error } = await sb
      .from("gmail_submissions")
      .update({
        deleted_at: new Date().toISOString(),
        status: "cancelled",
      })
      .eq("id", submission_id);
    if (error) throw error;
  },

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Gmail Campaigns
  // ════════════════════════════════════════════════════════════════
  async createGmailCampaign(input) {
    const sb = createServerClient();
    const row = {
      name: input.name,
      description: input.description ?? "",
      reward: num(input.reward ?? 0),
      daily_limit: num(input.daily_limit ?? 0),
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      status: input.status ?? "active",
      rules: input.rules ?? "",
      created_by: input.created_by ?? null,
    };
    const { data, error } = await sb
      .from("gmail_campaigns")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapCampaign(data as Record<string, unknown>);
  },
  async listGmailCampaigns() {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("gmail_campaigns")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d) => mapCampaign(d as Record<string, unknown>));
  },
  async listActiveGmailCampaigns() {
    const sb = createServerClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await sb
      .from("gmail_campaigns")
      .select("*")
      .eq("status", "active")
      .is("deleted_at", null)
      .or(`end_date.is.null,end_date.gte.${nowIso}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d) => mapCampaign(d as Record<string, unknown>));
  },
  async updateGmailCampaign(id, patch) {
    const sb = createServerClient();
    const payload = { ...patch, updated_at: new Date().toISOString() };
    const { data, error } = await sb
      .from("gmail_campaigns")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapCampaign(data as Record<string, unknown>);
  },
  async deleteGmailCampaign(id) {
    const sb = createServerClient();
    const { error } = await sb
      .from("gmail_campaigns")
      .update({ deleted_at: new Date().toISOString(), status: "closed" })
      .eq("id", id);
    if (error) throw error;
  },

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Audit Log
  // ════════════════════════════════════════════════════════════════
  async logAudit(input) {
    const sb = createServerClient();
    const row = {
      admin_id: input.admin_id,
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id ?? null,
      old_value: input.old_value ?? null,
      new_value: input.new_value ?? null,
      ip_address: input.ip_address ?? null,
      user_agent: input.user_agent ?? null,
    };
    const { error } = await sb.from("audit_logs").insert(row);
    if (error) {
      // never throw on audit failure — log to console instead
      console.error("[audit] failed to log:", error.message);
    }
  },
  async listAuditLogs(limit = 100, offset = 0) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("audit_logs")
      .select("*, users(email)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data ?? []).map((d) => mapAudit(d as Record<string, unknown>));
  },

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Announcements
  // ════════════════════════════════════════════════════════════════
  async createAnnouncement(input) {
    const sb = createServerClient();
    const row = {
      title: input.title,
      body: input.body ?? "",
      type: input.type ?? "info",
      is_active: input.is_active ?? true,
      image_url: input.image_url ?? null,
      priority: num(input.priority ?? 0),
      publish_date: input.publish_date ?? null,
      expiry_date: input.expiry_date ?? null,
      visible_to: input.visible_to ?? "all",
      created_by: input.created_by ?? null,
    };
    const { data, error } = await sb
      .from("announcements")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapAnnouncement(data as Record<string, unknown>);
  },
  async listActiveAnnouncements() {
    const sb = createServerClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await sb
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null)
      .or(`publish_date.is.null,publish_date.lte.${nowIso}`)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    const items = (data ?? [])
      .map((d) => mapAnnouncement(d as Record<string, unknown>))
      .filter((a) => !a.expiry_date || new Date(a.expiry_date) > new Date());
    return items;
  },
  async listAllAnnouncements() {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("announcements")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d) => mapAnnouncement(d as Record<string, unknown>));
  },
  async toggleAnnouncement(id, is_active) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("announcements")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapAnnouncement(data as Record<string, unknown>);
  },
  async deleteAnnouncement(id) {
    const sb = createServerClient();
    const { error } = await sb
      .from("announcements")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", id);
    if (error) throw error;
  },

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Wallet Ledger
  // ════════════════════════════════════════════════════════════════
  async recordWalletTransaction(input) {
    const sb = createServerClient();
    const credit = num(input.credit ?? 0);
    const debit = num(input.debit ?? 0);
    const { data, error } = await sb.rpc("record_wallet_transaction", {
      p_user_id: input.user_id,
      p_credit: credit,
      p_debit: debit,
      p_reference_type: input.reference_type ?? "",
      p_reference_id: input.reference_id ?? null,
      p_description: input.description ?? "",
      p_admin_id: input.admin_id ?? null,
    });
    if (error) throw error;
    return mapLedger(data as Record<string, unknown>);
  },
  async listWalletLedger(user_id, limit = 100) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("wallet_ledger")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((d) => mapLedger(d as Record<string, unknown>));
  },

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Login Sessions
  // ════════════════════════════════════════════════════════════════
  async listLoginSessions(user_id) {
    const sb = createServerClient();
    let q = sb
      .from("login_sessions")
      .select("*, users(email)")
      .order("created_at", { ascending: false });
    if (user_id) q = q.eq("user_id", user_id);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((d) => mapLoginSession(d as Record<string, unknown>));
  },
  async revokeSession(id) {
    const sb = createServerClient();
    const { error } = await sb
      .from("login_sessions")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    // also delete from `sessions` if matching token — keep sessions table in sync
    const { data: ls } = await sb
      .from("login_sessions")
      .select("token")
      .eq("id", id)
      .maybeSingle();
    if (ls?.token) {
      await sb.from("sessions").delete().eq("token", ls.token);
    }
  },

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Blocked IPs
  // ════════════════════════════════════════════════════════════════
  async listBlockedIPs() {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("blocked_ips")
      .select("*, users(email)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d) => mapBlockedIP(d as Record<string, unknown>));
  },
  async blockIP(ip, reason, blocked_by) {
    const sb = createServerClient();
    const row = {
      ip_address: ip,
      reason,
      blocked_by,
    };
    const { data, error } = await sb
      .from("blocked_ips")
      .upsert(row, { onConflict: "ip_address" })
      .select()
      .single();
    if (error) throw error;
    return mapBlockedIP(data as Record<string, unknown>);
  },
  async unblockIP(id) {
    const sb = createServerClient();
    const { error } = await sb.from("blocked_ips").delete().eq("id", id);
    if (error) throw error;
  },

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Notifications broadcast queue
  // ════════════════════════════════════════════════════════════════
  async sendNotification(input) {
    const sb = createServerClient();
    const targetIds: string[] = [];

    if (input.target_type === "single") {
      if (input.user_id) targetIds.push(input.user_id);
    } else if (input.target_type === "all") {
      const { data: users, error: uErr } = await sb
        .from("users")
        .select("id")
        .eq("is_banned", false);
      if (uErr) throw uErr;
      for (const u of users ?? []) targetIds.push(String(u.id));
    } else if (input.target_type === "multiple") {
      const arr = (input.target_data as string[] | null) ?? [];
      for (const id of arr) if (typeof id === "string") targetIds.push(id);
    } else if (input.target_type === "country") {
      const country = String(input.target_data ?? "");
      const { data: users } = await sb
        .from("users")
        .select("id")
        .eq("is_banned", false)
        .eq("country", country);
      for (const u of users ?? []) targetIds.push(String(u.id));
    } else if (input.target_type === "status") {
      // target_data: "banned" | "active" | "suspended" | "joining_fee_paid"
      const status = String(input.target_data ?? "");
      let q = sb.from("users").select("id");
      if (status === "banned") q = q.eq("is_banned", true);
      else if (status === "suspended") q = q.eq("is_suspended", true);
      else if (status === "active") q = q.eq("is_banned", false).eq("is_suspended", false);
      else if (status === "joining_fee_paid") q = q.eq("joining_fee_paid", true);
      const { data: users } = await q;
      for (const u of users ?? []) targetIds.push(String(u.id));
    } else if (input.target_type === "subscription") {
      // active subscription = subscription_end_date > now
      const nowIso = new Date().toISOString();
      const { data: users } = await sb
        .from("users")
        .select("id")
        .eq("is_banned", false)
        .gt("subscription_end_date", nowIso);
      for (const u of users ?? []) targetIds.push(String(u.id));
    }

    // bulk insert notifications
    if (targetIds.length > 0) {
      const rows = targetIds.map((uid) => ({
        id: generateId(),
        user_id: uid,
        title: input.title,
        body: input.body,
        type: input.type,
        link: null,
        is_read: false,
        created_at: new Date().toISOString(),
      }));
      // insert in chunks of 500 to avoid payload limits
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error: nErr } = await sb.from("notifications").insert(chunk);
        if (nErr) console.error("[notify] bulk insert chunk error:", nErr.message);
      }
    }

    const queueRow = {
      title: input.title,
      body: input.body,
      type: input.type,
      target_type: input.target_type,
      target_data: input.target_data ?? null,
      user_id: input.user_id ?? null,
      sent_by: input.sent_by ?? null,
      status: "sent" as const,
      sent_at: new Date().toISOString(),
    };
    const { data: qRow, error: qErr } = await sb
      .from("notification_queue")
      .insert(queueRow)
      .select()
      .single();
    if (qErr) {
      console.error("[notify] queue insert error:", qErr.message);
      // still return a synthetic entry so the API responds
      return {
        id: generateId(),
        title: input.title,
        body: input.body,
        type: input.type,
        target_type: input.target_type,
        target_data: input.target_data ?? null,
        user_id: input.user_id ?? null,
        sent_by: input.sent_by ?? null,
        status: "sent" as const,
        scheduled_at: null,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      } satisfies NotificationQueueEntry;
    }
    return mapNotificationQueue(qRow as Record<string, unknown>);
  },
  async listNotificationQueue() {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("notification_queue")
      .select("*, users(email)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []).map((d) => mapNotificationQueue(d as Record<string, unknown>));
  },

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — CMS Content
  // ════════════════════════════════════════════════════════════════
  async listCmsContent() {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("cms_content")
      .select("*")
      .order("key", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((d) => mapCms(d as Record<string, unknown>));
  },
  async getCmsContent(key) {
    const sb = createServerClient();
    const { data, error } = await sb
      .from("cms_content")
      .select("*")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return data ? mapCms(data as Record<string, unknown>) : null;
  },
  async updateCmsContent(key, patch) {
    const sb = createServerClient();
    const payload: Record<string, unknown> = {
      key,
      updated_at: new Date().toISOString(),
      updated_by: patch.updated_by,
    };
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.body !== undefined) payload.body = patch.body;
    if (patch.is_published !== undefined) payload.is_published = patch.is_published;
    const { data, error } = await sb
      .from("cms_content")
      .upsert(payload, { onConflict: "key" })
      .select()
      .single();
    if (error) throw error;
    return mapCms(data as Record<string, unknown>);
  },

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Dashboard Analytics
  // ════════════════════════════════════════════════════════════════
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    const sb = createServerClient();
    const days = 30;
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);
    const sinceIso = since.toISOString();

    const [paymentsR, usersR, withdrawalsR, tasksR, gmailR] = await Promise.all([
      sb.from("payments")
        .select("amount, type, status, created_at")
        .gte("created_at", sinceIso),
      sb.from("users").select("created_at").gte("created_at", sinceIso),
      sb.from("payments")
        .select("amount, status, created_at")
        .eq("type", "withdrawal")
        .gte("created_at", sinceIso),
      sb.from("task_submissions")
        .select("created_at")
        .gte("created_at", sinceIso),
      sb.from("gmail_submissions")
        .select("created_at")
        .gte("created_at", sinceIso),
    ]);

    const dailyRevenue = emptyDailySeries(days);
    const dailySignups = emptyDailySeries(days);
    const dailyWithdrawals = emptyDailySeries(days);
    const dailyTasks = emptyDailySeries(days);
    const dailyGmail = emptyDailySeries(days);

    for (const p of (paymentsR.data ?? []) as Record<string, unknown>[]) {
      if (p.status !== "approved") continue;
      if (p.type === "subscription" || p.type === "joining_fee") {
        bumpSeries(dailyRevenue, String(p.created_at), Math.abs(num(p.amount)));
      }
    }
    for (const u of (usersR.data ?? []) as Record<string, unknown>[]) {
      bumpSeries(dailySignups, String(u.created_at), 1);
    }
    for (const w of (withdrawalsR.data ?? []) as Record<string, unknown>[]) {
      bumpSeries(dailyWithdrawals, String(w.created_at), Math.abs(num(w.amount)));
    }
    for (const t of (tasksR.data ?? []) as Record<string, unknown>[]) {
      bumpSeries(dailyTasks, String(t.created_at), 1);
    }
    for (const g of (gmailR.data ?? []) as Record<string, unknown>[]) {
      bumpSeries(dailyGmail, String(g.created_at), 1);
    }

    // recent activity — last 20 events across multiple tables
    const recent: DashboardAnalytics["recent_activity"] = [];
    const [recentUsers, recentPays, recentTasks, recentGmail, recentAudit] = await Promise.all([
      sb.from("users").select("email, created_at").order("created_at", { ascending: false }).limit(5),
      sb.from("payments").select("user_id, amount, type, status, created_at, users(email)").order("created_at", { ascending: false }).limit(5),
      sb.from("task_submissions").select("created_at, status, users(email), tasks(title)").order("created_at", { ascending: false }).limit(5),
      sb.from("gmail_submissions").select("created_at, status, gmail_address, users(email)").order("created_at", { ascending: false }).limit(5),
      sb.from("audit_logs").select("action, entity_type, created_at, users(email)").order("created_at", { ascending: false }).limit(5),
    ]);

    for (const u of (recentUsers.data ?? []) as Record<string, unknown>[]) {
      recent.push({
        type: "signup",
        description: "New user registered",
        time: String(u.created_at),
        user_email: nullableStr(u.email) ?? undefined,
      });
    }
    for (const p of (recentPays.data ?? []) as Record<string, unknown>[]) {
      recent.push({
        type: "payment",
        description: `${String(p.type)} ${String(p.status)} — ${num(p.amount)}`,
        time: String(p.created_at),
        user_email: nullableStr((p.users as Record<string, unknown> | null)?.email) ?? undefined,
      });
    }
    for (const t of (recentTasks.data ?? []) as Record<string, unknown>[]) {
      recent.push({
        type: "task",
        description: `Task submission ${String(t.status)}`,
        time: String(t.created_at),
        user_email: nullableStr((t.users as Record<string, unknown> | null)?.email) ?? undefined,
      });
    }
    for (const g of (recentGmail.data ?? []) as Record<string, unknown>[]) {
      recent.push({
        type: "gmail",
        description: `Gmail ${String(g.gmail_address)} — ${String(g.status)}`,
        time: String(g.created_at),
        user_email: nullableStr((g.users as Record<string, unknown> | null)?.email) ?? undefined,
      });
    }
    for (const a of (recentAudit.data ?? []) as Record<string, unknown>[]) {
      recent.push({
        type: "audit",
        description: `${String(a.action)} on ${String(a.entity_type)}`,
        time: String(a.created_at),
        user_email: nullableStr((a.users as Record<string, unknown> | null)?.email) ?? undefined,
      });
    }
    recent.sort((a, b) => (a.time < b.time ? 1 : -1));

    return {
      daily_revenue: dailyRevenue,
      daily_signups: dailySignups,
      daily_withdrawals: dailyWithdrawals,
      daily_tasks: dailyTasks,
      daily_gmail: dailyGmail,
      recent_activity: recent.slice(0, 20),
    };
  },

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — System Health
  // ════════════════════════════════════════════════════════════════
  async getSystemHealth(): Promise<SystemHealth> {
    const sb = createServerClient();
    let dbStatus: SystemHealth["database"] = "healthy";
    let storageStatus: SystemHealth["storage"] = "healthy";

    let totalUsers = 0;
    let totalTasks = 0;
    let totalPayments = 0;
    let storageBuckets = 0;

    try {
      const [u, t, p] = await Promise.all([
        sb.from("users").select("*", { count: "exact", head: true }),
        sb.from("tasks").select("*", { count: "exact", head: true }),
        sb.from("payments").select("*", { count: "exact", head: true }),
      ]);
      totalUsers = u.count ?? 0;
      totalTasks = t.count ?? 0;
      totalPayments = p.count ?? 0;
      if (u.error || t.error || p.error) dbStatus = "degraded";
    } catch {
      dbStatus = "down";
    }

    try {
      const { data: buckets, error: bErr } = await sb.storage.listBuckets();
      if (bErr) {
        storageStatus = "degraded";
      } else {
        storageBuckets = buckets?.length ?? 0;
      }
    } catch {
      storageStatus = "down";
    }

    return {
      database: dbStatus,
      storage: storageStatus,
      api: "healthy",
      total_users: totalUsers,
      total_tasks: totalTasks,
      total_payments: totalPayments,
      storage_buckets: storageBuckets,
      uptime: new Date().toISOString(),
    };
  },
};

export type { PaymentMethod, TaskStatus };
