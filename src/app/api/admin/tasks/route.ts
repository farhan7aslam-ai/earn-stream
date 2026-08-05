import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";

export async function GET(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const sp = new URL(req.url).searchParams;
  const filter: { status?: "pending" | "approved" | "rejected"; type?: "gmail" | "tiktok" } = {};
  const status = sp.get("status");
  if (status) filter.status = status as "pending" | "approved" | "rejected";
  const type = sp.get("type");
  if (type) filter.type = type as "gmail" | "tiktok";
  const tasks = await store.listTasks(filter);
  return json({ tasks });
}

export async function POST(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const { id, action, note } = await req.json().catch(() => ({}));
  if (!id || !action) return error("id and action required", 422);
  try {
    if (action === "approve") {
      const t = await store.approveTask(String(id));
      return json({ task: t });
    }
    if (action === "reject") {
      const t = await store.rejectTask(String(id), note);
      return json({ task: t });
    }
    return error("Unknown action", 422);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Action failed", 400);
  }
}
