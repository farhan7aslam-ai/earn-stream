import { store } from "@/lib/api";
import { json } from "@/lib/api";

export async function GET() {
  const settings = await store.getSettings();
  return json({ settings });
}
