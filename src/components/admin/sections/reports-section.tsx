"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  Database,
  DollarSign,
  FileSpreadsheet,
  Loader2,
  Mail,
  Printer,
  Users,
  Wallet,
} from "lucide-react";
import {
  GlassCard,
  GlowButton,
  PremiumBadge,
  SectionHeading,
} from "@/components/premium";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import { toast } from "sonner";

interface ReportDef {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tone: "violet" | "fuchsia" | "emerald" | "amber" | "rose";
  endpoint: string;
  fields: string[];
  filename: string;
}

const REPORTS: ReportDef[] = [
  {
    id: "users",
    title: "Users Report",
    description: "All registered users with balance, status, and joining-fee state.",
    icon: <Users className="h-5 w-5" />,
    tone: "violet",
    endpoint: "/api/admin/users/list?search=",
    fields: ["id", "email", "full_name", "phone", "balance", "joining_fee_paid", "is_banned", "is_suspended", "created_at"],
    filename: "users-report",
  },
  {
    id: "tasks",
    title: "TikTok Tasks Report",
    description: "All TikTok tasks with reward, slots, and current status.",
    icon: <Database className="h-5 w-5" />,
    tone: "fuchsia",
    endpoint: "/api/admin/tasks-cms",
    fields: ["id", "title", "task_type", "reward_per_user", "max_participants", "completed_count", "status", "priority", "created_at"],
    filename: "tasks-report",
  },
  {
    id: "withdrawals",
    title: "Withdrawals Report",
    description: "All withdrawal requests with method, account and status.",
    icon: <ArrowDownToLine className="h-5 w-5" />,
    tone: "rose",
    endpoint: "/api/admin/payments?type=withdrawal",
    fields: ["id", "user_id", "amount", "method", "account", "status", "created_at", "processed_at"],
    filename: "withdrawals-report",
  },
  {
    id: "revenue",
    title: "Revenue Report",
    description: "All payments processed (credits and debits).",
    icon: <DollarSign className="h-5 w-5" />,
    tone: "amber",
    endpoint: "/api/admin/payments",
    fields: ["id", "user_id", "type", "amount", "method", "status", "created_at"],
    filename: "revenue-report",
  },
  {
    id: "wallet",
    title: "Wallet Ledger Report",
    description: "Recent wallet transactions across all users.",
    icon: <Wallet className="h-5 w-5" />,
    tone: "emerald",
    endpoint: "/api/admin/payments",
    fields: ["id", "user_id", "type", "amount", "method", "status", "note", "created_at"],
    filename: "wallet-ledger-report",
  },
  {
    id: "referrals",
    title: "Referral Report",
    description: "All referral relationships and bonus payouts.",
    icon: <Users className="h-5 w-5" />,
    tone: "violet",
    endpoint: "/api/referrals",
    fields: ["id", "referrer_id", "referred_id", "bonus_amount", "status", "created_at"],
    filename: "referrals-report",
  },
  {
    id: "gmail",
    title: "Gmail Submissions Report",
    description: "All Gmail submissions with status and reward.",
    icon: <Mail className="h-5 w-5" />,
    tone: "fuchsia",
    endpoint: "/api/admin/gmail",
    fields: ["id", "user_id", "gmail_address", "status", "reward", "created_at", "reviewed_at"],
    filename: "gmail-report",
  },
];

function toneRing(tone: ReportDef["tone"]): string {
  switch (tone) {
    case "violet":
      return "from-violet-500/20 to-fuchsia-500/5 text-violet-300";
    case "fuchsia":
      return "from-fuchsia-500/20 to-rose-500/5 text-fuchsia-300";
    case "emerald":
      return "from-emerald-500/20 to-teal-500/5 text-emerald-300";
    case "amber":
      return "from-amber-500/20 to-orange-500/5 text-amber-300";
    case "rose":
      return "from-rose-500/20 to-red-500/5 text-rose-300";
  }
}

function escapeCsv(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(rows: Record<string, unknown>[], fields: string[]): string {
  const header = fields.join(",");
  const body = rows
    .map((r) => fields.map((f) => escapeCsv(r[f])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ReportsSection() {
  const { money } = useCurrency();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [counts, setCounts] = React.useState<Record<string, number>>({});

  async function fetchAndDownload(report: ReportDef) {
    setBusy(report.id);
    try {
      const res = await apiFetch<Record<string, unknown[]>>(report.endpoint);
      const rows = (res[Object.keys(res)[0]] ?? []) as Record<string, unknown>[];
      if (rows.length === 0) {
        toast.info("No rows to export");
        return;
      }
      const csv = buildCsv(rows, report.fields);
      downloadCsv(report.filename, csv);
      toast.success(`Exported ${rows.length} rows`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  function printReport(report: ReportDef) {
    setBusy(report.id);
    apiFetch<Record<string, unknown[]>>(report.endpoint)
      .then((res) => {
        const rows = (res[Object.keys(res)[0]] ?? []) as Record<string, unknown>[];
        if (rows.length === 0) {
          toast.info("Nothing to print");
          return;
        }
        const printWindow = window.open("", "_blank", "width=900,height=700");
        if (!printWindow) {
          toast.error("Pop-up blocked — please allow pop-ups to print");
          return;
        }
        const header = report.fields.map((f) => `<th>${f}</th>`).join("");
        const body = rows
          .map(
            (r) =>
              `<tr>${report.fields
                .map((f) => `<td>${String(r[f] ?? "")}</td>`)
                .join("")}</tr>`
          )
          .join("");
        printWindow.document.write(`
          <html>
          <head>
            <title>${report.title}</title>
            <style>
              body { font-family: -apple-system, sans-serif; padding: 24px; color: #111; }
              h1 { margin-bottom: 8px; }
              .meta { color: #666; margin-bottom: 16px; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
              th { background: #f4f4f5; }
              tr:nth-child(even) { background: #fafafa; }
            </style>
          </head>
          <body>
            <h1>${report.title}</h1>
            <div class="meta">Generated ${new Date().toLocaleString()} · ${rows.length} rows</div>
            <table>
              <thead><tr>${header}</tr></thead>
              <tbody>${body}</tbody>
            </table>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Print failed");
      })
      .finally(() => setBusy(null));
  }

  // Pre-fetch counts for display
  React.useEffect(() => {
    (async () => {
      const next: Record<string, number> = {};
      for (const r of REPORTS) {
        try {
          const res = await apiFetch<Record<string, unknown[]>>(r.endpoint);
          next[r.id] = (res[Object.keys(res)[0]] ?? []).length;
        } catch {
          next[r.id] = 0;
        }
      }
      setCounts(next);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <FileSpreadsheet className="h-3 w-3" /> Reports
          </>
        }
        title="Export Center"
        description="Download any platform dataset as a CSV or print a formatted snapshot. All exports are generated live from the current database."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.25) }}
          >
            <GlassCard className="flex h-full flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset ring-white/10 ${toneRing(
                    r.tone
                  )}`}
                >
                  {r.icon}
                </div>
                <PremiumBadge tone={r.tone}>
                  {counts[r.id] === undefined ? (
                    <Skeleton className="h-3 w-6" />
                  ) : (
                    `${counts[r.id]} rows`
                  )}
                </PremiumBadge>
              </div>
              <h3 className="text-base font-bold text-white">{r.title}</h3>
              <p className="mt-1 mb-4 line-clamp-2 text-xs leading-relaxed text-violet-100/55">
                {r.description}
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                <GlowButton
                  variant="primary"
                  size="sm"
                  onClick={() => fetchAndDownload(r)}
                  disabled={busy === r.id}
                >
                  {busy === r.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="h-3.5 w-3.5" />
                  )}
                  Download CSV
                </GlowButton>
                <GlowButton
                  variant="ghost"
                  size="sm"
                  onClick={() => printReport(r)}
                  disabled={busy === r.id}
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </GlowButton>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <p className="text-[11px] text-violet-100/40">
        Tip: Use currency symbol {money(0).replace(/[\d.]+/g, "").trim() || "Rs"} when reconciling financial reports.
      </p>
    </div>
  );
}
