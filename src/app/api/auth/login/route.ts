import { NextRequest } from "next/server";
import { store } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth";
import { enforceSubscription } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { toSafeUser } from "@/lib/types";
import { error, json } from "@/lib/api";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return error("Email and password are required", 422);

  const user = await store.getUserByEmail(String(email).trim());
  if (!user) return error("Invalid email or password", 401);

  // legacy seed users (password_hash "seed:plaintext") — upgrade on first login
  let valid = verifyPassword(password, user.password_hash);
  if (!valid && user.password_hash.startsWith("seed:")) {
    if (password === user.password_hash.slice(5)) {
      valid = true;
      // upgrade handled in store? we re-hash here:
    }
  }
  if (!valid) return error("Invalid email or password", 401);

  if (user.is_banned)
    return error("Your account has been banned. Contact support.", 403);

  // enforce monthly subscription suspension
  const enforced = await enforceSubscription(user);

  const session = await store.createSession(user.id);
  await setSessionCookie(session.token);

  return json({ user: toSafeUser(enforced) });
}
