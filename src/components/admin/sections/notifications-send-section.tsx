"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Send,
  Users,
  XCircle,
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
import { apiFetch, formatDateTime, timeAgo } from "@/lib/client";
import { toast } from "sonner";
import type { NotificationQueueEntry, NotificationType } from "@/lib/types";

type TargetType = NotificationQueueEntry["target_type"];

const TYPE_OPTIONS: NotificationType[] = [
  "info",
  "success",
  "warning",
  "error",
  "payment",
  "task",
  "referral",
];

const TARGET_OPTIONS: TargetType[] = [
  "all",
  "single",
  "multiple",
  "country",
  "subscription",
  "status",
];

function typeTone(type: NotificationType): "violet" | "emerald" | "amber" | "rose" | "fuchsia" {
  switch (type) {
    case "info":
      return "violet";
    case "success":
      return "emerald";
    case "warning":
      return "amber";
    case "error":
      return "rose";
    case "payment":
      return "emerald";
    case "task":
      return "violet";
    case "referral":
      return "fuchsia";
  }
}

function statusTone(status: NotificationQueueEntry["status"]): "emerald" | "amber" | "rose" {
  switch (status) {
    case "sent":
      return "emerald";
    case "queued":
      return "amber";
    case "failed":
      return "rose";
  }
}

function statusIcon(status: NotificationQueueEntry["status"]) {
  switch (status) {
    case "sent":
      return <CheckCircle2 className="h-3 w-3" />;
    case "queued":
      return <Clock className="h-3 w-3" />;
    case "failed":
      return <XCircle className="h-3 w-3" />;
  }
}

export function NotificationsSendSection() {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [type, setType] = React.useState<NotificationType>("info");
  const [targetType, setTargetType] = React.useState<TargetType>("all");
  const [userId, setUserId] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const [queue, setQueue] = React.useState<NotificationQueueEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const { queue: list } = await apiFetch<{ queue: NotificationQueueEntry[] }>(
        "/api/admin/notification-queue"
      );
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setQueue(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function send() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    if (targetType === "single" && !userId.trim()) {
      toast.error("user_id is required for single-target notifications");
      return;
    }
    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        body: body.trim(),
        type,
        target_type: targetType,
      };
      if (targetType === "single") payload.user_id = userId.trim();
      await apiFetch("/api/admin/send-notification", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Notification sent");
      setTitle("");
      setBody("");
      setUserId("");
      setType("info");
      setTargetType("all");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  const sentCount = queue.filter((q) => q.status === "sent").length;
  const failedCount = queue.filter((q) => q.status === "failed").length;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <Bell className="h-3 w-3" /> Notifications
          </>
        }
        title="Broadcast Center"
        description="Send targeted or platform-wide notifications. Choose audience, type and content — then track delivery in the queue below."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Sent"
          value={loading ? <Skeleton className="h-8 w-12" /> : queue.length}
          icon={<Bell className="h-5 w-5" />}
          accent="violet"
          hint="All-time broadcasts"
        />
        <StatCard
          label="Delivered"
          value={
            loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="text-emerald-300">{sentCount}</span>
            )
          }
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="emerald"
          hint="Successfully sent"
        />
        <StatCard
          label="Failed"
          value={
            loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="text-rose-300">{failedCount}</span>
            )
          }
          icon={<XCircle className="h-5 w-5" />}
          accent="rose"
          hint="Delivery errors"
        />
      </div>

      {/* Compose */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-violet-300 ring-1 ring-white/10">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Compose</h3>
              <p className="text-[11px] text-violet-100/45">Draft a new notification</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="notif-title">Title *</Label>
              <Input
                id="notif-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New withdrawal method available"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="notif-body">Body *</Label>
              <Textarea
                id="notif-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write the message body…"
                rows={3}
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-type">Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as NotificationType)}
              >
                <SelectTrigger id="notif-type" className="w-full border-white/10 bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-target">Target</Label>
              <Select
                value={targetType}
                onValueChange={(v) => setTargetType(v as TargetType)}
              >
                <SelectTrigger id="notif-target" className="w-full border-white/10 bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {targetType === "single" && (
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="notif-user">User ID *</Label>
                <Input
                  id="notif-user"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Paste the target user UUID"
                  className="border-white/10 bg-white/5 font-mono"
                />
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <GlowButton variant="primary" size="md" onClick={send} disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Notification
            </GlowButton>
          </div>
        </GlassCard>
      </motion.div>

      {/* Queue */}
      <GlassCard className="flex items-center justify-between gap-3 p-4">
        <p className="text-xs text-violet-100/55">
          {queue.length} notification{queue.length === 1 ? "" : "s"} in queue
        </p>
        <GlowButton variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </GlowButton>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        {loading && queue.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No notifications sent yet"
            description="Use the compose form above to send your first broadcast."
            className="py-12"
          />
        ) : (
          <div className="max-h-[34rem] overflow-y-auto pr-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="text-violet-100/50">Title</TableHead>
                    <TableHead className="text-violet-100/50">Type</TableHead>
                    <TableHead className="text-violet-100/50">Target</TableHead>
                    <TableHead className="text-violet-100/50">Status</TableHead>
                    <TableHead className="text-violet-100/50">Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((q, i) => (
                    <motion.tr
                      key={q.id}
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
                          <p className="truncate text-xs font-semibold text-white">
                            {q.title}
                          </p>
                          <p className="truncate text-[10px] text-violet-100/45">
                            {q.body}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PremiumBadge tone={typeTone(q.type)}>{q.type}</PremiumBadge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-violet-100/70">{q.target_type}</span>
                      </TableCell>
                      <TableCell>
                        <PremiumBadge tone={statusTone(q.status)}>
                          {statusIcon(q.status)}
                          {q.status}
                        </PremiumBadge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[11px] text-violet-100/70">
                            {formatDateTime(q.sent_at ?? q.created_at)}
                          </span>
                          <span className="text-[10px] text-violet-100/40">
                            {timeAgo(q.sent_at ?? q.created_at)}
                          </span>
                        </div>
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
