"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  History,
  RefreshCw,
  Search,
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
import { Input } from "@/components/ui/input";
import { apiFetch, formatDateTime } from "@/lib/client";
import { toast } from "sonner";
import type { AuditLog } from "@/lib/types";

function actionTone(action: string): "violet" | "emerald" | "amber" | "rose" | "fuchsia" {
  if (action.startsWith("create") || action.startsWith("send")) return "emerald";
  if (
    action.startsWith("delete") ||
    action.startsWith("reject") ||
    action.startsWith("revoke") ||
    action.startsWith("block")
  )
    return "rose";
  if (action.startsWith("approve") || action.startsWith("update")) return "violet";
  if (action.startsWith("toggle")) return "amber";
  return "fuchsia";
}

export function AuditLogsSection() {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const { logs: list } = await apiFetch<{ logs: AuditLog[] }>(
        "/api/admin/audit-logs?limit=200"
      );
      setLogs(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.entity_type.toLowerCase().includes(q) ||
        (l.admin_email ?? "").toLowerCase().includes(q) ||
        (l.entity_id ?? "").toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <History className="h-3 w-3" /> Audit Logs
          </>
        }
        title="Admin Activity Trail"
        description="Immutable record of every admin mutation — search by action, entity, or admin email. Expand a row to see the diff."
      />

      <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-violet-100/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, entity, admin…"
            className="border-white/10 bg-white/5 pl-8"
          />
        </div>
        <GlowButton variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </GlowButton>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        {loading && logs.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<History className="h-6 w-6" />}
            title="No logs found"
            description="Try a different search or clear the filter."
            className="py-12"
          />
        ) : (
          <div className="max-h-[40rem] overflow-y-auto pr-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="w-8 text-violet-100/50" />
                    <TableHead className="text-violet-100/50">Time</TableHead>
                    <TableHead className="text-violet-100/50">Admin</TableHead>
                    <TableHead className="text-violet-100/50">Action</TableHead>
                    <TableHead className="text-violet-100/50">Entity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log, i) => {
                    const open = openId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            duration: 0.2,
                            delay: Math.min(i * 0.01, 0.2),
                          }}
                          className="border-white/5 hover:bg-white/[0.03]"
                        >
                          <TableCell className="w-8">
                            <button
                              onClick={() => setOpenId(open ? null : log.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-violet-200/70 transition hover:bg-white/5 hover:text-white"
                              aria-label={open ? "Collapse" : "Expand"}
                            >
                              {open ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-[11px] text-violet-100/70">
                                {formatDateTime(log.created_at)}
                              </span>
                              {log.ip_address && (
                                <span className="text-[10px] text-violet-100/40">
                                  {log.ip_address}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-medium text-white">
                              {log.admin_email ?? log.admin_id.slice(0, 8)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <PremiumBadge tone={actionTone(log.action)}>
                              {log.action}
                            </PremiumBadge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs text-violet-100/70">
                                {log.entity_type}
                              </span>
                              {log.entity_id && (
                                <code className="text-[10px] font-mono text-violet-100/40">
                                  {log.entity_id.slice(0, 12)}
                                </code>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                        {open && (
                          <tr className="border-white/5">
                            <TableCell colSpan={5} className="border-0 p-0">
                              <div className="grid grid-cols-1 gap-3 border-t border-white/5 bg-white/[0.02] p-4 sm:grid-cols-2">
                                <div>
                                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-rose-300/80">
                                    Old Value
                                  </p>
                                  <pre className="max-h-48 overflow-auto rounded-lg bg-black/30 p-3 text-[10px] leading-relaxed text-rose-100/80 ring-1 ring-inset ring-rose-500/10">
                                    {log.old_value === null ||
                                    log.old_value === undefined
                                      ? "null"
                                      : JSON.stringify(log.old_value, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">
                                    New Value
                                  </p>
                                  <pre className="max-h-48 overflow-auto rounded-lg bg-black/30 p-3 text-[10px] leading-relaxed text-emerald-100/80 ring-1 ring-inset ring-emerald-500/10">
                                    {log.new_value === null ||
                                    log.new_value === undefined
                                      ? "null"
                                      : JSON.stringify(log.new_value, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </TableCell>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
