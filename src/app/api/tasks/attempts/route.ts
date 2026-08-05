import { NextRequest } from "next/server";
import { store, requireUser, error, json } from "@/lib/api";
import type { TaskType } from "@/lib/types";

const VALID: TaskType[] = ["gmail", "tiktok"];

export async function POST(req: NextRequest) {
  const r = await requireUser();
  if (!r.ok) return r.res;

  if (r.user.is_suspended)
    return error("Your subscription has expired.", 403);

  const { task_type, task_url } = await req.json().catch(() => ({}));
  if (!VALID.includes(task_type)) return error("Invalid task type", 422);
  try {
    const attempt = await store.startTaskAttempt(
      r.user.id,
      task_type,
      String(task_url ?? "").trim()
    );
    return json({ attempt });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Failed", 400);
  }
}
