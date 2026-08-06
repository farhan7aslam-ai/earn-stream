import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";
import type { TikTokTaskType } from "@/lib/types";

const VALID_TYPES: TikTokTaskType[] = ["LIKE", "FOLLOW", "COMMENT", "SHARE"];

/** GET — list all TikTok tasks (with optional status filter). */
export async function GET(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const limit = url.searchParams.get("limit")
    ? Number(url.searchParams.get("limit"))
    : undefined;
  const offset = url.searchParams.get("offset")
    ? Number(url.searchParams.get("offset"))
    : undefined;
  const tasks = await store.listTasksCMS({
    status: status as never,
    limit,
    offset,
  });
  return json({ tasks });
}

/** POST — create a new TikTok task. */
export async function POST(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const task_type = String(body.task_type ?? "").toUpperCase() as TikTokTaskType;
  if (!title) return error("title is required", 422);
  if (!VALID_TYPES.includes(task_type))
    return error("task_type must be LIKE, FOLLOW, COMMENT or SHARE", 422);

  try {
    const task = await store.createTask({
      title,
      description: body.description ? String(body.description) : "",
      tiktok_username: body.tiktok_username ? String(body.tiktok_username) : "",
      tiktok_video_url: body.tiktok_video_url ? String(body.tiktok_video_url) : "",
      task_type,
      reward_per_user: body.reward_per_user !== undefined ? Number(body.reward_per_user) : 0,
      max_participants: body.max_participants !== undefined ? Number(body.max_participants) : 0,
      expiry_date: body.expiry_date ? String(body.expiry_date) : null,
      priority: body.priority !== undefined ? Number(body.priority) : 0,
      instructions: body.instructions ? String(body.instructions) : "",
      comment_text: body.comment_text ? String(body.comment_text) : null,
      created_by: r.user.id,
    });
    await store.logAudit({
      admin_id: r.user.id,
      action: "create_task",
      entity_type: "task",
      entity_id: task.id,
      new_value: task,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ task }, { status: 201 });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Create failed", 400);
  }
}

/** PATCH — update an existing task (partial). Use action=close to soft-close. */
export async function PATCH(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const body = await req.json().catch(() => ({}));
  const { id, action, ...patch } = body;
  if (!id) return error("id is required", 422);

  try {
    const existing = await store.getTaskCMS(String(id));
    if (!existing) return error("Task not found", 404);

    if (action === "close") {
      const updated = await store.updateTask(String(id), { status: "closed" });
      await store.logAudit({
        admin_id: r.user.id,
        action: "close_task",
        entity_type: "task",
        entity_id: String(id),
        old_value: existing,
        new_value: updated,
        ip_address: req.headers.get("x-forwarded-for"),
        user_agent: req.headers.get("user-agent"),
      });
      return json({ task: updated });
    }

    const clean: Record<string, unknown> = {};
    for (const k of [
      "title",
      "description",
      "tiktok_username",
      "tiktok_video_url",
      "tiktok_video_id",
      "task_type",
      "reward_per_user",
      "max_participants",
      "expiry_date",
      "priority",
      "instructions",
      "comment_text",
      "status",
      "featured",
      "pinned",
      "visibility",
      "auto_close",
      "remarks",
    ]) {
      if (patch[k] !== undefined) clean[k] = patch[k];
    }
    if (clean.task_type && !VALID_TYPES.includes(clean.task_type as TikTokTaskType))
      return error("Invalid task_type", 422);
    if (clean.reward_per_user !== undefined)
      clean.reward_per_user = Number(clean.reward_per_user);
    if (clean.max_participants !== undefined)
      clean.max_participants = Number(clean.max_participants);
    if (clean.priority !== undefined) clean.priority = Number(clean.priority);

    const updated = await store.updateTask(String(id), clean);
    await store.logAudit({
      admin_id: r.user.id,
      action: "update_task",
      entity_type: "task",
      entity_id: String(id),
      old_value: existing,
      new_value: updated,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ task: updated });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Update failed", 400);
  }
}

/** DELETE — soft-delete (marks deleted_at + cancelled). */
export async function DELETE(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return error("id is required", 422);
  try {
    const existing = await store.getTaskCMS(id);
    if (!existing) return error("Task not found", 404);
    await store.deleteTask(id);
    await store.logAudit({
      admin_id: r.user.id,
      action: "delete_task",
      entity_type: "task",
      entity_id: id,
      old_value: existing,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ ok: true });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Delete failed", 400);
  }
}
