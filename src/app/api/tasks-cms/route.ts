import { NextRequest } from "next/server";
import { store, requireUser, error, json } from "@/lib/api";
import { uploadPaymentScreenshot } from "@/lib/supabase/storage";

export const runtime = "nodejs";

/** GET — list active TikTok tasks for the user dashboard. */
export async function GET() {
  const r = await requireUser();
  if (!r.ok) return r.res;
  const tasks = await store.listTasksCMS({ status: "active", limit: 100 });
  return json({ tasks });
}

/** POST — submit a screenshot for a task.
 *  Multipart form: { task_id, screenshot (file) }
 *  Enforces joining-fee paid + subscription active.
 */
export async function POST(req: NextRequest) {
  const r = await requireUser();
  if (!r.ok) return r.res;

  if (r.user.is_suspended)
    return error("Your subscription has expired. Please renew to continue.", 403);
  if (!r.user.joining_fee_paid)
    return error("Please pay the joining fee to submit tasks.", 403);

  const form = await req.formData().catch(() => null);
  if (!form) return error("Multipart form data required", 422);

  const task_id = String(form.get("task_id") ?? "").trim();
  const file = form.get("screenshot");
  if (!task_id) return error("task_id is required", 422);
  if (!(file instanceof File)) return error("A screenshot is required", 422);

  const arrayBuf = await file.arrayBuffer();
  let screenshotUrl: string;
  try {
    const up = await uploadPaymentScreenshot(
      arrayBuf,
      file.type || "image/png",
      r.user.id
    );
    screenshotUrl = up.url;
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Screenshot upload failed",
      422
    );
  }

  try {
    const submission = await store.submitTaskCMS(
      r.user.id,
      task_id,
      screenshotUrl,
      {
        device: req.headers.get("x-device") ?? null,
        browser: req.headers.get("user-agent") ?? null,
        ip_address: req.headers.get("x-forwarded-for") ?? null,
      }
    );
    return json({ submission }, { status: 201 });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Submission failed", 400);
  }
}
