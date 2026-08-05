import { NextRequest } from "next/server";
import { store, requireAdmin, json } from "@/lib/api";

export async function GET(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const { search } = Object.fromEntries(new URL(req.url).searchParams);
  const users = await store.listUsers(search);
  return json({ users });
}
