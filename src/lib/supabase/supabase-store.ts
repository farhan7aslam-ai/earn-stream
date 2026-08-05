import { createServerClient } from "./server";
import { generateId, generateReferralCode, generateToken, hashPassword, verifyPassword } from "../password";
import type { Store } from "../store";
import type {
  AdminStats,
  Notification,
  NotificationType,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  PlatformSettings,
  Referral,
  Session,
  TaskAttempt,
  TaskRow,
  TaskStatus,
  TaskType,
  User,
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
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v: unknown): number =>
  v === null || v === undefined ? 0 : Number(v);

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
    created_at: String(r.created_at ?? new Date().toISOString()),
  };
}

function mapSettings(r: Record<string, unknown>): PlatformSettings {
  const defs = DEFAULT_SETTINGS as Record<string, unknown>;
  const get = (k: string, fallback: unknown) =>
    r[k] === null || r[k] === undefined ? fallback : r[k];
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
      .in("type", ["subscription", "joining_fee", "withdrawal"]);
    const allPays = (pays ?? []).map((d) => mapPayment(d as Record<string, unknown>));
    const pendingTasks: number = (
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
      total_balance_owed: round2(allUsers.reduce((s, u) => s + u.balance, 0)),
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
};

export type { PaymentMethod, TaskStatus };
