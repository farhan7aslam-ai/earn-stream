// Core domain types for EarnStream.
// These mirror the Postgres schema in supabase/migrations/0001_init.sql.

export type Role = "user" | "admin";

export type TaskType = "gmail" | "tiktok";
export type TaskStatus = "pending" | "approved" | "rejected";

/** Joining-fee verification lifecycle.
 *  - `none`           : user has not submitted a joining-fee payment
 *  - `pending_approval`: user uploaded a screenshot; awaiting admin review
 *  - `approved`       : admin approved → joining_fee_paid is flipped true
 *  - `rejected`       : admin rejected; user may resubmit
 */
export type JoiningFeeStatus =
  | "none"
  | "pending_approval"
  | "approved"
  | "rejected";

export type PaymentType =
  | "withdrawal"
  | "subscription"
  | "joining_fee"
  | "task_reward"
  | "referral_bonus"
  | "admin_credit"
  | "admin_debit";

export type PaymentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "paid"
  | "cancelled";
export type PaymentMethod = "easypaisa" | "jazzcash" | "binance" | "admin";

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string;
  role: Role;
  balance: number;
  pending_earnings: number;
  total_withdrawn: number;
  /** Lifetime earnings — admin-editable ledger field. */
  total_earned: number;
  joining_fee_paid: boolean;
  joining_fee_status: JoiningFeeStatus;
  joining_fee_screenshot: string | null;
  joining_fee_submitted_at: string | null;
  is_banned: boolean;
  is_suspended: boolean;
  subscription_end_date: string | null;
  referral_code: string;
  referred_by: string | null;
  /** Per-user referral bonus override; null = use global setting. */
  custom_referral_bonus_percent: number | null;
  // Enterprise profile fields (migration 0004)
  avatar_url: string | null;
  country: string | null;
  timezone: string;
  language: string;
  last_login_at: string | null;
  last_ip: string | null;
  last_device: string | null;
  created_at: string;
}

/** User object safe to send to the client (no password_hash). */
export type SafeUser = Omit<User, "password_hash">;

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface PlatformSettings {
  id: number;
  monthly_signup_limit: number; // 0 = unlimited
  subscription_fee: number;
  subscription_duration_days: number;
  joining_fee: number;
  gmail_task_rate: number;
  tiktok_like_rate: number;
  video_promotion_rate: number;
  referral_bonus_percent: number;
  minimum_payout: number;
  easypaisa_number: string;
  easypaisa_account_name: string;
  jazzcash_number: string;
  jazzcash_account_name: string;
  binance_id: string;
  site_name: string;
  nav_logo_text: string;
  support_email: string;
  footer_notice: string;
  currency_symbol: string;
  // Enterprise CMS fields
  maintenance_mode: boolean;
  registration_open: boolean;
  max_tasks_per_user_per_day: number;
  task_review_auto_approve: boolean;
  gmail_default_password: string;
  gmail_reward: number;
  gmail_module_enabled: boolean;
  gmail_submission_enabled: boolean;
  gmail_screenshot_required: boolean;
  gmail_auto_approve: boolean;
  gmail_daily_limit_per_user: number;
  binance_trc20_address: string;
  logo_url: string;
  favicon_url: string;
  social_tiktok: string;
  social_instagram: string;
  social_youtube: string;
  social_facebook: string;
  announcement_active: string | null;
  max_withdrawal_per_day: number;
  theme_primary: string;
  theme_accent: string;
  support_whatsapp: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  timezone: string;
  language: string;
  referral_type: "fixed" | "percentage";
  referral_fixed_amount: number;
  referral_lifetime: boolean;
  referral_max: number;
  referral_min_withdrawal: number;
  withdrawal_fee_percent: number;
  withdrawal_fee_fixed: number;
  password_min_length: number;
  captcha_enabled: boolean;
  rate_limit_per_minute: number;
  seo_canonical: string;
  seo_robots: string;
  seo_og_image: string;
  seo_twitter_card: string;
  google_analytics_id: string;
  google_verification: string;
  // Phase 6 CMS fields
  custom_head_code: string;
  custom_footer_code: string;
  popup_enabled: boolean;
  popup_message: string;
  popup_title: string;
  announcement_bar: string;
  announcement_bar_enabled: boolean;
  maintenance_message: string;
  facebook_pixel: string;
  microsoft_clarity: string;
  social_telegram: string;
  social_discord: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  meta_image: string;
  og_title: string;
  og_description: string;
  twitter_title: string;
  twitter_description: string;
  // Phase 6 Gmail extensions
  gmail_weekly_limit_per_user: number;
  gmail_monthly_limit_per_user: number;
  gmail_min_age_days: number;
  gmail_recovery_email_required: boolean;
  gmail_recovery_phone_required: boolean;
  gmail_country_restriction: string;
  gmail_auto_reject: boolean;
  // Phase 6 Withdrawal extensions
  withdrawal_max_amount: number;
  withdrawal_weekly_limit: number;
  withdrawal_monthly_limit: number;
  withdrawal_auto_approve: boolean;
  withdrawal_processing_hours: number;
  withdrawal_maintenance: boolean;
  // Phase 6 Referral extensions
  referral_banner: string;
  referral_message: string;
  referral_expiry_days: number;
  // Phase 6 Task extensions
  task_screenshot_required: boolean;
  task_min_account_age_days: number;
  task_min_followers: number;
  task_min_likes: number;
  task_allow_resubmission: boolean;
  task_auto_reject: boolean;
  updated_at: string;
}

export interface TaskRow {
  id: string;
  user_id: string;
  type: TaskType;
  task_url: string;
  screenshot_url: string;
  status: TaskStatus;
  reward: number;
  note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface Payment {
  id: string;
  user_id: string;
  type: PaymentType;
  amount: number; // positive = credit to user, negative = debit
  method: PaymentMethod;
  account: string;
  status: PaymentStatus;
  note: string | null;
  balance_after: number | null;
  created_at: string;
  processed_at: string | null;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  bonus_amount: number;
  status: "pending" | "credited";
  created_at: string;
}

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "payment"
  | "task"
  | "referral";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface TaskAttempt {
  id: string;
  user_id: string;
  task_type: TaskType;
  task_url: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  suspended_users: number;
  banned_users: number;
  total_revenue: number;
  pending_withdrawals: number;
  pending_withdrawals_count: number;
  pending_tasks_count: number;
  pending_joining_fees_count: number;
  monthly_signups: number;
  total_balance_owed: number;
  // Enterprise dashboard fields
  today_signups: number;
  today_revenue: number;
  monthly_revenue: number;
  task_expense: number;
  referral_expense: number;
  current_profit: number;
  pending_gmail_count: number;
}

/** A pending joining-fee verification request, joined with user + payment. */
export interface JoiningFeeRequest {
  user: SafeUser;
  payment: Payment | null;
}

export interface WalletSummary {
  balance: number;
  pending_earnings: number;
  total_withdrawn: number;
}

export const toSafeUser = (u: User): SafeUser => {
  const { password_hash: _ph, ...rest } = u;
  return rest;
};

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  gmail: "Gmail Task",
  tiktok: "TikTok Like",
};

export const TASK_TYPE_TABLE: Record<TaskType, string> = {
  gmail: "gmail_tasks",
  tiktok: "tiktok_likes",
};

// ════════════════════════════════════════════════════════════════════
// ENTERPRISE TYPES — TikTok Micro-Task Platform (migration 0004)
// ════════════════════════════════════════════════════════════════════

export type Platform = "tiktok";
export type TikTokTaskType = "LIKE" | "FOLLOW" | "COMMENT" | "SHARE";
export type TikTokTaskStatus = "draft" | "active" | "paused" | "closed" | "expired" | "cancelled" | "published" | "completed";

export interface TikTokTask {
  id: string;
  title: string;
  description: string;
  platform: Platform;
  tiktok_username: string;
  tiktok_video_url: string;
  tiktok_video_id: string;
  task_type: TikTokTaskType;
  reward_per_user: number;
  max_participants: number;
  total_budget: number;
  completed_count: number;
  remaining_slots: number;
  expiry_date: string | null;
  priority: number;
  instructions: string;
  comment_text: string | null;
  status: TikTokTaskStatus;
  featured: boolean;
  pinned: boolean;
  visibility: "public" | "private";
  auto_close: boolean;
  remarks: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  user_id: string;
  screenshot_url: string;
  status: "pending" | "approved" | "rejected";
  reward: number;
  reject_reason: string | null;
  approval_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  device: string | null;
  browser: string | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
  task_title?: string;
  task_type?: TikTokTaskType;
  user_email?: string;
  user_name?: string;
}

export interface GmailSubmission {
  id: string;
  user_id: string;
  campaign_id: string | null;
  gmail_address: string;
  gmail_password: string;
  recovery_email: string | null;
  recovery_phone: string | null;
  country: string | null;
  creation_date: string | null;
  status: "pending" | "approved" | "rejected" | "sold" | "cancelled";
  reward: number;
  reject_reason: string | null;
  admin_notes: string | null;
  screenshot_url: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user_email?: string;
  user_name?: string;
}

export interface GmailCampaign {
  id: string;
  name: string;
  description: string;
  reward: number;
  daily_limit: number;
  start_date: string | null;
  end_date: string | null;
  status: "active" | "paused" | "closed" | "expired";
  rules: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin_email?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "error";
  is_active: boolean;
  image_url: string | null;
  priority: number;
  publish_date: string | null;
  expiry_date: string | null;
  visible_to: "all" | "users" | "admins";
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WalletLedgerEntry {
  id: string;
  user_id: string;
  credit: number;
  debit: number;
  opening_balance: number;
  closing_balance: number;
  reference_type: string;
  reference_id: string | null;
  description: string;
  admin_id: string | null;
  created_at: string;
}

export interface LoginSession {
  id: string;
  user_id: string;
  token: string;
  ip_address: string | null;
  device: string | null;
  browser: string | null;
  user_agent: string | null;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  user_email?: string;
}

export interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_by: string | null;
  created_at: string;
  blocked_by_email?: string;
}

export interface NotificationQueueEntry {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  target_type: "all" | "single" | "multiple" | "country" | "subscription" | "status";
  target_data: unknown;
  user_id: string | null;
  sent_by: string | null;
  status: "queued" | "sent" | "failed";
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  sent_by_email?: string;
}

export interface CmsContent {
  id: string;
  key: string;
  title: string;
  body: string;
  type: "page" | "section" | "snippet";
  is_published: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardAnalytics {
  daily_revenue: { date: string; value: number }[];
  daily_signups: { date: string; value: number }[];
  daily_withdrawals: { date: string; value: number }[];
  daily_tasks: { date: string; value: number }[];
  daily_gmail: { date: string; value: number }[];
  recent_activity: {
    type: string;
    description: string;
    time: string;
    user_email?: string;
  }[];
}

export interface SystemHealth {
  database: "healthy" | "degraded" | "down";
  storage: "healthy" | "degraded" | "down";
  api: "healthy" | "degraded" | "down";
  total_users: number;
  total_tasks: number;
  total_payments: number;
  storage_buckets: number;
  uptime: string;
}
