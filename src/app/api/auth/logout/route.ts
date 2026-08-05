import { NextRequest } from "next/server";
import { store } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth";
import { json } from "@/lib/api";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("es_session")?.value;
  if (token) {
    try {
      await store.deleteSession(token);
    } catch {
      /* ignore */
    }
  }
  await clearSessionCookie();
  return json({ ok: true });
}
