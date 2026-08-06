"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  ListChecks,
  Loader2,
  Music2,
  Pause,
  Pin,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
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
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch, formatDateTime } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import { toast } from "sonner";
import type { TikTokTask, TikTokTaskStatus, TikTokTaskType } from "@/lib/types";

type StatusFilter = "all" | TikTokTaskStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
];

const TASK_TYPES: TikTokTaskType[] = ["LIKE", "FOLLOW", "COMMENT", "SHARE"];

function taskTypeTone(type: TikTokTaskType): "violet" | "fuchsia" | "emerald" | "amber" {
  switch (type) {
    case "LIKE":
      return "fuchsia";
    case "FOLLOW":
      return "violet";
    case "COMMENT":
      return "amber";
    case "SHARE":
      return "emerald";
  }
}

function statusTone(status: TikTokTaskStatus): "emerald" | "amber" | "rose" | "violet" | "neutral" {
  switch (status) {
    case "active":
    case "published":
      return "emerald";
    case "paused":
      return "amber";
    case "closed":
    case "cancelled":
      return "rose";
    case "draft":
      return "violet";
    default:
      return "neutral";
  }
}

interface FormState {
  title: string;
  description: string;
  tiktok_username: string;
  tiktok_video_url: string;
  task_type: TikTokTaskType;
  reward_per_user: string;
  max_participants: string;
  expiry_date: string;
  priority: string;
  instructions: string;
  comment_text: string;
  status: TikTokTaskStatus;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  tiktok_username: "",
  tiktok_video_url: "",
  task_type: "LIKE",
  reward_per_user: "0",
  max_participants: "100",
  expiry_date: "",
  priority: "0",
  instructions: "",
  comment_text: "",
  status: "active",
};

export function TaskManagerSection() {
  const { money } = useCurrency();
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [tasks, setTasks] = React.useState<TikTokTask[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TikTokTask | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      const { tasks: list } = await apiFetch<{ tasks: TikTokTask[] }>(
        `/api/admin/tasks-cms?${params.toString()}`
      );
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTasks(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [status]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(task: TikTokTask) {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description,
      tiktok_username: task.tiktok_username,
      tiktok_video_url: task.tiktok_video_url,
      task_type: task.task_type,
      reward_per_user: String(task.reward_per_user ?? 0),
      max_participants: String(task.max_participants ?? 0),
      expiry_date: task.expiry_date ? task.expiry_date.slice(0, 10) : "",
      priority: String(task.priority ?? 0),
      instructions: task.instructions ?? "",
      comment_text: task.comment_text ?? "",
      status: task.status,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description,
        tiktok_username: form.tiktok_username,
        tiktok_video_url: form.tiktok_video_url,
        task_type: form.task_type,
        reward_per_user: Number(form.reward_per_user) || 0,
        max_participants: Number(form.max_participants) || 0,
        expiry_date: form.expiry_date ? form.expiry_date : null,
        priority: Number(form.priority) || 0,
        instructions: form.instructions,
        comment_text: form.task_type === "COMMENT" ? form.comment_text : null,
        status: form.status,
      };
      if (editing) {
        await apiFetch("/api/admin/tasks-cms", {
          method: "PATCH",
          body: JSON.stringify({ id: editing.id, ...payload }),
        });
        toast.success("Task updated");
      } else {
        await apiFetch("/api/admin/tasks-cms", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Task created");
      }
      setDialogOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function patchStatus(task: TikTokTask, next: TikTokTaskStatus) {
    setBusyId(task.id);
    try {
      await apiFetch("/api/admin/tasks-cms", {
        method: "PATCH",
        body: JSON.stringify({ id: task.id, status: next }),
      });
      toast.success(`Task marked ${next}`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function closeTask(task: TikTokTask) {
    setBusyId(task.id);
    try {
      await apiFetch("/api/admin/tasks-cms", {
        method: "PATCH",
        body: JSON.stringify({ id: task.id, action: "close" }),
      });
      toast.success("Task closed");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Close failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTask(task: TikTokTask) {
    setBusyId(task.id);
    try {
      await apiFetch(`/api/admin/tasks-cms?id=${encodeURIComponent(task.id)}`, {
        method: "DELETE",
      });
      toast.success("Task deleted");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function duplicateTask(task: TikTokTask) {
    setBusyId(task.id);
    try {
      await apiFetch("/api/admin/tasks-cms", {
        method: "POST",
        body: JSON.stringify({
          title: `${task.title} (Copy)`,
          description: task.description,
          tiktok_username: task.tiktok_username,
          tiktok_video_url: task.tiktok_video_url,
          tiktok_video_id: task.tiktok_video_id,
          task_type: task.task_type,
          reward_per_user: task.reward_per_user,
          max_participants: task.max_participants,
          expiry_date: task.expiry_date,
          priority: task.priority,
          instructions: task.instructions,
          comment_text: task.comment_text,
        }),
      });
      toast.success("Task duplicated");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Duplicate failed");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleFeatured(task: TikTokTask) {
    setBusyId(task.id);
    try {
      await apiFetch("/api/admin/tasks-cms", {
        method: "PATCH",
        body: JSON.stringify({ id: task.id, featured: !task.featured }),
      });
      toast.success(task.featured ? "Unfeatured" : "Featured");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function togglePinned(task: TikTokTask) {
    setBusyId(task.id);
    try {
      await apiFetch("/api/admin/tasks-cms", {
        method: "PATCH",
        body: JSON.stringify({ id: task.id, pinned: !task.pinned }),
      });
      toast.success(task.pinned ? "Unpinned" : "Pinned");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <Music2 className="h-3 w-3" /> TikTok Tasks
          </>
        }
        title="Task Manager"
        description="Create, edit and moderate TikTok micro-tasks. Control rewards, slot caps, priority and lifecycle status."
      />

      <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-4">
        <ToggleGroup
          type="single"
          value={status}
          onValueChange={(v) => v && setStatus(v as StatusFilter)}
          className="flex flex-wrap gap-1"
        >
          {STATUS_FILTERS.map((f) => (
            <ToggleGroupItem
              key={f.value}
              value={f.value}
              className="data-[state=on]:bg-gradient-to-br data-[state=on]:from-violet-500 data-[state=on]:to-fuchsia-500 data-[state=on]:text-white"
            >
              {f.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex gap-2">
          <GlowButton variant="ghost" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </GlowButton>
          <GlowButton variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Create Task
          </GlowButton>
        </div>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        {loading && tasks.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<ListChecks className="h-6 w-6" />}
            title="No tasks found"
            description="Create your first TikTok micro-task to start accepting submissions."
            action={
              <GlowButton variant="primary" size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> Create Task
              </GlowButton>
            }
            className="py-12"
          />
        ) : (
          <div className="max-h-[40rem] overflow-y-auto pr-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="text-violet-100/50">Title</TableHead>
                    <TableHead className="text-violet-100/50">Type</TableHead>
                    <TableHead className="text-violet-100/50">Reward</TableHead>
                    <TableHead className="text-violet-100/50">Slots</TableHead>
                    <TableHead className="text-violet-100/50">Status</TableHead>
                    <TableHead className="text-violet-100/50">Priority</TableHead>
                    <TableHead className="text-right text-violet-100/50">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task, i) => {
                    const slotsPct =
                      task.max_participants > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (task.completed_count / task.max_participants) * 100
                            )
                          )
                        : 0;
                    return (
                      <motion.tr
                        key={task.id}
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
                            <p className="truncate text-sm font-semibold text-white">
                              {task.title}
                            </p>
                            <p className="truncate text-[11px] text-violet-100/45">
                              @{task.tiktok_username || "—"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <PremiumBadge tone={taskTypeTone(task.task_type)}>
                            {task.task_type}
                          </PremiumBadge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-bold text-emerald-300 tabular-nums">
                            {money(task.reward_per_user)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-white tabular-nums">
                              {task.completed_count}/{task.max_participants || "∞"}
                            </span>
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/8">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500"
                                style={{ width: `${slotsPct}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <PremiumBadge tone={statusTone(task.status)}>
                            {task.status}
                          </PremiumBadge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold text-violet-200/80 tabular-nums">
                            P{task.priority}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {busyId === task.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-violet-300" />
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <GlowButton variant="ghost" size="icon" className="h-8 w-8">
                                    <Edit3 className="h-4 w-4" />
                                  </GlowButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => openEdit(task)}>
                                    <Edit3 className="h-3.5 w-3.5" /> Edit
                                  </DropdownMenuItem>
                                  {task.status === "active" ? (
                                    <DropdownMenuItem onClick={() => patchStatus(task, "paused")}>
                                      <Pause className="h-3.5 w-3.5" /> Pause
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => patchStatus(task, "active")}>
                                      <Play className="h-3.5 w-3.5" /> Activate
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => patchStatus(task, "draft")}>
                                    <Clock className="h-3.5 w-3.5" /> Set Draft
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => patchStatus(task, "published")}>
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Publish
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => toggleFeatured(task)}>
                                    <Star className="h-3.5 w-3.5" /> {task.featured ? "Unfeature" : "Feature"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => togglePinned(task)}>
                                    <Pin className="h-3.5 w-3.5" /> {task.pinned ? "Unpin" : "Pin"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => duplicateTask(task)}>
                                    <Copy className="h-3.5 w-3.5" /> Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => closeTask(task)}>
                                    <XCircle className="h-3.5 w-3.5" /> Close
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => deleteTask(task)}
                                    className="text-rose-300 focus:text-rose-200"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </GlassCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-white/10 bg-[rgba(15,11,24,0.95)] backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editing ? "Edit Task" : "Create Task"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the task configuration below."
                : "Configure a new TikTok micro-task. Users will see it on their dashboard once active."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Like our latest video"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short summary visible in the task card"
                rows={2}
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok_username">TikTok Username</Label>
              <Input
                id="tiktok_username"
                value={form.tiktok_username}
                onChange={(e) => setForm({ ...form, tiktok_username: e.target.value })}
                placeholder="earnstream.official"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok_video_url">TikTok Video URL</Label>
              <Input
                id="tiktok_video_url"
                value={form.tiktok_video_url}
                onChange={(e) => setForm({ ...form, tiktok_video_url: e.target.value })}
                placeholder="https://www.tiktok.com/@user/video/123"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task_type">Task Type</Label>
              <Select
                value={form.task_type}
                onValueChange={(v) => setForm({ ...form, task_type: v as TikTokTaskType })}
              >
                <SelectTrigger id="task_type" className="w-full border-white/10 bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as TikTokTaskStatus })}
              >
                <SelectTrigger id="status" className="w-full border-white/10 bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward_per_user">Reward per user</Label>
              <Input
                id="reward_per_user"
                type="number"
                step="0.01"
                value={form.reward_per_user}
                onChange={(e) => setForm({ ...form, reward_per_user: e.target.value })}
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_participants">Max participants</Label>
              <Input
                id="max_participants"
                type="number"
                value={form.max_participants}
                onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="Step-by-step guidance shown to users"
                rows={3}
                className="border-white/10 bg-white/5"
              />
            </div>
            {form.task_type === "COMMENT" && (
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="comment_text">Comment Text</Label>
                <Textarea
                  id="comment_text"
                  value={form.comment_text}
                  onChange={(e) => setForm({ ...form, comment_text: e.target.value })}
                  placeholder="The exact comment users should post"
                  rows={2}
                  className="border-white/10 bg-white/5"
                />
              </div>
            )}
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
              {editing ? "Save Changes" : "Create Task"}
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {tasks.length > 0 && (
        <p className="text-[11px] text-violet-100/40">
          Last refreshed {formatDateTime(new Date().toISOString())} · showing{" "}
          {tasks.length} task{tasks.length === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}
