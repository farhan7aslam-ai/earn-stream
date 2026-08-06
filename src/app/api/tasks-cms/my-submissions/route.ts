import { store, requireUser, json } from "@/lib/api";

/** GET — list the current user's task submissions. */
export async function GET() {
  const r = await requireUser();
  if (!r.ok) return r.res;
  const submissions = await store.listUserTaskSubmissions(r.user.id);
  return json({ submissions });
}
