"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  EmptyState,
  GlassCard,
  GlowButton,
  PremiumBadge,
  SectionHeading,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { apiFetch, formatDateTime, timeAgo } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import { toast } from "sonner";
import type { GmailSubmission } from "@/lib/types";

type Tab = "pending" | "all";
type BulkAction = "approve" | "reject" | "delete";

function statusTone(
  status: GmailSubmission["status"]
): "amber" | "emerald" | "rose" | "violet" | "neutral" {
  switch (status) {
    case "pending":
      return "amber";
    case "approved":
      return "emerald";
    case "rejected":
    case "cancelled":
      return "rose";
    case "sold":
      return "violet";
    default:
      return "neutral";
  }
}

export function GmailManagementSection() {
  const { money } = useCurrency();
  const [tab, setTab] = React.useState<Tab>("pending");
  const [submissions, setSubmissions] = React.useState<GmailSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [revealed, setRevealed] = React.useState<Set<string>>(new Set());
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = React.useState<BulkAction | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab === "pending") params.set("status", "pending");
      const { submissions: list } = await apiFetch<{
        submissions: GmailSubmission[];
      }>(`/api/admin/gmail?${params.toString()}`);
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setSubmissions(list);
      // Prune any selected ids that no longer exist in the new list.
      setSelected((prev) => {
        const next = new Set<string>();
        const ids = new Set(list.map((s) => s.id));
        prev.forEach((id) => {
          if (ids.has(id)) next.add(id);
        });
        return next;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function toggleReveal(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleSubs = submissions;
  const allSelected =
    visibleSubs.length > 0 &&
    visibleSubs.every((s) => selected.has(s.id));
  const someSelected = selected.size > 0 && !allSelected;

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleSubs.map((s) => s.id)));
    }
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function act(sub: GmailSubmission, action: "approve" | "reject") {
    setBusyId(sub.id);
    const prev = submissions;
    const next: GmailSubmission[] =
      tab === "pending"
        ? submissions.filter((s) => s.id !== sub.id)
        : submissions.map((s) =>
            s.id === sub.id
              ? {
                  ...s,
                  status: (action === "approve" ? "approved" : "rejected") as GmailSubmission["status"],
                  reviewed_at: new Date().toISOString(),
                }
              : s
          );
    setSubmissions(next);
    try {
      await apiFetch("/api/admin/gmail", {
        method: "POST",
        body: JSON.stringify({ submission_id: sub.id, action }),
      });
      toast.success(
        action === "approve"
          ? `Gmail approved · ${money(sub.reward)} credited`
          : "Gmail rejected"
      );
    } catch (err) {
      setSubmissions(prev);
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  /** Run a bulk action against every selected submission. Loops through
   *  each id and calls the appropriate endpoint, collecting per-item
   *  results. The list is refreshed at the end and a summary toast shown. */
  async function runBulk(action: BulkAction) {
    if (selected.size === 0) return;
    setBulkBusy(action);
    const ids = Array.from(selected);
    let ok = 0;
    let failed = 0;
    const failures: string[] = [];

    // Optimistic removal for pending tab on bulk actions.
    if (tab === "pending") {
      setSubmissions((prev) => prev.filter((s) => !selected.has(s.id)));
    }

    for (const id of ids) {
      try {
        if (action === "delete") {
          await apiFetch(`/api/admin/gmail?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
          });
        } else {
          await apiFetch("/api/admin/gmail", {
            method: "POST",
            body: JSON.stringify({ submission_id: id, action }),
          });
        }
        ok += 1;
      } catch (err) {
        failed += 1;
        failures.push(
          err instanceof Error ? err.message : `Failed for ${id.slice(0, 8)}`
        );
      }
    }

    setSelected(new Set());
    setBulkBusy(null);
    await refresh();

    const verb =
      action === "approve"
        ? "approved"
        : action === "reject"
          ? "rejected"
          : "deleted";
    if (failed === 0) {
      toast.success(`Bulk ${verb}: ${ok} submission${ok === 1 ? "" : "s"}`);
    } else if (ok === 0) {
      toast.error(`Bulk ${verb} failed for all ${failed} items`);
    } else {
      toast.warning(
        `Bulk ${verb}: ${ok} succeeded, ${failed} failed — ${failures[0]}`
      );
    }
  }

  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <Mail className="h-3 w-3" /> Gmail Selling
          </>
        }
        title="Gmail Review"
        description="Approve or reject Gmail submissions. Approved accounts credit the user with the configured reward. Use bulk actions to process many at once."
      />

      <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="bg-white/5">
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white"
            >
              Pending
              {tab === "pending" && pendingCount > 0 && (
                <span className="ml-1 rounded-full bg-fuchsia-500/30 px-1.5 text-[10px] font-bold text-fuchsia-200">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white"
            >
              All
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <GlowButton variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </GlowButton>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        {loading && submissions.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={<Mail className="h-6 w-6" />}
            title="No submissions"
            description={
              tab === "pending"
                ? "All caught up. New gmail submissions will appear here."
                : "No gmail submissions match this view yet."
            }
            className="py-12"
          />
        ) : (
          <div className="max-h-[40rem] overflow-y-auto pr-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="w-10 text-violet-100/50">
                      <Checkbox
                        checked={
                          allSelected
                            ? true
                            : someSelected
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all submissions"
                      />
                    </TableHead>
                    <TableHead className="text-violet-100/50">
                      Gmail Address
                    </TableHead>
                    <TableHead className="text-violet-100/50">User</TableHead>
                    <TableHead className="text-violet-100/50">Password</TableHead>
                    <TableHead className="text-violet-100/50">Reward</TableHead>
                    <TableHead className="text-violet-100/50">Submitted</TableHead>
                    {tab === "all" && (
                      <TableHead className="text-violet-100/50">Status</TableHead>
                    )}
                    <TableHead className="text-right text-violet-100/50">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.2,
                        delay: Math.min(i * 0.015, 0.25),
                      }}
                      className={`border-white/5 hover:bg-white/[0.03] ${
                        selected.has(s.id) ? "bg-violet-500/[0.08]" : ""
                      }`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selected.has(s.id)}
                          onCheckedChange={() => toggleSelected(s.id)}
                          aria-label={`Select ${s.gmail_address}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-violet-300 ring-1 ring-white/10">
                            <Mail className="h-3.5 w-3.5" />
                          </div>
                          <code className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] font-mono text-violet-100">
                            {s.gmail_address}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-white">
                            {s.user_name || s.user_email || "—"}
                          </p>
                          {s.user_email && (
                            <p className="truncate text-[10px] text-violet-100/40">
                              {s.user_email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <code className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] font-mono text-violet-100 ring-1 ring-inset ring-white/10">
                            {revealed.has(s.id)
                              ? s.gmail_password || "—"
                              : "•".repeat(
                                  Math.min(
                                    10,
                                    (s.gmail_password || "").length || 8
                                  )
                                )}
                          </code>
                          <GlowButton
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleReveal(s.id)}
                            aria-label={
                              revealed.has(s.id) ? "Hide password" : "Show password"
                            }
                          >
                            {revealed.has(s.id) ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </GlowButton>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-emerald-300 tabular-nums">
                          {money(s.reward)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[11px] text-violet-100/70">
                            {formatDateTime(s.created_at)}
                          </span>
                          <span className="text-[10px] text-violet-100/40">
                            {timeAgo(s.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      {tab === "all" && (
                        <TableCell>
                          <PremiumBadge tone={statusTone(s.status)}>
                            {s.status}
                          </PremiumBadge>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        {s.status === "pending" ? (
                          <div className="flex justify-end gap-1.5">
                            <GlowButton
                              variant="success"
                              size="sm"
                              onClick={() => act(s, "approve")}
                              disabled={busyId === s.id || bulkBusy !== null}
                            >
                              {busyId === s.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ThumbsUp className="h-3.5 w-3.5" />
                              )}
                              Approve
                            </GlowButton>
                            <GlowButton
                              variant="danger"
                              size="sm"
                              onClick={() => act(s, "reject")}
                              disabled={busyId === s.id || bulkBusy !== null}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                              Reject
                            </GlowButton>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            {s.status === "approved" ? (
                              <PremiumBadge tone="emerald">
                                <CheckCircle2 className="h-3 w-3" /> Approved
                              </PremiumBadge>
                            ) : (
                              <PremiumBadge tone="rose">
                                <XCircle className="h-3 w-3" /> {s.status}
                              </PremiumBadge>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Bulk action bar — sticky at the bottom, appears when items are selected */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
          >
            <GlassCard
              variant="panel"
              border="gradient"
              className="flex flex-wrap items-center gap-3 p-3 shadow-2xl"
            >
              <div className="flex items-center gap-2 px-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-violet-200 ring-1 ring-white/10">
                  <Mail className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">
                    {selected.size} selected
                  </p>
                  <p className="text-[10px] text-violet-100/50">
                    Apply a bulk action
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-white/10" />

              <GlowButton
                variant="success"
                size="sm"
                onClick={() => runBulk("approve")}
                disabled={bulkBusy !== null}
              >
                {bulkBusy === "approve" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ThumbsUp className="h-3.5 w-3.5" />
                )}
                Bulk Approve
              </GlowButton>
              <GlowButton
                variant="danger"
                size="sm"
                onClick={() => runBulk("reject")}
                disabled={bulkBusy !== null}
              >
                {bulkBusy === "reject" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ThumbsDown className="h-3.5 w-3.5" />
                )}
                Bulk Reject
              </GlowButton>
              <GlowButton
                variant="outline"
                size="sm"
                onClick={() => runBulk("delete")}
                disabled={bulkBusy !== null}
                className="border-rose-400/30 bg-rose-500/5 text-rose-200 hover:bg-rose-500/15 hover:border-rose-400/50"
              >
                {bulkBusy === "delete" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Bulk Delete
              </GlowButton>

              <div className="h-8 w-px bg-white/10" />

              <GlowButton
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={clearSelection}
                disabled={bulkBusy !== null}
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </GlowButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
