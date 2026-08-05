import { NextRequest } from "next/server";
import { store, requireUser, error, json } from "@/lib/api";
import type { TaskType } from "@/lib/types";

const VALID: TaskType[] = ["gmail", "tiktok"];

export async function POST(req: NextRequest) {
  const r = await requireUser();
  if (!r.ok) return r.res;

  if (r.user.is_suspended)
    return error("Your subscription has expired. Please renew to continue.", 403);
  if (!r.user.joining_fee_paid)
    return error("Please pay the joining fee to submit tasks.", 403);

  const { type, task_url, screenshot_url, attempt_id, duration_ms } =
    await req.json().catch(() => ({}));

  if (!VALID.includes(type)) return error("Invalid task type", 422);
  if (!task_url || String(task_url).trim().length < 4)
    return error("A valid task URL is required", 422);
  if (!screenshot_url || String(screenshot_url).trim().length < 8)
    return error("A screenshot is required", 422);

  // anti-cheat: if an attempt_id was provided, record completion + enforce min duration
  if (attempt_id && duration_ms) {
    const minMs = 15000; // 15s minimum viewing time
    if (Number(duration_ms) < minMs) {
      return error(
        "Please spend at least 15 seconds viewing the task before submitting.",
        422
      );
    }
    try {
      await store.completeTaskAttempt(attempt_id, Number(duration_ms));
    } catch {
      /* non-fatal */
    }
  }

  try {
    const task = await store.submitTask(
      r.user.id,
      type,
      String(task_url).trim(),
      String(screenshot_url).trim()
    );
    return json({ task });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Submission failed", 400);
  }
}
