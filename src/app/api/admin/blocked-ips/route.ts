import { NextRequest } from "next/server";
import { store, requireAdmin, error, json } from "@/lib/api";

/** GET — list all blocked IPs. */
export async function GET() {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const ips = await store.listBlockedIPs();
  return json({ ips });
}

/** POST — block an IP.
 *  Body: { ip, reason }
 */
export async function POST(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const { ip, reason } = await req.json().catch(() => ({}));
  const ipTrim = String(ip ?? "").trim();
  if (!ipTrim) return error("ip is required", 422);
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ipTrim) && !/^[0-9a-fA-F:]+$/.test(ipTrim))
    return error("Invalid IP address format", 422);
  try {
    const entry = await store.blockIP(
      ipTrim,
      reason ? String(reason) : "Blocked by admin",
      r.user.id
    );
    await store.logAudit({
      admin_id: r.user.id,
      action: "block_ip",
      entity_type: "blocked_ip",
      entity_id: entry.id,
      new_value: entry,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ ip: entry }, { status: 201 });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Block failed", 400);
  }
}

/** DELETE — unblock an IP. Query: ?id=<id> */
export async function DELETE(req: NextRequest) {
  const r = await requireAdmin();
  if (!r.ok) return r.res;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return error("id is required", 422);
  try {
    const existing = (await store.listBlockedIPs()).find((b) => b.id === id);
    await store.unblockIP(id);
    await store.logAudit({
      admin_id: r.user.id,
      action: "unblock_ip",
      entity_type: "blocked_ip",
      entity_id: id,
      old_value: existing ?? null,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });
    return json({ ok: true });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Unblock failed", 400);
  }
}
