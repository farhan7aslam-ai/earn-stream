import { NextResponse } from "next/server";
import { getCurrentUser, getCurrentRawUser } from "./auth";
import { store } from "./data";
import { enforceSubscription } from "./auth";
import { toSafeUser } from "./types";
import type { SafeUser } from "./types";

export { store };

export async function json(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Returns the current safe user or 401. */
export async function requireUser(): Promise<
  { ok: true; user: SafeUser } | { ok: false; res: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, res: error("Unauthorized", 401) };
  return { ok: true, user };
}

/** Returns the current admin or 403. */
export async function requireAdmin(): Promise<
  { ok: true; user: SafeUser } | { ok: false; res: NextResponse }
> {
  const r = await requireUser();
  if (!r.ok) return r;
  if (r.user.role !== "admin")
    return { ok: false, res: error("Forbidden", 403) };
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
