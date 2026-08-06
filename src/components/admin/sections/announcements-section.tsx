"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import {
  EmptyState,
  GlassCard,
  GlowButton,
  PremiumBadge,
  SectionHeading,
} from "@/components/premium";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch, timeAgo } from "@/lib/client";
import { toast } from "sonner";
import type { Announcement } from "@/lib/types";

type AnnouncementType = Announcement["type"];

function typeTone(type: AnnouncementType): "violet" | "emerald" | "amber" | "rose" {
  switch (type) {
    case "info":
      return "violet";
    case "success":
      return "emerald";
    case "warning":
      return "amber";
    case "error":
      return "rose";
  }
}

function typeIcon(type: AnnouncementType) {
  switch (type) {
    case "info":
      return <Info className="h-3 w-3" />;
    case "success":
      return <CheckCircle2 className="h-3 w-3" />;
    case "warning":
      return <AlertTriangle className="h-3 w-3" />;
    case "error":
      return <AlertTriangle className="h-3 w-3" />;
  }
}

export function AnnouncementsSection() {
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [type, setType] = React.useState<AnnouncementType>("info");
  const [saving, setSaving] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const { announcements: list } = await apiFetch<{ announcements: Announcement[] }>(
        "/api/admin/announcements"
      );
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setAnnouncements(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function openCreate() {
    setTitle("");
    setBody("");
    setType("info");
    setDialogOpen(true);
  }

  async function save() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/admin/announcements", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          body,
          type,
          is_active: true,
        }),
      });
      toast.success("Announcement created");
      setDialogOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(a: Announcement, next: boolean) {
    setBusyId(a.id);
    const prev = announcements;
    setAnnouncements((list) =>
      list.map((x) => (x.id === a.id ? { ...x, is_active: next } : x))
    );
    try {
      await apiFetch("/api/admin/announcements", {
        method: "PATCH",
        body: JSON.stringify({ id: a.id, is_active: next }),
      });
      toast.success(next ? "Announcement activated" : "Announcement paused");
    } catch (err) {
      setAnnouncements(prev);
      toast.error(err instanceof Error ? err.message : "Toggle failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(a: Announcement) {
    setBusyId(a.id);
    const prev = announcements;
    setAnnouncements((list) => list.filter((x) => x.id !== a.id));
    try {
      await apiFetch(
        `/api/admin/announcements?id=${encodeURIComponent(a.id)}`,
        { method: "DELETE" }
      );
      toast.success("Announcement deleted");
    } catch (err) {
      setAnnouncements(prev);
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <Megaphone className="h-3 w-3" /> Announcements
          </>
        }
        title="Broadcast Center"
        description="Publish platform-wide announcements. Active ones appear on the public landing page and the user dashboard."
      />

      <GlassCard className="flex items-center justify-between gap-3 p-4">
        <p className="text-xs text-violet-100/55">
          {announcements.length} total ·{" "}
          {announcements.filter((a) => a.is_active).length} active
        </p>
        <div className="flex gap-2">
          <GlowButton variant="ghost" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </GlowButton>
          <GlowButton variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            New Announcement
          </GlowButton>
        </div>
      </GlassCard>

      {loading && announcements.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <GlassCard className="p-6">
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title="No announcements"
            description="Publish your first announcement to broadcast news to all users."
            action={
              <GlowButton variant="primary" size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> New Announcement
              </GlowButton>
            }
            className="py-12"
          />
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {announcements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.25) }}
            >
              <GlassCard className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <PremiumBadge tone={typeTone(a.type)}>
                        {typeIcon(a.type)}
                        {a.type}
                      </PremiumBadge>
                      <span className="text-[11px] text-violet-100/40">
                        {timeAgo(a.created_at)}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {a.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-violet-100/55">
                      {a.body || "No body provided."}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-2.5 py-1.5 ring-1 ring-inset ring-white/5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/50">
                        Active
                      </span>
                      <Switch
                        checked={a.is_active}
                        onCheckedChange={(v) => toggleActive(a, v)}
                        disabled={busyId === a.id}
                      />
                    </div>
                    <GlowButton
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-300 hover:text-rose-200"
                      onClick={() => remove(a)}
                      disabled={busyId === a.id}
                    >
                      {busyId === a.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </GlowButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg border-white/10 bg-[rgba(15,11,24,0.95)] backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">New Announcement</DialogTitle>
            <DialogDescription>
              Will be visible to all users once active.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ann-title">Title *</Label>
              <Input
                id="ann-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Maintenance window tonight"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-type">Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as AnnouncementType)}
              >
                <SelectTrigger id="ann-type" className="w-full border-white/10 bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-body">Body</Label>
              <Textarea
                id="ann-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Details of the announcement…"
                rows={4}
                className="border-white/10 bg-white/5"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <GlowButton variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>
              <X className="h-3.5 w-3.5" /> Cancel
            </GlowButton>
            <GlowButton variant="primary" size="sm" onClick={save} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Publish
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
