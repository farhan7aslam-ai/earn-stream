import { store, requireAdmin, json } from "@/lib/api";

export async function GET() {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const stats = await store.getStats();
  return json({ stats });
}
