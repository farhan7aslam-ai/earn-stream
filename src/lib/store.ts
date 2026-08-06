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
  NotificationType,
  NotificationQueueEntry,
  Payment,
  PlatformSettings,
  Referral,
  SafeUser,
  Session,
  SystemHealth,
  TaskAttempt,
  TaskRow,
  TaskSubmission,
  TaskType,
  TikTokTask,
  User,
  WalletLedgerEntry,
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
        | "avatar_url"
        | "country"
        | "timezone"
        | "language"
        | "last_login_at"
        | "last_ip"
        | "last_device"
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
  /** Mark an approved withdrawal as paid out (final state). */
  markPaidWithdrawal(payment_id: string): Promise<Payment>;
  /** Cancel a withdrawal — sets status to 'cancelled' and refunds the amount
   *  back to the user's balance. Allowed from pending or approved states. */
  cancelWithdrawal(payment_id: string): Promise<Payment>;
  listPayments(filter?: {
    user_id?: string;
    type?: Payment["type"];
    status?: Payment["status"];
  }): Promise<Payment[]>;

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — TikTok Task CMS
  // ════════════════════════════════════════════════════════════════
  createTask(input: {
    title: string;
    description?: string;
    tiktok_username?: string;
    tiktok_video_url?: string;
    task_type: TikTokTask["task_type"];
    reward_per_user?: number;
    max_participants?: number;
    expiry_date?: string | null;
    priority?: number;
    instructions?: string;
    comment_text?: string | null;
    created_by?: string | null;
  }): Promise<TikTokTask>;
  listTasksCMS(filter?: {
    status?: TikTokTask["status"];
    limit?: number;
    offset?: number;
  }): Promise<TikTokTask[]>;
  getTaskCMS(id: string): Promise<TikTokTask | null>;
  updateTask(
    id: string,
    patch: Partial<Omit<TikTokTask, "id" | "created_at" | "updated_at">>
  ): Promise<TikTokTask>;
  deleteTask(id: string): Promise<void>;
  submitTaskCMS(
    user_id: string,
    task_id: string,
    screenshot_url: string,
    meta?: { device?: string | null; browser?: string | null; ip_address?: string | null }
  ): Promise<TaskSubmission>;
  listUserTaskSubmissions(user_id: string): Promise<TaskSubmission[]>;
  listTaskSubmissions(filter?: {
    status?: TaskSubmission["status"];
    task_id?: string;
    limit?: number;
  }): Promise<TaskSubmission[]>;
  approveTaskSubmission(
    submission_id: string,
    admin_id: string
  ): Promise<{ submission: TaskSubmission; payment: Payment }>;
  rejectTaskSubmission(
    submission_id: string,
    admin_id: string,
    reason?: string
  ): Promise<TaskSubmission>;

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Gmail submissions
  // ════════════════════════════════════════════════════════════════
  submitGmail(input: {
    user_id: string;
    gmail_address: string;
    recovery_email?: string | null;
    recovery_phone?: string | null;
    country?: string | null;
    creation_date?: string | null;
    campaign_id?: string | null;
    screenshot_url?: string | null;
  }): Promise<GmailSubmission>;
  listUserGmail(user_id: string): Promise<GmailSubmission[]>;
  listGmailSubmissions(filter?: {
    status?: GmailSubmission["status"];
    limit?: number;
  }): Promise<GmailSubmission[]>;
  approveGmail(
    submission_id: string,
    admin_id: string
  ): Promise<{ submission: GmailSubmission; payment: Payment }>;
  rejectGmail(
    submission_id: string,
    admin_id: string,
    reason?: string
  ): Promise<GmailSubmission>;
  /** Soft-delete a gmail submission (sets deleted_at, status='cancelled'). */
  deleteGmailSubmission(submission_id: string): Promise<void>;

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Gmail Campaigns
  // ════════════════════════════════════════════════════════════════
  createGmailCampaign(input: {
    name: string;
    description?: string;
    reward?: number;
    daily_limit?: number;
    start_date?: string | null;
    end_date?: string | null;
    status?: GmailCampaign["status"];
    rules?: string;
    created_by?: string | null;
  }): Promise<GmailCampaign>;
  listGmailCampaigns(): Promise<GmailCampaign[]>;
  listActiveGmailCampaigns(): Promise<GmailCampaign[]>;
  updateGmailCampaign(
    id: string,
    patch: Partial<Omit<GmailCampaign, "id" | "created_at" | "updated_at">>
  ): Promise<GmailCampaign>;
  deleteGmailCampaign(id: string): Promise<void>;

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Audit Log
  // ════════════════════════════════════════════════════════════════
  logAudit(input: {
    admin_id: string;
    action: string;
    entity_type: string;
    entity_id?: string | null;
    old_value?: unknown;
    new_value?: unknown;
    ip_address?: string | null;
    user_agent?: string | null;
  }): Promise<void>;
  listAuditLogs(limit?: number, offset?: number): Promise<AuditLog[]>;

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Announcements
  // ════════════════════════════════════════════════════════════════
  createAnnouncement(input: {
    title: string;
    body?: string;
    type?: Announcement["type"];
    is_active?: boolean;
    image_url?: string | null;
    priority?: number;
    publish_date?: string | null;
    expiry_date?: string | null;
    visible_to?: Announcement["visible_to"];
    created_by?: string | null;
  }): Promise<Announcement>;
  listActiveAnnouncements(): Promise<Announcement[]>;
  listAllAnnouncements(): Promise<Announcement[]>;
  toggleAnnouncement(id: string, is_active: boolean): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<void>;

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Wallet Ledger
  // ════════════════════════════════════════════════════════════════
  recordWalletTransaction(input: {
    user_id: string;
    credit?: number;
    debit?: number;
    reference_type?: string;
    reference_id?: string | null;
    description?: string;
    admin_id?: string | null;
  }): Promise<WalletLedgerEntry>;
  listWalletLedger(user_id: string, limit?: number): Promise<WalletLedgerEntry[]>;

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Login Sessions
  // ════════════════════════════════════════════════════════════════
  listLoginSessions(user_id?: string): Promise<LoginSession[]>;
  revokeSession(id: string): Promise<void>;

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Blocked IPs
  // ════════════════════════════════════════════════════════════════
  listBlockedIPs(): Promise<BlockedIP[]>;
  blockIP(ip: string, reason: string, blocked_by: string): Promise<BlockedIP>;
  unblockIP(id: string): Promise<void>;

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Notifications broadcast queue
  // ════════════════════════════════════════════════════════════════
  sendNotification(input: {
    title: string;
    body: string;
    type: NotificationType;
    target_type: NotificationQueueEntry["target_type"];
    target_data?: unknown;
    user_id?: string | null;
    sent_by: string;
  }): Promise<NotificationQueueEntry>;
  listNotificationQueue(): Promise<NotificationQueueEntry[]>;

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — CMS Content
  // ════════════════════════════════════════════════════════════════
  listCmsContent(): Promise<CmsContent[]>;
  getCmsContent(key: string): Promise<CmsContent | null>;
  updateCmsContent(
    key: string,
    patch: {
      title?: string;
      body?: string;
      is_published?: boolean;
      updated_by: string;
    }
  ): Promise<CmsContent>;

  // ════════════════════════════════════════════════════════════════
  // ENTERPRISE — Analytics + System Health
  // ════════════════════════════════════════════════════════════════
  getDashboardAnalytics(): Promise<DashboardAnalytics>;
  getSystemHealth(): Promise<SystemHealth>;
}

export type { SafeUser };
