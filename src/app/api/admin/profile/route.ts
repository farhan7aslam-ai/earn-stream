import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";
import { toSafeUser } from "@/lib/types";
import { setSessionCookie } from "@/lib/auth";

/**
 * Securely updates the master admin's email and/or password.
 * Requires `currentPassword` to be verified before applying any change.
 * After a successful update a fresh session is issued so the admin stays
 * logged in with the new identity.
 */
export async function POST(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;

  const { email, newPassword, currentPassword } = await req
    .json()
    .catch(() => ({}));

  if (!currentPassword || typeof currentPassword !== "string") {
    return error("Current password is required to apply changes", 422);
  }
  if (!email && !newPassword) {
    return error("Provide a new email or new password to update", 422);
  }

  try {
    const updated = await store.updateAdminCredentials(r.user.id, {
      email: email || undefined,
      newPassword: newPassword || undefined,
      currentPassword,
    });

    // Issue a fresh session token so the admin stays logged in.
    const session = await store.createSession(updated.id);
    await setSessionCookie(session.token);

    return json({ user: toSafeUser(updated) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Credential update failed",
      400
    );
  }
}
