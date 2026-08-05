import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";

export async function GET(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const sp = new URL(req.url).searchParams;
  const filter: { type?: "withdrawal" | "subscription" | "joining_fee"; status?: "pending" | "approved" | "rejected" } = {};
  const type = sp.get("type");
  if (type) filter.type = type as "withdrawal";
  const status = sp.get("status");
  if (status) filter.status = status as "pending" | "approved" | "rejected";
  const payments = await store.listPayments(filter);
  return json({ payments });
}

export async function POST(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const { id, action } = await req.json().catch(() => ({}));
  if (!id || !action) return error("id and action required", 422);
  try {
    if (action === "approve") {
      const p = await store.approveWithdrawal(String(id));
      return json({ payment: p });
    }
    if (action === "reject") {
      const p = await store.rejectWithdrawal(String(id));
      return json({ payment: p });
    }
    return error("Unknown action", 422);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Action failed", 400);
  }
}
