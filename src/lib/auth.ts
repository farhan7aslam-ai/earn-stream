import { cookies } from "next/headers";
import { store } from "./data";
import { toSafeUser, type SafeUser, type User } from "./types";

export const SESSION_COOKIE = "es_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function normalizeRole(role: unknown): string {
  return typeof role === "string" ? role.trim().toLowerCase() : "";
}

/** Returns the current user (safe, no password hash) or null. */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await store.getSession(token);
  if (!session) return null;
  const user = await store.getUserById(session.user_id);
  if (!user) return null;
  return toSafeUser(user);
}

/** Returns the raw user record (with password hash) — server-side only. */
export async function getCurrentRawUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await store.getSession(token);
  if (!session) return null;
  return store.getUserById(session.user_id);
}

export async function setSessionCookie(token: string) {
  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Enforces the monthly subscription rule. If the user's subscription has
 * expired and they have no active subscription, mark them suspended.
 * Returns the (possibly updated) safe user.
 */
export async function enforceSubscription(user: User): Promise<User> {
  if (user.role === "admin") return user;
  if (user.is_banned) return user;
  if (!user.subscription_end_date) return user; // never subscribed (e.g. hasn't paid yet)
  const expired = new Date(user.subscription_end_date).getTime() < Date.now();
  if (expired && !user.is_suspended) {
    return store.updateUser(user.id, { is_suspended: true });
  }
  return user;
}

export function isAdmin(user: SafeUser | null): boolean {
  if (!user) return false;
  return normalizeRole(user.role) === "admin";
}
