import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";
import { hashPassword } from "@/lib/password";

export async function GET(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const { id } = Object.fromEntries(new URL(req.url).searchParams);
  if (!id) return error("User id required", 422);
  const user = await store.getUserById(id);
  if (!user) return error("User not found", 404);
  const { password_hash: _ph, ...safe } = user;
  const activity = await store.getUserActivity(id);
  return json({ user: safe, activity });
}

export async function PATCH(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const body = await req.json().catch(() => ({}));
  const { id, ...patch } = body;
  if (!id) return error("User id required", 422);

  const NUMERIC = ["balance", "pending_earnings", "total_earned", "total_withdrawn"];
  const BOOLEAN = ["joining_fee_paid", "is_banned", "is_suspended"];
  const STRING = [
    "subscription_end_date",
    "role",
    "full_name",
    "phone",
    "email",
    "referred_by",
    "avatar_url",
    "country",
    "timezone",
    "language",
    "last_login_at",
    "last_ip",
    "last_device",
  ];
  const NULLABLE_NUMBER = ["custom_referral_bonus_percent"];

  const clean: Record<string, unknown> = {};
  for (const k of Object.keys(patch)) {
    if (NUMERIC.includes(k)) {
      clean[k] = Number(patch[k]);
    } else if (BOOLEAN.includes(k)) {
      clean[k] = Boolean(patch[k]);
    } else if (NULLABLE_NUMBER.includes(k)) {
      const v = patch[k];
      clean[k] = v === null || v === "" || v === undefined ? null : Number(v);
    } else if (STRING.includes(k)) {
      clean[k] = String(patch[k]);
    } else if (k === "password") {
      const pw = String(patch[k]);
      if (pw.length < 6) return error("Password must be at least 6 characters", 422);
      clean.password_hash = hashPassword(pw);
    }
  }
  if (Object.keys(clean).length === 0)
    return error("No valid fields to update", 422);

  // email uniqueness check (local + supabase both enforce, but double-check)
  if (clean.email !== undefined) {
    const existing = await store.getUserByEmail(String(clean.email));
    if (existing && existing.id !== id)
      return error("That email is already in use", 409);
  }

  try {
    const updated = await store.updateUser(id, clean);
    const { password_hash: _ph, ...safe } = updated;
    return json({ user: safe });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Update failed", 400);
  }
}
