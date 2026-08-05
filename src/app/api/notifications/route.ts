import { NextRequest } from "next/server";
import { store, requireUser, json } from "@/lib/api";

export async function GET() {
  const r = await requireUser();
  if (!r.ok) return r.res;
  const notifications = await store.listNotifications(r.user.id);
  return json({ notifications });
}

export async function PATCH(req: NextRequest) {
  const r = await requireUser();
  if (!r.ok) return r.res;
  const { action, id } = await req.json().catch(() => ({}));
  if (action === "mark_all_read") {
    await store.markAllNotificationsRead(r.user.id);
    return json({ ok: true });
  }
  if (action === "mark_read" && id) {
    await store.markNotificationRead(String(id));
    return json({ ok: true });
  }
  return json({ ok: true });
}
