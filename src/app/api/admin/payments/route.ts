import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";

export async function GET(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const sp = new URL(req.url).searchParams;
  const filter: { type?: "withdrawal" | "subscription" | "joining_fee"; status?: "pending" | "approved" | "rejected" | "paid" | "cancelled" } = {};
  const type = sp.get("type");
  if (type) filter.type = type as "withdrawal";
  const status = sp.get("status");
  if (status) filter.status = status as "pending" | "approved" | "rejected" | "paid" | "cancelled";
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
    if (action === "mark_paid") {
      const p = await store.markPaidWithdrawal(String(id));
      await store.logAudit({
        admin_id: r.user.id,
        action: "mark_paid_withdrawal",
        entity_type: "payment",
        entity_id: String(id),
        new_value: p,
        ip_address: req.headers.get("x-forwarded-for"),
        user_agent: req.headers.get("user-agent"),
      });
      return json({ payment: p });
    }
    if (action === "cancel") {
      const p = await store.cancelWithdrawal(String(id));
      await store.logAudit({
        admin_id: r.user.id,
        action: "cancel_withdrawal",
        entity_type: "payment",
        entity_id: String(id),
        new_value: p,
        ip_address: req.headers.get("x-forwarded-for"),
        user_agent: req.headers.get("user-agent"),
      });
      return json({ payment: p });
    }
    return error("Unknown action", 422);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Action failed", 400);
  }
}
