"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CalendarRange,
  CheckCircle2,
  Edit3,
  Loader2,
  Megaphone,
  Pause,
  Play,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiFetch, formatDate } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import { toast } from "sonner";
import type { GmailCampaign } from "@/lib/types";

function statusTone(status: GmailCampaign["status"]): "emerald" | "amber" | "rose" | "neutral" {
  switch (status) {
    case "active":
      return "emerald";
    case "paused":
      return "amber";
    case "closed":
    case "expired":
      return "rose";
    default:
      return "neutral";
  }
}

interface FormState {
  name: string;
  description: string;
  reward: string;
  daily_limit: string;
  start_date: string;
  end_date: string;
  status: GmailCampaign["status"];
  rules: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  reward: "0",
  daily_limit: "10",
  start_date: "",
  end_date: "",
  status: "active",
  rules: "",
};

export function GmailCampaignsSection() {
  const { money } = useCurrency();
  const [campaigns, setCampaigns] = React.useState<GmailCampaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<GmailCampaign | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const { campaigns: list } = await apiFetch<{ campaigns: GmailCampaign[] }>(
        "/api/admin/gmail-campaigns"
      );
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setCampaigns(list);
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
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(c: GmailCampaign) {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description,
      reward: String(c.reward ?? 0),
      daily_limit: String(c.daily_limit ?? 0),
      start_date: c.start_date ? c.start_date.slice(0, 10) : "",
      end_date: c.end_date ? c.end_date.slice(0, 10) : "",
      status: c.status,
      rules: c.rules,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description,
        reward: Number(form.reward) || 0,
        daily_limit: Number(form.daily_limit) || 0,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
        rules: form.rules,
      };
      if (editing) {
        await apiFetch("/api/admin/gmail-campaigns", {
          method: "PATCH",
          body: JSON.stringify({ id: editing.id, ...payload }),
        });
        toast.success("Campaign updated");
      } else {
        await apiFetch("/api/admin/gmail-campaigns", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Campaign created");
      }
      setDialogOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(c: GmailCampaign, next: GmailCampaign["status"]) {
    setBusyId(c.id);
    try {
      await apiFetch("/api/admin/gmail-campaigns", {
        method: "PATCH",
        body: JSON.stringify({ id: c.id, status: next }),
      });
      toast.success(`Campaign ${next}`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setBusyId(deleteId);
    try {
      await apiFetch(
        `/api/admin/gmail-campaigns?id=${encodeURIComponent(deleteId)}`,
        { method: "DELETE" }
      );
      toast.success("Campaign deleted");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <Megaphone className="h-3 w-3" /> Gmail Campaigns
          </>
        }
        title="Campaign Manager"
        description="Group Gmail submissions into themed campaigns with custom rewards and daily limits."
      />

      <GlassCard className="flex items-center justify-between gap-3 p-4">
        <p className="text-xs text-violet-100/55">
          {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"} configured
        </p>
        <div className="flex gap-2">
          <GlowButton variant="ghost" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </GlowButton>
          <GlowButton variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            New Campaign
          </GlowButton>
        </div>
      </GlassCard>

      {loading && campaigns.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <GlassCard className="p-6">
          <EmptyState
            icon={<Megaphone className="h-6 w-6" />}
            title="No campaigns yet"
            description="Create your first Gmail campaign to start collecting themed submissions."
            action={
              <GlowButton variant="primary" size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> New Campaign
              </GlowButton>
            }
            className="py-12"
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {campaigns.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.25) }}
            >
              <GlassCard className="flex h-full flex-col p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-white">
                      {c.name}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-violet-100/45">
                      Created {formatDate(c.created_at)}
                    </p>
                  </div>
                  <PremiumBadge tone={statusTone(c.status)}>{c.status}</PremiumBadge>
                </div>

                <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-violet-100/55">
                  {c.description || "No description provided."}
                </p>

                <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-white/[0.02] p-2.5 ring-1 ring-inset ring-white/5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
                      Reward
                    </p>
                    <p className="mt-0.5 font-bold text-emerald-300 tabular-nums">
                      {money(c.reward)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.02] p-2.5 ring-1 ring-inset ring-white/5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
                      Daily Limit
                    </p>
                    <p className="mt-0.5 font-bold text-white tabular-nums">
                      {c.daily_limit || "∞"}
                    </p>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2 text-[11px] text-violet-100/45">
                  <CalendarRange className="h-3.5 w-3.5" />
                  {c.start_date || c.end_date
                    ? `${formatDate(c.start_date)} → ${formatDate(c.end_date)}`
                    : "No date range"}
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <GlowButton
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(c)}
                    disabled={busyId === c.id}
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </GlowButton>
                  {c.status === "active" ? (
                    <GlowButton
                      variant="outline"
                      size="sm"
                      onClick={() => setStatus(c, "paused")}
                      disabled={busyId === c.id}
                    >
                      {busyId === c.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Pause className="h-3.5 w-3.5" />
                      )}
                      Pause
                    </GlowButton>
                  ) : (
                    <GlowButton
                      variant="outline"
                      size="sm"
                      onClick={() => setStatus(c, "active")}
                      disabled={busyId === c.id}
                    >
                      {busyId === c.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                      Activate
                    </GlowButton>
                  )}
                  <GlowButton
                    variant="ghost"
                    size="sm"
                    className="text-rose-300 hover:text-rose-200"
                    onClick={() => setDeleteId(c.id)}
                    disabled={busyId === c.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </GlowButton>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-white/10 bg-[rgba(15,11,24,0.95)] backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editing ? "Edit Campaign" : "New Campaign"}
            </DialogTitle>
            <DialogDescription>
              Configure reward, daily limit, schedule and rules.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Fresh Gmails — 7-day age"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What kind of Gmails this campaign is collecting"
                rows={2}
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward">Reward per Gmail</Label>
              <Input
                id="reward"
                type="number"
                step="0.01"
                value={form.reward}
                onChange={(e) => setForm({ ...form, reward: e.target.value })}
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily_limit">Daily Limit</Label>
              <Input
                id="daily_limit"
                type="number"
                value={form.daily_limit}
                onChange={(e) => setForm({ ...form, daily_limit: e.target.value })}
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as GmailCampaign["status"] })
                }
              >
                <SelectTrigger id="status" className="w-full border-white/10 bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="rules">Rules</Label>
              <Textarea
                id="rules"
                value={form.rules}
                onChange={(e) => setForm({ ...form, rules: e.target.value })}
                placeholder="Rules shown to users before submitting"
                rows={3}
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
              {editing ? "Save Changes" : "Create"}
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="border-white/10 bg-[rgba(15,11,24,0.95)] backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This soft-deletes the campaign. Existing submissions are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-gradient-to-br from-rose-500 to-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
