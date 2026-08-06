import { store, requireAdmin, json } from "@/lib/api";

/** GET — fetch system health (db + storage + counts). */
export async function GET() {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const health = await store.getSystemHealth();
  return json({ health });
}
