import { NextRequest } from "next/server";
import { store, requireAdmin, json } from "@/lib/api";

/** GET — list audit logs (with optional limit/offset). */
export async function GET(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const url = new URL(req.url);
  const limit = url.searchParams.get("limit")
    ? Number(url.searchParams.get("limit"))
    : 100;
  const offset = url.searchParams.get("offset")
    ? Number(url.searchParams.get("offset"))
    : 0;
  const logs = await store.listAuditLogs(limit, offset);
  return json({ logs });
}
