import { store, requireAdmin, json } from "@/lib/api";

/** GET — list the notification queue (most recent 200). */
export async function GET() {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const queue = await store.listNotificationQueue();
  return json({ queue });
}
