import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";
import type { NotificationQueueEntry, NotificationType } from "@/lib/types";

const VALID_TYPES: NotificationType[] = [
  "info",
  "success",
  "warning",
  "error",
  "payment",
  "task",
  "referral",
];

const VALID_TARGETS: NotificationQueueEntry["target_type"][] = [
  "all",
  "single",
  "multiple",
  "country",
  "subscription",
  "status",
];

/** POST — broadcast a notification.
 *  Body: { title, body, type, target_type, target_data?, user_id? }
 */
export async function POST(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const bodyText = String(body.body ?? "").trim();
  const type = (body.type ?? "info") as NotificationType;
  const target_type = (body.target_type ?? "all") as NotificationQueueEntry["target_type"];
  if (!title) return error("title is required", 422);
  if (!bodyText) return error("body is required", 422);
  if (!VALID_TYPES.includes(type)) return error("Invalid notification type", 422);
  if (!VALID_TARGETS.includes(target_type))
    return error("Invalid target_type", 422);
  if (target_type === "single" && !body.user_id)
    return error("user_id is required for single-target notifications", 422);

  try {
    const entry = await store.sendNotification({
      title,
      body: bodyText,
      type,
      target_type,
      target_data: body.target_data ?? null,
      user_id: body.user_id ? String(body.user_id) : null,
      sent_by: r.user.id,
    });
    await store.logAudit({
      admin_id: r.user.id,
      action: "send_notification",
      entity_type: "notification_queue",
      entity_id: entry.id,
      new_value: entry,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ entry }, { status: 201 });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Send failed", 400);
  }
}
