import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";
import type { Announcement } from "@/lib/types";

const VALID_TYPES: Announcement["type"][] = ["info", "success", "warning", "error"];
const VALID_AUDIENCE: Announcement["visible_to"][] = ["all", "users", "admins"];

/** GET — list all announcements (admin). */
export async function GET() {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const announcements = await store.listAllAnnouncements();
  return json({ announcements });
}

/** POST — create a new announcement. */
export async function POST(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  if (!title) return error("title is required", 422);

  try {
    const announcement = await store.createAnnouncement({
      title,
      body: body.body ? String(body.body) : "",
      type: body.type && VALID_TYPES.includes(body.type) ? body.type : "info",
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      image_url: body.image_url ? String(body.image_url) : null,
      priority: body.priority !== undefined ? Number(body.priority) : 0,
      publish_date: body.publish_date ? String(body.publish_date) : null,
      expiry_date: body.expiry_date ? String(body.expiry_date) : null,
      visible_to:
        body.visible_to && VALID_AUDIENCE.includes(body.visible_to)
          ? body.visible_to
          : "all",
      created_by: r.user.id,
    });
    await store.logAudit({
      admin_id: r.user.id,
      action: "create_announcement",
      entity_type: "announcement",
      entity_id: announcement.id,
      new_value: announcement,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ announcement }, { status: 201 });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Create failed", 400);
  }
}

/** PATCH — toggle an announcement active/inactive (or update fields). */
export async function PATCH(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const body = await req.json().catch(() => ({}));
  const { id, is_active, title, body: annBody, image_url, priority, expiry_date } = body;
  if (!id) return error("id is required", 422);

  try {
    if (is_active !== undefined) {
      const updated = await store.toggleAnnouncement(String(id), Boolean(is_active));
      await store.logAudit({
        admin_id: r.user.id,
        action: "toggle_announcement",
        entity_type: "announcement",
        entity_id: String(id),
        new_value: updated,
        ip_address: req.headers.get("x-forwarded-for"),
        user_agent: req.headers.get("user-agent"),
      });
      return json({ announcement: updated });
    }
    // partial update via delete + recreate pattern is overkill; reuse toggle for
    // field edits by reading existing + creating replacement.
    const existing = (await store.listAllAnnouncements()).find((a) => a.id === String(id));
    if (!existing) return error("Announcement not found", 404);
    const updated = await store.createAnnouncement({
      title: title !== undefined ? String(title) : existing.title,
      body: annBody !== undefined ? String(annBody) : existing.body,
      type: existing.type,
      is_active: existing.is_active,
      image_url: image_url !== undefined ? String(image_url) : existing.image_url,
      priority: priority !== undefined ? Number(priority) : existing.priority,
      publish_date: existing.publish_date,
      expiry_date: expiry_date !== undefined ? String(expiry_date) : existing.expiry_date,
      visible_to: existing.visible_to,
      created_by: r.user.id,
    });
    await store.deleteAnnouncement(String(id));
    await store.logAudit({
      admin_id: r.user.id,
      action: "update_announcement",
      entity_type: "announcement",
      entity_id: String(id),
      old_value: existing,
      new_value: updated,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ announcement: updated });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Update failed", 400);
  }
}

/** DELETE — soft-delete an announcement. */
export async function DELETE(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return error("id is required", 422);
  try {
    const existing = (await store.listAllAnnouncements()).find((a) => a.id === id);
    await store.deleteAnnouncement(id);
    await store.logAudit({
      admin_id: r.user.id,
      action: "delete_announcement",
      entity_type: "announcement",
      entity_id: id,
      old_value: existing ?? null,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ ok: true });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Delete failed", 400);
  }
}
