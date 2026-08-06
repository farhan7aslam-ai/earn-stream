import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";

/** GET — list wallet ledger for a user (admin view).
 *  Query: ?user_id=<id>&limit=<n>
 */
export async function GET(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const url = new URL(req.url);
  const user_id = url.searchParams.get("user_id");
  if (!user_id) return error("user_id is required", 422);
  const limit = url.searchParams.get("limit")
    ? Number(url.searchParams.get("limit"))
    : 100;
  const entries = await store.listWalletLedger(user_id, limit);
  return json({ entries });
}

/** POST — record a manual wallet transaction (admin credit/debit).
 *  Body: { user_id, credit?, debit?, reference_type?, reference_id?, description? }
 */
export async function POST(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const body = await req.json().catch(() => ({}));
  const { user_id, credit, debit, reference_type, reference_id, description } = body;
  if (!user_id) return error("user_id is required", 422);
  const c = credit !== undefined ? Number(credit) : 0;
  const d = debit !== undefined ? Number(debit) : 0;
  if (!Number.isFinite(c) || c < 0) return error("Invalid credit", 422);
  if (!Number.isFinite(d) || d < 0) return error("Invalid debit", 422);
  if (c === 0 && d === 0) return error("Either credit or debit must be > 0", 422);

  try {
    const entry = await store.recordWalletTransaction({
      user_id: String(user_id),
      credit: c,
      debit: d,
      reference_type: reference_type ? String(reference_type) : "admin_adjustment",
      reference_id: reference_id ? String(reference_id) : null,
      description: description ? String(description) : "Manual adjustment",
      admin_id: r.user.id,
    });
    await store.logAudit({
      admin_id: r.user.id,
      action: d > 0 ? "wallet_debit" : "wallet_credit",
      entity_type: "wallet_ledger",
      entity_id: entry.id,
      new_value: entry,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ entry }, { status: 201 });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Transaction failed", 400);
  }
}
