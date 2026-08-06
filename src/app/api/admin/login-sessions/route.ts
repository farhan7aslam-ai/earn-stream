import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";

/** GET — list login sessions (optionally filter by user_id). */
export async function GET(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const url = new URL(req.url);
  const user_id = url.searchParams.get("user_id") ?? undefined;
  const sessions = await store.listLoginSessions(user_id);
  return json({ sessions });
}

/** POST — revoke a login session.
 *  Body: { action: 'revoke', id }
 */
export async function POST(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const body = await req.json().catch(() => ({}));
  if (body.action !== "revoke") return error("action must be 'revoke'", 422);
  const id = String(body.id ?? "");
  if (!id) return error("id is required", 422);
  try {
    await store.revokeSession(id);
    await store.logAudit({
      admin_id: r.user.id,
      action: "revoke_session",
      entity_type: "login_session",
      entity_id: id,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ ok: true });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Revoke failed", 400);
  }
}
