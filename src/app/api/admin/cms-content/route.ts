import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";

/** GET — list all CMS content pages/sections/snippets. */
export async function GET() {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const content = await store.listCmsContent();
  return json({ content });
}

/** PATCH — update a CMS content entry by key.
 *  Body: { key, title?, body?, is_published? }
 */
export async function PATCH(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const body = await req.json().catch(() => ({}));
  const { key, title, body: cmsBody, is_published } = body;
  if (!key) return error("key is required", 422);

  const patch: {
    title?: string;
    body?: string;
    is_published?: boolean;
    updated_by: string;
  } = { updated_by: r.user.id };
  if (title !== undefined) patch.title = String(title);
  if (cmsBody !== undefined) patch.body = String(cmsBody);
  if (is_published !== undefined) patch.is_published = Boolean(is_published);

  try {
    const existing = await store.getCmsContent(String(key));
    const updated = await store.updateCmsContent(String(key), patch);
    await store.logAudit({
      admin_id: r.user.id,
      action: "update_cms_content",
      entity_type: "cms_content",
      entity_id: String(key),
      old_value: existing,
      new_value: updated,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ content: updated });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Update failed", 400);
  }
}
