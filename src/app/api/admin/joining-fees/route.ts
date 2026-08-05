import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";

/** GET — list pending joining-fee verification requests. */
export async function GET() {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const requests = await store.listPendingJoiningFees();
  // strip password_hash from each user
  const safe = requests.map(({ user, payment }) => {
    const { password_hash: _ph, ...safeUser } = user;
    return { user: safeUser, payment };
  });
  return json({ requests: safe });
}

/** POST — approve or reject a joining-fee request. */
export async function POST(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const { user_id, action, reason } = await req.json().catch(() => ({}));
  if (!user_id) return error("user_id required", 422);
  if (action !== "approve" && action !== "reject")
    return error("action must be 'approve' or 'reject'", 422);

  try {
    if (action === "approve") {
      const { user, payment } = await store.approveJoiningFee(String(user_id));
      const { password_hash: _ph, ...safe } = user;
      return json({ user: safe, payment });
    }
    const { user, payment } = await store.rejectJoiningFee(
      String(user_id),
      reason
    );
    const { password_hash: _ph, ...safe } = user;
    return json({ user: safe, payment });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Action failed",
      400
    );
  }
}
