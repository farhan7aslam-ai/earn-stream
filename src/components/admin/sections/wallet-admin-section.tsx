"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Wallet,
} from "lucide-react";
import {
  EmptyState,
  GlassCard,
  GlowButton,
  PremiumBadge,
  SectionHeading,
  StatCard,
} from "@/components/premium";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { apiFetch, formatDateTime } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import { toast } from "sonner";
import type { SafeUser, WalletLedgerEntry } from "@/lib/types";

export function WalletAdminSection() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <Wallet className="h-3 w-3" /> Wallet
          </>
        }
        title="Wallet Administration"
        description="Inspect a user's ledger and apply manual balance adjustments (credits or debits)."
      />

      <Tabs defaultValue="ledger">
        <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 sm:max-w-md">
          <TabsTrigger
            value="ledger"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white"
          >
            <Search className="mr-1.5 h-3.5 w-3.5" /> Ledger
          </TabsTrigger>
          <TabsTrigger
            value="adjust"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white"
          >
            <ArrowUpFromLine className="mr-1.5 h-3.5 w-3.5" /> Adjust Balance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="mt-6">
          <LedgerTab />
        </TabsContent>
        <TabsContent value="adjust" className="mt-6">
          <AdjustTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LedgerTab() {
  const { money } = useCurrency();
  const [userId, setUserId] = React.useState("");
  const [searchId, setSearchId] = React.useState("");
  const [entries, setEntries] = React.useState<WalletLedgerEntry[]>([]);
  const [user, setUser] = React.useState<SafeUser | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    if (!searchId.trim()) {
      toast.error("Enter a user ID");
      return;
    }
    setLoading(true);
    try {
      const [ledgerRes, userRes] = await Promise.all([
        apiFetch<{ entries: WalletLedgerEntry[] }>(
          `/api/admin/wallet-ledger?user_id=${encodeURIComponent(searchId.trim())}`
        ),
        apiFetch<{ user: SafeUser }>(
          `/api/admin/users?id=${encodeURIComponent(searchId.trim())}`
        ).catch(() => null),
      ]);
      setEntries(ledgerRes.entries);
      setUser(userRes?.user ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
      setEntries([]);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);

  return (
    <div className="space-y-4">
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-violet-300 ring-1 ring-white/10">
            <Search className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Find User Ledger</h3>
            <p className="text-[11px] text-violet-100/45">Enter a user UUID to fetch their wallet history</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User UUID"
            className="border-white/10 bg-white/5 font-mono"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchId(userId);
                load();
              }
            }}
          />
          <GlowButton
            variant="primary"
            size="md"
            onClick={() => {
              setSearchId(userId);
              load();
            }}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Load Ledger
          </GlowButton>
        </div>
      </GlassCard>

      {user && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Current Balance"
            value={<span className="text-emerald-300">{money(user.balance)}</span>}
            icon={<Wallet className="h-5 w-5" />}
            accent="emerald"
            hint={user.email}
          />
          <StatCard
            label="Total Credits"
            value={<span className="text-violet-300">{money(totalCredit)}</span>}
            icon={<ArrowDownToLine className="h-5 w-5" />}
            accent="violet"
            hint={`${entries.filter((e) => e.credit > 0).length} entries`}
          />
          <StatCard
            label="Total Debits"
            value={<span className="text-rose-300">{money(totalDebit)}</span>}
            icon={<ArrowUpFromLine className="h-5 w-5" />}
            accent="rose"
            hint={`${entries.filter((e) => e.debit > 0).length} entries`}
          />
        </div>
      )}

      {loading ? (
        <GlassCard className="p-5 sm:p-6">
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </GlassCard>
      ) : entries.length > 0 ? (
        <GlassCard className="p-5 sm:p-6">
          <div className="max-h-[34rem] overflow-y-auto pr-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="text-violet-100/50">When</TableHead>
                    <TableHead className="text-violet-100/50">Description</TableHead>
                    <TableHead className="text-violet-100/50">Credit</TableHead>
                    <TableHead className="text-violet-100/50">Debit</TableHead>
                    <TableHead className="text-violet-100/50">Closing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e, i) => (
                    <motion.tr
                      key={e.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.2,
                        delay: Math.min(i * 0.015, 0.25),
                      }}
                      className="border-white/5 hover:bg-white/[0.03]"
                    >
                      <TableCell>
                        <span className="text-[11px] text-violet-100/70">
                          {formatDateTime(e.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-xs text-white">{e.description}</p>
                          <p className="truncate text-[10px] text-violet-100/40">
                            {e.reference_type}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {e.credit > 0 ? (
                          <span className="text-sm font-bold text-emerald-300 tabular-nums">
                            +{money(e.credit)}
                          </span>
                        ) : (
                          <span className="text-violet-100/30">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {e.debit > 0 ? (
                          <span className="text-sm font-bold text-rose-300 tabular-nums">
                            −{money(e.debit)}
                          </span>
                        ) : (
                          <span className="text-violet-100/30">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-white tabular-nums">
                          {money(e.closing_balance)}
                        </span>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </GlassCard>
      ) : searchId && !loading ? (
        <GlassCard className="p-6">
          <EmptyState
            icon={<Wallet className="h-6 w-6" />}
            title="No ledger entries"
            description="This user has no wallet transactions yet."
            className="py-12"
          />
        </GlassCard>
      ) : null}
    </div>
  );
}

function AdjustTab() {
  const { money } = useCurrency();
  const [userId, setUserId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [type, setType] = React.useState<"credit" | "debit">("credit");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [targetUser, setTargetUser] = React.useState<SafeUser | null>(null);
  const [loadingUser, setLoadingUser] = React.useState(false);

  async function lookupUser() {
    if (!userId.trim()) {
      setTargetUser(null);
      return;
    }
    setLoadingUser(true);
    try {
      const { user } = await apiFetch<{ user: SafeUser }>(
        `/api/admin/users?id=${encodeURIComponent(userId.trim())}`
      );
      setTargetUser(user);
    } catch {
      setTargetUser(null);
    } finally {
      setLoadingUser(false);
    }
  }

  React.useEffect(() => {
    const t = setTimeout(lookupUser, 400);
    return () => clearTimeout(t);
  }, [userId]);

  async function submit() {
    const amt = Number(amount);
    if (!userId.trim()) {
      toast.error("User ID required");
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Amount must be > 0");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/admin/wallet-ledger", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId.trim(),
          credit: type === "credit" ? amt : 0,
          debit: type === "debit" ? amt : 0,
          reference_type: "admin_adjustment",
          description: description.trim() || `Admin ${type}`,
        }),
      });
      toast.success(
        `${type === "credit" ? "Credited" : "Debited"} ${money(amt)} to user`
      );
      setAmount("");
      setDescription("");
      lookupUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Adjustment failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/10 text-amber-300 ring-1 ring-white/10">
              <ArrowUpFromLine className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manual Adjustment</h3>
              <p className="text-[11px] text-violet-100/45">Credit or debit a user's wallet</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="adj-user">User ID *</Label>
              <Input
                id="adj-user"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Paste user UUID"
                className="border-white/10 bg-white/5 font-mono"
              />
              {loadingUser && (
                <p className="text-[10px] text-violet-100/40">Looking up user…</p>
              )}
              {targetUser && (
                <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] p-2 ring-1 ring-inset ring-white/5">
                  <PremiumBadge tone="emerald">{targetUser.email}</PremiumBadge>
                  <span className="text-[11px] text-violet-100/55">
                    Balance: {money(targetUser.balance)}
                  </span>
                </div>
              )}
              {userId && !targetUser && !loadingUser && (
                <p className="text-[10px] text-rose-300/70">User not found</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adj-amount">Amount *</Label>
              <Input
                id="adj-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100.00"
                className="border-white/10 bg-white/5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adj-type">Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as "credit" | "debit")}
              >
                <SelectTrigger id="adj-type" className="w-full border-white/10 bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">
                    <span className="flex items-center gap-2">
                      <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-300" />
                      Credit (+)
                    </span>
                  </SelectItem>
                  <SelectItem value="debit">
                    <span className="flex items-center gap-2">
                      <ArrowUpFromLine className="h-3.5 w-3.5 text-rose-300" />
                      Debit (−)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="adj-desc">Description</Label>
              <Textarea
                id="adj-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Reason for the adjustment"
                rows={2}
                className="border-white/10 bg-white/5"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <GlowButton
              variant="ghost"
              size="sm"
              onClick={lookupUser}
              disabled={loadingUser}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingUser ? "animate-spin" : ""}`} />
              Re-check user
            </GlowButton>
            <GlowButton variant="primary" size="md" onClick={submit} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Apply {type === "credit" ? "Credit" : "Debit"}
            </GlowButton>
          </div>
        </GlassCard>
      </motion.div>

      <p className="text-[11px] text-violet-100/40">
        Adjustments are logged in the user's wallet ledger and the admin audit trail.
      </p>
    </div>
  );
}
