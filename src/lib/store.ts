import type {
  AdminStats,
  Notification,
  NotificationType,
  Payment,
  PlatformSettings,
  Referral,
  SafeUser,
  Session,
  TaskAttempt,
  TaskRow,
  TaskType,
  User,
  WalletSummary,
} from "./types";

export interface Store {
  /** Whether this store is the local demo fallback. */
  readonly kind: "supabase" | "local";

  // ---------- settings ----------
  getSettings(): Promise<PlatformSettings>;
  updateSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings>;

  // ---------- auth / users ----------
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  getUserByReferralCode(code: string): Promise<User | null>;
  createUser(input: {
    email: string;
    password_hash: string;
    full_name: string;
    phone: string;
    referral_code: string;
    referred_by: string | null;
    role: "user" | "admin";
  }): Promise<User>;
  countSignupsThisMonth(): Promise<number>;
  countAllUsers(): Promise<number>;

  // ---------- sessions ----------
  createSession(user_id: string): Promise<Session>;
  getSession(token: string): Promise<Session | null>;
  deleteSession(token: string): Promise<void>;

  // ---------- wallet ----------
  getWallet(user_id: string): Promise<WalletSummary>;
  getLedger(user_id: string): Promise<Payment[]>;
  requestWithdrawal(
    user_id: string,
    amount: number,
    method: Payment["method"],
    account: string
  ): Promise<Payment>;

  // ---------- tasks ----------
  submitTask(
    user_id: string,
    type: TaskType,
    task_url: string,
    screenshot_url: string
  ): Promise<TaskRow>;
  listTasks(filter?: {
    status?: TaskRow["status"];
    type?: TaskType;
    user_id?: string;
  }): Promise<TaskRow[]>;
  getTask(id: string): Promise<TaskRow | null>;
  approveTask(id: string): Promise<TaskRow>;
  rejectTask(id: string, note?: string): Promise<TaskRow>;

  // ---------- task attempts (anti-cheat timer) ----------
  startTaskAttempt(
    user_id: string,
    task_type: TaskType,
    task_url: string
  ): Promise<TaskAttempt>;
  completeTaskAttempt(
    attempt_id: string,
    duration_ms: number
  ): Promise<TaskAttempt>;

  // ---------- notifications ----------
  listNotifications(user_id: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(user_id: string): Promise<void>;
  pushNotification(input: {
    user_id: string;
    title: string;
    body: string;
    type: NotificationType;
    link?: string | null;
  }): Promise<Notification>;

  // ---------- activity log (admin user detail) ----------
  getUserActivity(user_id: string): Promise<{
    tasks: TaskRow[];
    payments: Payment[];
    referrals: Referral[];
  }>;

  // ---------- referrals ----------
  getReferralsByReferrer(referrer_id: string): Promise<Referral[]>;
  createReferral(
    referrer_id: string,
    referred_id: string,
    bonus_percent: number
  ): Promise<Referral>;

  // ---------- subscription / joining fee ----------
  paySubscription(
    user_id: string,
    method: Payment["method"],
    account: string,
    fee: number,
    durationDays: number
  ): Promise<{ user: User; payment: Payment }>;

  /** User submits a joining-fee payment screenshot. Sets status to
   *  `pending_approval` — does NOT flip `joining_fee_paid`. Creates a
   *  `payments` row with status `pending`. */
  requestJoiningFee(
    user_id: string,
    method: Payment["method"],
    account: string,
    screenshot_url: string,
    fee: number
  ): Promise<{ user: User; payment: Payment }>;

  // ---------- admin ----------
  listUsers(search?: string): Promise<User[]>;
  updateUser(
    id: string,
    patch: Partial<
      Pick<
        User,
        | "balance"
        | "pending_earnings"
        | "total_earned"
        | "total_withdrawn"
        | "joining_fee_paid"
        | "is_banned"
        | "is_suspended"
        | "subscription_end_date"
        | "role"
        | "full_name"
        | "phone"
        | "email"
        | "referred_by"
        | "custom_referral_bonus_percent"
        | "password_hash"
      >
    >
  ): Promise<User>;
  /** Securely updates the master admin's email and/or password. Requires
   *  `currentPassword` to be verified before applying changes. Returns the
   *  updated user (without hash) — the caller should re-issue a session. */
  updateAdminCredentials(
    admin_id: string,
    input: { email?: string; newPassword?: string; currentPassword: string }
  ): Promise<User>;

  /** List users whose joining-fee payment is pending admin review, each with
   *  their latest pending `joining_fee` payment row. */
  listPendingJoiningFees(): Promise<
    { user: User; payment: Payment | null }[]
  >;
  /** Admin approves a joining-fee request: flips `joining_fee_paid` true and
   *  `joining_fee_status` to `approved`, marks the pending payment approved. */
  approveJoiningFee(user_id: string): Promise<{ user: User; payment: Payment | null }>;
  /** Admin rejects a joining-fee request: sets `joining_fee_status` to
   *  `rejected`, marks the pending payment rejected (no wallet change). */
  rejectJoiningFee(
    user_id: string,
    reason?: string
  ): Promise<{ user: User; payment: Payment | null }>;

  getStats(): Promise<AdminStats>;
  approveWithdrawal(payment_id: string): Promise<Payment>;
  rejectWithdrawal(payment_id: string): Promise<Payment>;
  listPayments(filter?: {
    user_id?: string;
    type?: Payment["type"];
    status?: Payment["status"];
  }): Promise<Payment[]>;
}

export type { SafeUser };
