import { NextRequest } from "next/server";
import { store, requireUser, error, json } from "@/lib/api";
import { uploadPaymentScreenshot } from "@/lib/supabase/storage";
import type { PaymentMethod } from "@/lib/types";

const METHODS: PaymentMethod[] = ["easypaisa", "jazzcash", "binance"];

export const runtime = "nodejs";

/**
 * Joining-fee submission.
 *
 * SECURITY MODEL — no client-side auto-activation:
 *  - Accepts multipart/form-data with: method, account, screenshot (file).
 *  - Uploads the screenshot to the `payment-screenshots` Supabase Storage
 *    bucket (falls back to a data URL if storage is unavailable).
 *  - Sets `users.joining_fee_status = 'pending_approval'` and leaves
 *    `joining_fee_paid = false`. A `payments` row with status `pending` is
 *    created. Tasks / withdrawals remain server-locked until an admin
 *    approves via `/api/admin/joining-fees`.
 */
export async function POST(req: NextRequest) {
  const r = await requireUser();
  if (!r.ok) return r.res;

  // Already approved? short-circuit.
  if (r.user.joining_fee_paid) {
    return json({ ok: true, already_paid: true, user: r.user });
  }
  // Already pending? reject duplicate submission until admin acts.
  if (r.user.joining_fee_status === "pending_approval") {
    return error(
      "Your joining fee is already pending admin approval. Please wait for verification.",
      409
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) return error("Multipart form data required", 422);

  const method = String(form.get("method") ?? "");
  const account = String(form.get("account") ?? "").trim();
  const file = form.get("screenshot");

  if (!METHODS.includes(method as PaymentMethod))
    return error("Invalid payment method", 422);
  if (account.length < 4)
    return error("Enter a valid account number / ID", 422);
  if (!(file instanceof File))
    return error("A payment screenshot is required", 422);

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

  const settings = await store.getSettings();
  const fee = settings.joining_fee;

  try {
    const { user, payment } = await store.requestJoiningFee(
      r.user.id,
      method as PaymentMethod,
      account,
      screenshotUrl,
      fee
    );
    // Notify the user their submission is pending — NOT a success message.
    await store.pushNotification({
      user_id: r.user.id,
      title: "Joining Fee Submitted",
      body: `Your payment screenshot was uploaded and is now pending admin verification. You'll be notified once approved.`,
      type: "info",
    });
    return json({ ok: true, user, payment, pending: true });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Submission failed",
      400
    );
  }
}
