import { NextRequest } from "next/server";
import { store, requireUser, error, json } from "@/lib/api";
import { uploadPaymentScreenshot } from "@/lib/supabase/storage";

export const runtime = "nodejs";

/** GET — list the current user's gmail submissions. */
export async function GET() {
  const r = await requireUser();
  if (!r.ok) return r.res;
  const submissions = await store.listUserGmail(r.user.id);
  return json({ submissions });
}

/** POST — submit a gmail account for review.
 *  Accepts multipart/form-data when screenshot is required, otherwise JSON.
 */
export async function POST(req: NextRequest) {
  const r = await requireUser();
  if (!r.ok) return r.res;

  if (r.user.is_suspended)
    return error("Your subscription has expired. Please renew to continue.", 403);
  if (!r.user.joining_fee_paid)
    return error("Please pay the joining fee to submit gmails.", 403);

  const settings = await store.getSettings();

  // Check if Gmail module is enabled
  if (!settings.gmail_module_enabled)
    return error("Gmail selling module is currently disabled.", 403);

  // Check if submissions are open
  if (!settings.gmail_submission_enabled)
    return error("Gmail submissions are temporarily closed.", 403);

  // Parse body — could be JSON or multipart (when screenshot required)
  let gmail_address = "";
  let recovery_email: string | null = null;
  let recovery_phone: string | null = null;
  let country: string | null = null;
  let creation_date: string | null = null;
  let campaign_id: string | null = null;
  let screenshot_url: string | null = null;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (!form) return error("Invalid form data", 422);
    gmail_address = String(form.get("gmail_address") ?? "").trim().toLowerCase();
    recovery_email = form.get("recovery_email") ? String(form.get("recovery_email")) : null;
    recovery_phone = form.get("recovery_phone") ? String(form.get("recovery_phone")) : null;
    country = form.get("country") ? String(form.get("country")) : null;
    creation_date = form.get("creation_date") ? String(form.get("creation_date")) : null;
    campaign_id = form.get("campaign_id") ? String(form.get("campaign_id")) : null;

    // Screenshot upload if required
    if (settings.gmail_screenshot_required) {
      const file = form.get("screenshot");
      if (!(file instanceof File))
        return error("A screenshot is required for Gmail submissions.", 422);
      if (!/image\/(png|jpe?g|webp)/.test(file.type))
        return error("Screenshot must be PNG, JPG, or WEBP.", 422);
      if (file.size > 4.5 * 1024 * 1024)
        return error("Screenshot must be under 4.5MB.", 422);
      try {
        const up = await uploadPaymentScreenshot(
          await file.arrayBuffer(),
          file.type || "image/png",
          r.user.id
        );
        screenshot_url = up.url;
      } catch (e) {
        return error(e instanceof Error ? e.message : "Screenshot upload failed", 422);
      }
    }
  } else {
    const body = await req.json().catch(() => ({}));
    gmail_address = String(body.gmail_address ?? "").trim().toLowerCase();
    recovery_email = body.recovery_email ? String(body.recovery_email) : null;
    recovery_phone = body.recovery_phone ? String(body.recovery_phone) : null;
    country = body.country ? String(body.country) : null;
    creation_date = body.creation_date ? String(body.creation_date) : null;
    campaign_id = body.campaign_id ? String(body.campaign_id) : null;

    if (settings.gmail_screenshot_required)
      return error("Screenshot is required. Please submit via multipart form data.", 422);
  }

  // Gmail format validation
  if (!gmail_address || !/^[^@\s]+@gmail\.com$/i.test(gmail_address))
    return error("A valid @gmail.com address is required", 422);

  // Daily limit check
  if (settings.gmail_daily_limit_per_user > 0) {
    const userSubs = await store.listUserGmail(r.user.id);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = userSubs.filter(
      (s) => new Date(s.created_at) >= todayStart
    ).length;
    if (todayCount >= settings.gmail_daily_limit_per_user)
      return error(
        `Daily Gmail submission limit (${settings.gmail_daily_limit_per_user}) reached. Please try again tomorrow.`,
        429
      );
  }

  try {
    const submission = await store.submitGmail({
      user_id: r.user.id,
      gmail_address,
      recovery_email,
      recovery_phone,
      country,
      creation_date,
      campaign_id,
      screenshot_url,
    });

    // Auto-approve if enabled
    if (settings.gmail_auto_approve) {
      try {
        await store.approveGmail(submission.id, r.user.id);
      } catch {
        /* non-fatal — admin can manually approve */
      }
    }

    // Push notification
    await store.pushNotification({
      user_id: r.user.id,
      title: "Gmail Submitted",
      body: `Your Gmail submission (${gmail_address}) is ${settings.gmail_auto_approve ? "approved" : "pending admin review"}.`,
      type: settings.gmail_auto_approve ? "success" : "info",
    });

    return json({ submission }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Submission failed";
    if (msg.includes("duplicate") || msg.includes("already"))
      return error("This Gmail address has already been submitted.", 409);
    return error(msg, 400);
  }
}
