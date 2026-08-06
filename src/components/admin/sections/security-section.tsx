"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Ban,
  Clock,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserX,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { apiFetch, formatDateTime, timeAgo } from "@/lib/client";
import { toast } from "sonner";
import type { BlockedIP, LoginSession, PlatformSettings } from "@/lib/types";

interface SecuritySectionProps {
  settings: PlatformSettings;
}

export function SecuritySection({ settings }: SecuritySectionProps) {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <Shield className="h-3 w-3" /> Security
          </>
        }
        title="Security Center"
        description="Monitor active sessions, block malicious IPs and review the platform security policy in one place."
      />

      <Tabs defaultValue="sessions">
        <TabsList className="grid w-full grid-cols-3 bg-white/5 p-1 sm:max-w-md">
          <TabsTrigger
            value="sessions"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white"
          >
            <Clock className="mr-1.5 h-3.5 w-3.5" /> Sessions
          </TabsTrigger>
          <TabsTrigger
            value="ips"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white"
          >
            <Ban className="mr-1.5 h-3.5 w-3.5" /> Blocked IPs
          </TabsTrigger>
          <TabsTrigger
            value="policy"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white"
          >
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Policy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-6">
          <SessionsTab />
        </TabsContent>
        <TabsContent value="ips" className="mt-6">
          <BlockedIPsTab />
        </TabsContent>
        <TabsContent value="policy" className="mt-6">
          <PolicyTab settings={settings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SessionsTab() {
  const [sessions, setSessions] = React.useState<LoginSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const { sessions: list } = await apiFetch<{ sessions: LoginSession[] }>(
        "/api/admin/login-sessions"
      );
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setSessions(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function revoke(s: LoginSession) {
    setBusyId(s.id);
    const prev = sessions;
    setSessions((list) => list.filter((x) => x.id !== s.id));
    try {
      await apiFetch("/api/admin/login-sessions", {
        method: "POST",
        body: JSON.stringify({ action: "revoke", id: s.id }),
      });
      toast.success("Session revoked");
    } catch (err) {
      setSessions(prev);
      toast.error(err instanceof Error ? err.message : "Revoke failed");
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = sessions.filter((s) => s.is_active).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Sessions"
          value={loading ? <Skeleton className="h-8 w-12" /> : sessions.length}
          icon={<Clock className="h-5 w-5" />}
          accent="violet"
          hint="Across all users"
        />
        <StatCard
          label="Active"
          value={
            loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="text-emerald-300">{activeCount}</span>
            )
          }
          icon={<ShieldCheck className="h-5 w-5" />}
          accent="emerald"
          hint="Currently valid"
        />
        <StatCard
          label="Revoked"
          value={
            loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="text-rose-300">{sessions.length - activeCount}</span>
            )
          }
          icon={<UserX className="h-5 w-5" />}
          accent="rose"
          hint="Manually revoked"
        />
      </div>

      <GlassCard className="flex items-center justify-between gap-3 p-4">
        <p className="text-xs text-violet-100/55">Most recent 100 sessions</p>
        <GlowButton variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </GlowButton>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        {loading && sessions.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-6 w-6" />}
            title="No sessions"
            description="Login sessions will appear here once users sign in."
            className="py-12"
          />
        ) : (
          <div className="max-h-[40rem] overflow-y-auto pr-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="text-violet-100/50">User</TableHead>
                    <TableHead className="text-violet-100/50">IP</TableHead>
                    <TableHead className="text-violet-100/50">Device</TableHead>
                    <TableHead className="text-violet-100/50">Created</TableHead>
                    <TableHead className="text-violet-100/50">Status</TableHead>
                    <TableHead className="text-right text-violet-100/50">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.2,
                        delay: Math.min(i * 0.015, 0.25),
                      }}
                      className="border-white/5 hover:bg-white/[0.03]"
                    >
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-white">
                            {s.user_email ?? s.user_id.slice(0, 8)}
                          </p>
                          <p className="truncate text-[10px] text-violet-100/40">
                            {s.browser ?? "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] font-mono text-violet-200 ring-1 ring-inset ring-white/10">
                          {s.ip_address ?? "—"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-violet-100/70">
                          {s.device ?? "—"}
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
                      <TableCell>
                        {s.is_active ? (
                          <PremiumBadge tone="emerald">Active</PremiumBadge>
                        ) : (
                          <PremiumBadge tone="rose">Revoked</PremiumBadge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.is_active && (
                          <GlowButton
                            variant="danger"
                            size="sm"
                            onClick={() => revoke(s)}
                            disabled={busyId === s.id}
                          >
                            {busyId === s.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UserX className="h-3.5 w-3.5" />
                            )}
                            Revoke
                          </GlowButton>
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
    </div>
  );
}

function BlockedIPsTab() {
  const [ips, setIps] = React.useState<BlockedIP[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [ip, setIp] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const { ips: list } = await apiFetch<{ ips: BlockedIP[] }>(
        "/api/admin/blocked-ips"
      );
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setIps(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function block() {
    if (!ip.trim()) {
      toast.error("IP address required");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/admin/blocked-ips", {
        method: "POST",
        body: JSON.stringify({ ip: ip.trim(), reason: reason.trim() || "Blocked by admin" }),
      });
      toast.success(`Blocked ${ip.trim()}`);
      setIp("");
      setReason("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Block failed");
    } finally {
      setSaving(false);
    }
  }

  async function unblock(entry: BlockedIP) {
    setBusyId(entry.id);
    const prev = ips;
    setIps((list) => list.filter((x) => x.id !== entry.id));
    try {
      await apiFetch(`/api/admin/blocked-ips?id=${encodeURIComponent(entry.id)}`, {
        method: "DELETE",
      });
      toast.success(`Unblocked ${entry.ip_address}`);
    } catch (err) {
      setIps(prev);
      toast.error(err instanceof Error ? err.message : "Unblock failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/30 to-red-500/10 text-rose-300 ring-1 ring-white/10">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Block an IP</h3>
            <p className="text-[11px] text-violet-100/45">
              Blocked IPs are denied at the auth layer.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="ip">IP Address</Label>
            <Input
              id="ip"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.1"
              className="border-white/10 bg-white/5 font-mono"
            />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Spam submissions"
              className="border-white/10 bg-white/5"
            />
          </div>
          <div className="flex items-end">
            <GlowButton variant="danger" size="md" onClick={block} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
              Block IP
            </GlowButton>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="flex items-center justify-between gap-3 p-4">
        <p className="text-xs text-violet-100/55">
          {ips.length} blocked IP{ips.length === 1 ? "" : "s"}
        </p>
        <GlowButton variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </GlowButton>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        {loading && ips.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : ips.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-6 w-6" />}
            title="No blocked IPs"
            description="The blocklist is empty. Add an IP above to deny access."
            className="py-12"
          />
        ) : (
          <div className="max-h-[30rem] overflow-y-auto pr-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="text-violet-100/50">IP</TableHead>
                    <TableHead className="text-violet-100/50">Reason</TableHead>
                    <TableHead className="text-violet-100/50">Blocked By</TableHead>
                    <TableHead className="text-violet-100/50">When</TableHead>
                    <TableHead className="text-right text-violet-100/50">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ips.map((b, i) => (
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.2,
                        delay: Math.min(i * 0.015, 0.25),
                      }}
                      className="border-white/5 hover:bg-white/[0.03]"
                    >
                      <TableCell>
                        <code className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] font-mono text-rose-200 ring-1 ring-inset ring-rose-400/20">
                          {b.ip_address}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-violet-100/70">{b.reason}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-violet-100/70">
                          {b.blocked_by_email ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[11px] text-violet-100/70">
                            {formatDateTime(b.created_at)}
                          </span>
                          <span className="text-[10px] text-violet-100/40">
                            {timeAgo(b.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <GlowButton
                          variant="ghost"
                          size="sm"
                          className="text-emerald-300 hover:text-emerald-200"
                          onClick={() => unblock(b)}
                          disabled={busyId === b.id}
                        >
                          {busyId === b.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Unblock
                        </GlowButton>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function PolicyTab({ settings }: { settings: PlatformSettings }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Min Password Length"
          value={<span className="text-violet-300">{settings.password_min_length}</span>}
          icon={<KeyRound className="h-5 w-5" />}
          accent="violet"
          hint="Enforced at signup"
        />
        <StatCard
          label="Captcha"
          value={
            settings.captcha_enabled ? (
              <PremiumBadge tone="emerald">
                <ShieldCheck className="h-3 w-3" /> Enabled
              </PremiumBadge>
            ) : (
              <PremiumBadge tone="rose">
                <ShieldAlert className="h-3 w-3" /> Disabled
              </PremiumBadge>
            )
          }
          icon={<Shield className="h-5 w-5" />}
          accent="emerald"
          hint="Bot protection"
        />
        <StatCard
          label="Rate Limit"
          value={
            <span className="text-amber-300">
              {settings.rate_limit_per_minute}/min
            </span>
          }
          icon={<Clock className="h-5 w-5" />}
          accent="amber"
          hint="Per IP / per endpoint"
        />
      </div>

      <GlassCard className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-violet-300 ring-1 ring-white/10">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Security Policy</h3>
            <p className="text-[11px] text-violet-100/45">
              Configured in Website Settings → Security tab
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <PolicyRow
            label="Minimum password length"
            value={`${settings.password_min_length} characters`}
          />
          <PolicyRow
            label="Captcha protection"
            value={settings.captcha_enabled ? "Enabled on signup & login" : "Disabled"}
            tone={settings.captcha_enabled ? "emerald" : "rose"}
          />
          <PolicyRow
            label="API rate limit"
            value={`${settings.rate_limit_per_minute} requests per minute`}
          />
          <PolicyRow
            label="Maintenance mode"
            value={settings.maintenance_mode ? "Active — site locked" : "Inactive"}
            tone={settings.maintenance_mode ? "rose" : "emerald"}
          />
          <PolicyRow
            label="Registration open"
            value={settings.registration_open ? "Open to new users" : "Closed"}
            tone={settings.registration_open ? "emerald" : "amber"}
          />
        </div>
      </GlassCard>
    </div>
  );
}

function PolicyRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "emerald" | "rose" | "amber" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.02] px-3 py-2.5 ring-1 ring-inset ring-white/5">
      <span className="text-xs font-medium text-violet-100/70">{label}</span>
      {tone === "neutral" ? (
        <span className="text-xs font-semibold text-white">{value}</span>
      ) : (
        <PremiumBadge tone={tone}>{value}</PremiumBadge>
      )}
    </div>
  );
}
