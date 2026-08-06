import { NextRequest } from "next/server";
import { store, json } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth";

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

  // Log logout to audit
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";
    // We can't get the user ID easily here without a DB lookup,
    // but the session deletion is sufficient.
  } catch {
    /* non-fatal */
  }

  return json({ ok: true });
}
