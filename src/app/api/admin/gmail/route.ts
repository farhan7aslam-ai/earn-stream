import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";

/** GET — list gmail submissions (with optional status filter). */
export async function GET(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const limit = url.searchParams.get("limit")
    ? Number(url.searchParams.get("limit"))
    : undefined;
  const submissions = await store.listGmailSubmissions({
    status: status as never,
    limit,
  });
  return json({ submissions });
}

/** POST — approve or reject a gmail submission.
 *  Body: { submission_id, action: 'approve'|'reject', reason? }
 */
export async function POST(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const { submission_id, action, reason } = await req.json().catch(() => ({}));
  if (!submission_id) return error("submission_id is required", 422);
  if (action !== "approve" && action !== "reject")
    return error("action must be 'approve' or 'reject'", 422);

  try {
    if (action === "approve") {
      const { submission, payment } = await store.approveGmail(
        String(submission_id),
        r.user.id
      );
      await store.logAudit({
        admin_id: r.user.id,
        action: "approve_gmail",
        entity_type: "gmail_submission",
        entity_id: String(submission_id),
        new_value: submission,
        ip_address: req.headers.get("x-forwarded-for"),
        user_agent: req.headers.get("user-agent"),
      });
      return json({ submission, payment });
    }
    const submission = await store.rejectGmail(
      String(submission_id),
      r.user.id,
      reason ? String(reason) : undefined
    );
    await store.logAudit({
      admin_id: r.user.id,
      action: "reject_gmail",
      entity_type: "gmail_submission",
      entity_id: String(submission_id),
      new_value: submission,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ submission });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Action failed", 400);
  }
}

/** DELETE — soft-delete a gmail submission by id (query param `id`).
 *  Used by the bulk-delete flow. */
export async function DELETE(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return error("id query param is required", 422);
  try {
    await store.deleteGmailSubmission(String(id));
    await store.logAudit({
      admin_id: r.user.id,
      action: "delete_gmail_submission",
      entity_type: "gmail_submission",
      entity_id: String(id),
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ ok: true });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Delete failed", 400);
  }
}
