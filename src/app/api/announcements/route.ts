import { store, json } from "@/lib/api";

/** GET — list active announcements for the public site banner.
 *  No auth required. Respects publish_date + expiry_date filters.
 */
export async function GET() {
  const announcements = await store.listActiveAnnouncements();
  return json({ announcements });
}
