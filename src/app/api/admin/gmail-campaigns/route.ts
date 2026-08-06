import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";
import type { GmailCampaign } from "@/lib/types";

const VALID_STATUSES: GmailCampaign["status"][] = ["active", "paused", "closed", "expired"];

/** GET — list all gmail campaigns. */
export async function GET(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const url = new URL(req.url);
  const onlyActive = url.searchParams.get("active") === "1";
  const campaigns = onlyActive
    ? await store.listActiveGmailCampaigns()
    : await store.listGmailCampaigns();
  return json({ campaigns });
}

/** POST — create a new gmail campaign. */
export async function POST(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) return error("name is required", 422);

  try {
    const campaign = await store.createGmailCampaign({
      name,
      description: body.description ? String(body.description) : "",
      reward: body.reward !== undefined ? Number(body.reward) : 0,
      daily_limit: body.daily_limit !== undefined ? Number(body.daily_limit) : 0,
      start_date: body.start_date ? String(body.start_date) : null,
      end_date: body.end_date ? String(body.end_date) : null,
      status: body.status && VALID_STATUSES.includes(body.status) ? body.status : "active",
      rules: body.rules ? String(body.rules) : "",
      created_by: r.user.id,
    });
    await store.logAudit({
      admin_id: r.user.id,
      action: "create_gmail_campaign",
      entity_type: "gmail_campaign",
      entity_id: campaign.id,
      new_value: campaign,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ campaign }, { status: 201 });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Create failed", 400);
  }
}

/** PATCH — update an existing campaign (partial). */
export async function PATCH(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const body = await req.json().catch(() => ({}));
  const { id, ...patch } = body;
  if (!id) return error("id is required", 422);

  const clean: Record<string, unknown> = {};
  for (const k of [
    "name",
    "description",
    "reward",
    "daily_limit",
    "start_date",
    "end_date",
    "status",
    "rules",
  ]) {
    if (patch[k] !== undefined) clean[k] = patch[k];
  }
  if (clean.status && !VALID_STATUSES.includes(clean.status as GmailCampaign["status"]))
    return error("Invalid status", 422);
  if (clean.reward !== undefined) clean.reward = Number(clean.reward);
  if (clean.daily_limit !== undefined) clean.daily_limit = Number(clean.daily_limit);

  try {
    const existing = (await store.listGmailCampaigns()).find((c) => c.id === String(id));
    const updated = await store.updateGmailCampaign(String(id), clean);
    await store.logAudit({
      admin_id: r.user.id,
      action: "update_gmail_campaign",
      entity_type: "gmail_campaign",
      entity_id: String(id),
      old_value: existing ?? null,
      new_value: updated,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ campaign: updated });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Update failed", 400);
  }
}

/** DELETE — soft-delete a campaign. */
export async function DELETE(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return error("id is required", 422);
  try {
    const existing = (await store.listGmailCampaigns()).find((c) => c.id === id);
    await store.deleteGmailCampaign(id);
    await store.logAudit({
      admin_id: r.user.id,
      action: "delete_gmail_campaign",
      entity_type: "gmail_campaign",
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
