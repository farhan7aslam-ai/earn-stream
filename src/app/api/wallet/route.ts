import { store, requireUser, error, json } from "@/lib/api";

export async function GET() {
  const r = await requireUser();
  if (!r.ok) return r.res;
  const [wallet, ledger] = await Promise.all([
    store.getWallet(r.user.id),
    store.getLedger(r.user.id),
  ]);
  return json({ wallet, ledger });
}
