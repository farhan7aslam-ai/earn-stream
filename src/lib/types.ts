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

export type PaymentStatus = "pending" | "approved" | "rejected";
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
  /** Minimum cashout amount a user can request. */
  minimum_payout: number;
  easypaisa_number: string;
  easypaisa_account_name: string;
  jazzcash_number: string;
  jazzcash_account_name: string;
  /** Binance BEP20 wallet address (legacy field name `binance_id`). */
  binance_id: string;
  site_name: string;
  /** Navbar / logo text shown in the topbar. */
  nav_logo_text: string;
  support_email: string;
  footer_notice: string;
  /** Display currency symbol/prefix, e.g. "Rs", "PKR", "$". */
  currency_symbol: string;
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
