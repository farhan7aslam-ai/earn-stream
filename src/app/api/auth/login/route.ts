import { NextRequest } from "next/server";
import { store, error, json, sanitize, isValidEmail } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth";
import { enforceSubscription } from "@/lib/auth";
import { verifyPassword, hashPassword } from "@/lib/password";
import { toSafeUser } from "@/lib/types";

// In-memory failed login tracking (per email + IP).
// For multi-instance production, use Upstash Redis.
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

function getLockKey(email: string, ip: string): string {
  return `${email.toLowerCase()}:${ip}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return error("Email and password are required", 422, "VALIDATION_ERROR");
  }

  if (!isValidEmail(email)) {
    return error("Please enter a valid email address", 422, "VALIDATION_ERROR");
  }

  // Get client IP for brute-force tracking
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const lockKey = getLockKey(email, ip);
  const lockEntry = failedAttempts.get(lockKey);

  // Check if account is temporarily locked
  if (lockEntry && lockEntry.lockedUntil > Date.now()) {
    const remainingMs = lockEntry.lockedUntil - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    return error(
      `Too many failed attempts. Please try again in ${remainingMin} minute${remainingMin > 1 ? "s" : ""}.`,
      429,
      "ACCOUNT_LOCKED"
    );
  }

  // Clear expired lock
  if (lockEntry && lockEntry.lockedUntil <= Date.now()) {
    failedAttempts.delete(lockKey);
  }

  const user = await store.getUserByEmail(email);
  if (!user) {
    // Don't reveal whether the email exists — generic error
    recordFailedAttempt(lockKey);
    return error("Invalid email or password", 401, "AUTH_FAILED");
  }

  // Verify password (supports legacy seed: prefix)
  let valid = verifyPassword(password, user.password_hash);
  if (!valid && user.password_hash.startsWith("seed:")) {
    if (password === user.password_hash.slice(5)) {
      valid = true;
      // Upgrade to proper scrypt hash
      try {
        await store.updateUser(user.id, {
          password_hash: hashPassword(password),
        });
      } catch {
        /* non-fatal */
      }
    }
  }

  if (!valid) {
    recordFailedAttempt(lockKey);
    return error("Invalid email or password", 401, "AUTH_FAILED");
  }

  // Check if banned
  if (user.is_banned) {
    return error(
      "Your account has been banned. Contact support.",
      403,
      "ACCOUNT_BANNED"
    );
  }

  // Clear failed attempts on successful login
  failedAttempts.delete(lockKey);

  // Enforce monthly subscription suspension
  const enforced = await enforceSubscription(user);

  // Update last login tracking
  const device = req.headers.get("user-agent") ?? "unknown";
  try {
    await store.updateUser(user.id, {
      last_login_at: new Date().toISOString(),
      last_ip: ip,
      last_device: device.slice(0, 500),
    });
  } catch {
    /* non-fatal */
  }

  // Log to audit
  try {
    await store.logAudit({
      admin_id: user.id,
      action: "user_login",
      entity_type: "auth",
      entity_id: user.id,
      ip_address: ip,
      user_agent: device,
    });
  } catch {
    /* non-fatal */
  }

  const session = await store.createSession(user.id);
  await setSessionCookie(session.token);

  return json({ user: toSafeUser(enforced) });
}

function recordFailedAttempt(key: string) {
  const entry = failedAttempts.get(key) ?? { count: 0, lockedUntil: 0 };
  entry.count++;
  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCK_DURATION_MS;
  }
  failedAttempts.set(key, entry);
}
