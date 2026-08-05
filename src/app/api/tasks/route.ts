import { store, requireUser, json } from "@/lib/api";

export async function GET() {
  const r = await requireUser();
  if (!r.ok) return r.res;
  const tasks = await store.listTasks({ user_id: r.user.id });
  return json({ tasks });
}
