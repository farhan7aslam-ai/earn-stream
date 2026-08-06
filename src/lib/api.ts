import { NextResponse } from "next/server";
import { getCurrentUser, getCurrentRawUser } from "./auth";
import { store } from "./data";
import { enforceSubscription } from "./auth";
import { toSafeUser } from "./types";
import type { SafeUser } from "./types";

export { store };

/** Success response wrapper. */
export async function json(body: unknown, init?: ResponseInit) {
  return NextResponse.json(
    { success: true, data: body, timestamp: new Date().toISOString() },
    init
  );
}

/** Structured error response. */
export function error(
  message: string,
  status = 400,
  errorCode?: string,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      message,
      error_code: errorCode ?? "ERROR",
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/** Sanitize string input to prevent XSS — strips HTML tags. */
export function sanitize(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/javascript:/gi, "") // strip javascript: URIs
    .replace(/on\w+=/gi, "") // strip on* event handlers
    .trim();
}

/** Validate and sanitize a UUID string. */
export function isValidUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/** Validate email format. */
export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/** Validate that a number is finite and non-negative. */
export function isValidAmount(n: unknown): n is number {
  const v = Number(n);
  return Number.isFinite(v) && v > 0;
}

/** Returns the current safe user or 401. Also checks banned/suspended status. */
export async function requireUser(): Promise<
  { ok: true; user: SafeUser } | { ok: false; res: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, res: error("Unauthorized", 401, "AUTH_REQUIRED") };

  // Check if banned
  if (user.is_banned) {
    return {
      ok: false,
      res: error("Your account has been banned. Contact support.", 403, "ACCOUNT_BANNED"),
    };
  }

  return { ok: true, user };
}

/** Returns the current admin or 403. Also verifies role server-side. */
export async function requireAdmin(): Promise<
  { ok: true; user: SafeUser } | { ok: false; res: NextResponse }
> {
  const r = await requireUser();
  if (!r.ok) return r;

  // Server-side role verification — never trust frontend
  if (r.user.role !== "admin") {
    return {
      ok: false,
      res: error("Forbidden — admin access required", 403, "FORBIDDEN"),
    };
  }

  return r;
}

/**
 * Requires the user to have joining fee paid + active subscription.
 * Use for task submissions, withdrawals, gmail submissions.
 */
export async function requireActiveUser(): Promise<
  { ok: true; user: SafeUser } | { ok: false; res: NextResponse }
> {
  const r = await requireUser();
  if (!r.ok) return r;

  if (r.user.role === "admin") return r; // admins bypass

  if (!r.user.joining_fee_paid) {
    return {
      ok: false,
      res: error("Please pay the joining fee to access this feature.", 403, "JOINING_FEE_REQUIRED"),
    };
  }

  if (r.user.is_suspended) {
    return {
      ok: false,
      res: error("Your subscription has expired. Please renew to continue.", 403, "SUBSCRIPTION_EXPIRED"),
    };
  }

  return r;
}

/**
 * Returns the current raw user with subscription enforced (auto-suspend on
 * expiry). Used by login + session bootstrap.
 */
export async function bootstrapCurrentUser() {
  const raw = await getCurrentRawUser();
  if (!raw) return null;
  const enforced = await enforceSubscription(raw);
  return toSafeUser(enforced);
}
