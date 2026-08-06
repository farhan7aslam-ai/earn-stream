import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";

/** GET — list task submissions (with optional status/task_id filter). */
export async function GET(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const task_id = url.searchParams.get("task_id") ?? undefined;
  const limit = url.searchParams.get("limit")
    ? Number(url.searchParams.get("limit"))
    : undefined;
  const submissions = await store.listTaskSubmissions({
    status: status as never,
    task_id,
    limit,
  });
  return json({ submissions });
}

/** POST — approve or reject a task submission.
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
      const { submission, payment } = await store.approveTaskSubmission(
        String(submission_id),
        r.user.id
      );
      await store.logAudit({
        admin_id: r.user.id,
        action: "approve_task_submission",
        entity_type: "task_submission",
        entity_id: String(submission_id),
        new_value: submission,
        ip_address: req.headers.get("x-forwarded-for"),
        user_agent: req.headers.get("user-agent"),
      });
      return json({ submission, payment });
    }
    const submission = await store.rejectTaskSubmission(
      String(submission_id),
      r.user.id,
      reason ? String(reason) : undefined
    );
    await store.logAudit({
      admin_id: r.user.id,
      action: "reject_task_submission",
      entity_type: "task_submission",
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
