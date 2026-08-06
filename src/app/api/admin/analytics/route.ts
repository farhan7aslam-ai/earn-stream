import { store, requireAdmin, json } from "@/lib/api";

/** GET — fetch 30-day dashboard analytics. */
export async function GET() {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const analytics = await store.getDashboardAnalytics();
  return json({ analytics });
}
