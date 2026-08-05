import { NextRequest } from "next/server";
import { store } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth";
import { generateReferralCode, hashPassword } from "@/lib/password";
import { toSafeUser } from "@/lib/types";
import { error, json } from "@/lib/api";

export async function POST(req: NextRequest) {
  const {
    email,
    password,
    full_name,
    phone,
    referral_code,
  } = await req.json().catch(() => ({}));

  if (!email || !password || !full_name) {
    return error("Email, password and full name are required", 422);
  }
  if (password.length < 6) {
    return error("Password must be at least 6 characters", 422);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) {
    return error("Please enter a valid email address", 422);
  }

  // ----- monthly signup limit enforcement -----
  const settings = await store.getSettings();
  const limit = settings.monthly_signup_limit;
  if (limit && limit > 0) {
    const used = await store.countSignupsThisMonth();
    if (used >= limit) {
      return error(
        "SIGNUPS_CLOSED: Monthly signup limit reached. Please try again next month.",
        403
      );
    }
  }

  // ----- duplicate email -----
  const existing = await store.getUserByEmail(String(email).trim());
  if (existing) return error("An account with this email already exists", 409);

  // ----- referral resolution -----
  let referred_by: string | null = null;
  if (referral_code && String(referral_code).trim()) {
    const ref = await store.getUserByReferralCode(
      String(referral_code).trim()
    );
    if (!ref) return error("Invalid referral code", 422);
    referred_by = ref.id;
  }

  // SECURITY: admin role is NEVER granted via signup. The single master
  // admin account (adminasadullah@ceo.com) is seeded directly in the
  // database. Every signup is a regular user.
  const user = await store.createUser({
    email: String(email).trim(),
    password_hash: hashPassword(password),
    full_name: String(full_name).trim(),
    phone: String(phone ?? "").trim(),
    referral_code: generateReferralCode(),
    referred_by,
    role: "user",
  });

  // record referral row (bonus credited on first approved task)
  if (referred_by) {
    await store.createReferral(referred_by, user.id, 10);
  }

  // welcome notification
  await store.pushNotification({
    user_id: user.id,
    title: "Welcome to EarnStream",
    body: "Your account is ready. Pay the joining fee to unlock tasks and start earning.",
    type: "info",
  });

  const session = await store.createSession(user.id);
  await setSessionCookie(session.token);
  return json({ user: toSafeUser(user) });
}

// GET returns whether signups are currently open (used by the signup page
// to swap the form for the "Signups Closed" alert without a failed POST).
export async function GET() {
  const settings = await store.getSettings();
  const limit = settings.monthly_signup_limit;
  if (limit && limit > 0) {
    const used = await store.countSignupsThisMonth();
    return json({ open: used < limit, used, limit });
  }
  return json({ open: true, used: 0, limit: 0 });
}
