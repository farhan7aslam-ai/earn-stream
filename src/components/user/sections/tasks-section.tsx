"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  ImagePlus,
  Link2,
  ListChecks,
  Lock,
  Mail,
  Music2,
  Play,
  Send,
  ShieldCheck,
  Timer,
  Upload,
  X,
} from "lucide-react";
import {
  GlassCard,
  GlowButton,
  PremiumBadge,
  SectionHeading,
  EmptyState,
} from "@/components/premium";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, formatDateTime, timeAgo } from "@/lib/client";
import { toast } from "sonner";
import type {
  PlatformSettings,
  SafeUser,
  TaskAttempt,
  TaskRow,
  TaskStatus,
  TaskType,
} from "@/lib/types";
import { TASK_TYPE_LABEL } from "@/lib/types";
import {
  StatusPill,
  TASK_DESCRIPTIONS,
  TASK_URLS,
} from "../shared";

interface TasksSectionProps {
  user: SafeUser;
  settings: PlatformSettings;
  tasks: TaskRow[];
  refresh: () => void;
}

const TASK_ICONS: Record<TaskType, React.ReactNode> = {
  gmail: <Mail className="h-5 w-5" />,
  tiktok: <Music2 className="h-5 w-5" />,
};

const TASK_ACCENTS: Record<TaskType, "violet" | "fuchsia"> = {
  gmail: "violet",
  tiktok: "fuchsia",
};

const TASK_TYPES: TaskType[] = ["gmail", "tiktok"];

const COUNTDOWN_SECONDS = 15;

export function TasksSection({
  user,
  settings,
  tasks,
  refresh,
}: TasksSectionProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const sortedTasks = [...tasks].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const approvedCount = tasks.filter((t) => t.status === "approved").length;
  const totalReward = tasks
    .filter((t) => t.status === "approved")
    .reduce((sum, t) => sum + t.reward, 0);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={<><ListChecks className="h-3 w-3" /> Earn</>}
        title="Task Studio"
        description="Complete tasks with a 15-second anti-cheat timer. Screenshots are reviewed by our admin team before rewards are credited."
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip label="Total Submissions" value={tasks.length} tone="violet" />
        <StatChip label="Pending Review" value={pendingCount} tone="amber" />
        <StatChip label="Approved" value={approvedCount} tone="emerald" />
        <StatChip
          label="Earned (approved)"
          value={`Rs ${totalReward.toFixed(2)}`}
          tone="fuchsia"
        />
      </div>

      {!user.joining_fee_paid && (
        <GlassCard
          variant="strong"
          border="gradient"
          glow="soft"
          className="p-5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/30 to-orange-500/10 text-amber-300 ring-1 ring-white/10">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Tasks are locked until you pay the joining fee
              </p>
              <p className="mt-0.5 text-xs text-violet-100/55">
                You can preview task types below, but submissions require an
                active joining fee. Visit the Overview tab to pay.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Task cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {TASK_TYPES.map((type, i) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          >
            <TaskCard
              type={type}
              settings={settings}
              joiningPaid={user.joining_fee_paid}
              onSubmitted={refresh}
            />
          </motion.div>
        ))}
      </div>

      {/* Submissions */}
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">My Submissions</h3>
            <p className="mt-0.5 text-xs text-violet-100/45">
              All tasks you've submitted, newest first
            </p>
          </div>
          <PremiumBadge tone="violet">
            <ListChecks className="h-3 w-3" />
            {tasks.length} {tasks.length === 1 ? "submission" : "submissions"}
          </PremiumBadge>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            icon={<ListChecks className="h-6 w-6" />}
            title="No submissions yet"
            description="Pick a task above and complete the 15-second timer to submit your first task. Earnings land in your pending balance."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/8 hover:bg-transparent">
                  <TableHead className="text-violet-100/50">Task</TableHead>
                  <TableHead className="text-violet-100/50">Screenshot</TableHead>
                  <TableHead className="text-violet-100/50">Reward</TableHead>
                  <TableHead className="text-violet-100/50">Status</TableHead>
                  <TableHead className="text-violet-100/50">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.map((t) => (
                  <TableRow
                    key={t.id}
                    className="border-white/5"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-violet-300 ring-1 ring-inset ring-white/10">
                          {TASK_ICONS[t.type]}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {TASK_TYPE_LABEL[t.type]}
                          </p>
                          <p className="max-w-[180px] truncate text-[11px] text-violet-100/40">
                            {t.task_url}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {t.screenshot_url ? (
                        <button
                          onClick={() => setPreviewUrl(t.screenshot_url)}
                          className="group relative flex h-12 w-16 items-center justify-center overflow-hidden rounded-lg bg-white/5 ring-1 ring-inset ring-white/10 transition hover:ring-violet-400/40"
                          aria-label="View screenshot"
                        >
                          <ScreenshotThumb url={t.screenshot_url} />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                            <Eye className="h-4 w-4 text-white" />
                          </span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-violet-100/30">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-emerald-300">
                        +Rs {t.reward.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <StatusPill status={t.status} />
                        {t.note && t.status === "rejected" && (
                          <span className="max-w-[200px] text-[10px] leading-tight text-rose-300/70">
                            {t.note}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-violet-100/70">
                        {formatDateTime(t.created_at)}
                      </p>
                      <p className="text-[10px] text-violet-100/40">
                        {timeAgo(t.created_at)}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>

      {/* Screenshot preview dialog */}
      <Dialog open={previewUrl !== null} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent
          showCloseButton
          className="border-white/10 bg-[rgba(20,16,32,0.95)] p-2 backdrop-blur-xl sm:max-w-3xl"
        >
          <DialogTitle className="sr-only">Screenshot preview</DialogTitle>
          <DialogDescription className="sr-only">
            Submitted task screenshot
          </DialogDescription>
          {previewUrl && (
            <div className="relative max-h-[80vh] overflow-hidden rounded-xl bg-black/40">
              <ScreenshotLarge url={previewUrl} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Task card with anti-cheat countdown ---------- */

type FlowState =
  | { kind: "idle" }
  | {
      kind: "running";
      attemptId: string;
      startedAt: number;
      secondsLeft: number;
    }
  | {
      kind: "ready";
      attemptId: string;
      startedAt: number;
      durationMs: number;
    }
  | { kind: "submitting"; attemptId: string; durationMs: number };

function TaskCard({
  type,
  settings,
  joiningPaid,
  onSubmitted,
}: {
  type: TaskType;
  settings: PlatformSettings;
  joiningPaid: boolean;
  onSubmitted: () => void;
}) {
  const reward =
    type === "gmail"
      ? settings.gmail_task_rate
      : settings.tiktok_like_rate;
  const taskUrl = TASK_URLS[type];
  const description = TASK_DESCRIPTIONS[type];
  const accent = TASK_ACCENTS[type];

  const [state, setState] = React.useState<FlowState>({ kind: "idle" });
  const [screenshot, setScreenshot] = React.useState("");
  const [showIframe, setShowIframe] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Countdown ticker
  React.useEffect(() => {
    if (state.kind !== "running") return;
    if (state.secondsLeft <= 0) {
      const durationMs = Date.now() - state.startedAt;
      setState({
        kind: "ready",
        attemptId: state.attemptId,
        startedAt: state.startedAt,
        durationMs,
      });
      return;
    }
    const id = setTimeout(() => {
      setState((s) =>
        s.kind === "running" ? { ...s, secondsLeft: s.secondsLeft - 1 } : s
      );
    }, 1000);
    return () => clearTimeout(id);
  }, [state]);

  function reset() {
    setState({ kind: "idle" });
    setScreenshot("");
    setShowIframe(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function startTask() {
    if (!joiningPaid) {
      toast.error("Pay the joining fee first to unlock tasks.");
      return;
    }
    setState({
      kind: "running",
      attemptId: "",
      startedAt: Date.now(),
      secondsLeft: COUNTDOWN_SECONDS,
    });
    setShowIframe(true);
    try {
      const { attempt } = await apiFetch<{ attempt: TaskAttempt }>(
        "/api/tasks/attempts",
        {
          method: "POST",
          body: JSON.stringify({ task_type: type, task_url: taskUrl }),
        }
      );
      setState((s) =>
        s.kind === "running"
          ? { ...s, attemptId: attempt.id, startedAt: Date.now() }
          : s
      );
      toast.success("Task started — timer running.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start task");
      reset();
    }
  }

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 4_500_000) {
      toast.error("Image is too large (max ~4.5MB). Use a smaller screenshot.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setScreenshot(String(reader.result || ""));
    reader.onerror = () => toast.error("Could not read file");
    reader.readAsDataURL(file);
  }

  async function submit() {
    if (state.kind !== "ready") return;
    if (!screenshot.trim()) {
      toast.error("Attach a screenshot first");
      return;
    }
    setState({ kind: "submitting", attemptId: state.attemptId, durationMs: state.durationMs });
    try {
      await apiFetch<{ task: TaskRow }>("/api/tasks/submit", {
        method: "POST",
        body: JSON.stringify({
          type,
          task_url: taskUrl,
          screenshot_url: screenshot,
          attempt_id: state.attemptId || undefined,
          duration_ms: state.durationMs,
        }),
      });
      toast.success("Task submitted! Reward pending review.");
      reset();
      onSubmitted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
      setState({
        kind: "ready",
        attemptId: state.attemptId,
        startedAt: state.startedAt,
        durationMs: state.durationMs,
      });
    }
  }

  const accentRing =
    accent === "violet"
      ? "from-violet-500/20 to-fuchsia-500/5 text-violet-300"
      : accent === "fuchsia"
        ? "from-fuchsia-500/20 to-rose-500/5 text-fuchsia-300"
        : "from-emerald-500/20 to-teal-500/5 text-emerald-300";

  const progress =
    state.kind === "running"
      ? ((COUNTDOWN_SECONDS - state.secondsLeft) / COUNTDOWN_SECONDS) * 100
      : state.kind === "ready" || state.kind === "submitting"
        ? 100
        : 0;

  return (
    <GlassCard
      variant="panel"
      border="gradient"
      className="flex flex-col p-5"
    >
      {/* header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-white/10 ${accentRing}`}
          >
            {TASK_ICONS[type]}
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {TASK_TYPE_LABEL[type]}
            </p>
            <p className="text-[11px] text-violet-100/45">
              Reward per task
            </p>
          </div>
        </div>
        <PremiumBadge tone={accent}>
          +Rs {reward.toFixed(2)}
        </PremiumBadge>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-violet-100/55">
        {description}
      </p>

      {/* state-driven body */}
      <div className="flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          {state.kind === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-[11px] text-violet-100/60 ring-1 ring-inset ring-white/5">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-violet-300" />
                <span className="truncate font-mono">{taskUrl}</span>
              </div>
              <GlowButton
                onClick={startTask}
                className="w-full"
                disabled={!joiningPaid}
                variant={accent === "violet" ? "primary" : accent === "fuchsia" ? "primary" : "success"}
              >
                <Play className="h-4 w-4" />
                Start Task
              </GlowButton>
              {!joiningPaid && (
                <p className="flex items-center justify-center gap-1 text-[10px] text-amber-300/70">
                  <Lock className="h-3 w-3" />
                  Unlock with joining fee
                </p>
              )}
            </motion.div>
          )}

          {state.kind === "running" && (
            <motion.div
              key="running"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <CountdownTimer secondsLeft={state.secondsLeft} progress={progress} />
              {showIframe && (
                <div className="relative overflow-hidden rounded-xl border border-white/8 bg-black/30">
                  <iframe
                    src={taskUrl}
                    title={`${TASK_TYPE_LABEL[type]} preview`}
                    className="h-40 w-full"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-violet-400/20" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <GlowButton
                  variant="secondary"
                  size="sm"
                  asChild
                  className="flex-1"
                >
                  <a href={taskUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in new tab
                  </a>
                </GlowButton>
                <GlowButton
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="flex-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </GlowButton>
              </div>
              <p className="flex items-center justify-center gap-1.5 text-[10px] text-violet-100/40">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                Anti-cheat timer running — submit unlocks at 0
              </p>
            </motion.div>
          )}

          {state.kind === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 ring-1 ring-inset ring-emerald-400/25">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <p className="text-xs font-medium text-emerald-200">
                  Timer complete — submit your screenshot now
                </p>
              </div>

              <ScreenshotUploader
                screenshot={screenshot}
                onFile={handleFile}
                onUrl={setScreenshot}
                onClear={() => setScreenshot("")}
                fileInputRef={fileInputRef}
              />

              <div className="flex items-center gap-2">
                <GlowButton
                  variant="secondary"
                  size="sm"
                  asChild
                  className="flex-1"
                >
                  <a href={taskUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open task
                  </a>
                </GlowButton>
                <GlowButton
                  variant="success"
                  size="sm"
                  onClick={submit}
                  disabled={!screenshot.trim()}
                  className="flex-1"
                >
                  <Send className="h-3.5 w-3.5" />
                  Submit Task
                </GlowButton>
              </div>
              <button
                onClick={reset}
                className="w-full text-center text-[10px] text-violet-100/40 transition hover:text-violet-100/70"
              >
                Start over
              </button>
            </motion.div>
          )}

          {state.kind === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-3 py-8"
            >
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-2xl bg-violet-500/40" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
                  <Upload className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-violet-100/60">Submitting task…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}

function CountdownTimer({
  secondsLeft,
  progress,
}: {
  secondsLeft: number;
  progress: number;
}) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 p-4 ring-1 ring-inset ring-violet-400/20">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-violet-200">
          <Timer className="h-3.5 w-3.5" />
          Anti-cheat timer
        </div>
        <div className="flex items-baseline gap-1 font-mono">
          <span
            className={`text-2xl font-bold tabular-nums ${
              secondsLeft <= 3 ? "text-rose-300" : "text-white"
            }`}
          >
            {String(secondsLeft).padStart(2, "0")}
          </span>
          <span className="text-[11px] text-violet-100/40">s</span>
        </div>
      </div>
      <Progress
        value={progress}
        className="h-1.5 bg-white/8"
      />
      <p className="mt-2 flex items-center gap-1 text-[10px] text-violet-100/40">
        <Clock className="h-3 w-3" />
        Wait for the timer — submit unlocks at 0
      </p>
    </div>
  );
}

function ScreenshotUploader({
  screenshot,
  onFile,
  onUrl,
  onClear,
  fileInputRef,
}: {
  screenshot: string;
  onFile: (f: File) => void;
  onUrl: (s: string) => void;
  onClear: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [mode, setMode] = React.useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = React.useState("");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
        <button
          onClick={() => setMode("file")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition ${
            mode === "file"
              ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
              : "text-violet-100/55 hover:text-white"
          }`}
        >
          <Upload className="h-3 w-3" />
          Upload
        </button>
        <button
          onClick={() => setMode("url")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition ${
            mode === "url"
              ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
              : "text-violet-100/55 hover:text-white"
          }`}
        >
          <Link2 className="h-3 w-3" />
          Paste URL
        </button>
      </div>

      {screenshot ? (
        <div className="relative overflow-hidden rounded-lg border border-white/8 bg-black/30">
          <ScreenshotThumb url={screenshot} />
          <button
            onClick={onClear}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white ring-1 ring-inset ring-white/20 transition hover:bg-rose-500/80"
            aria-label="Remove screenshot"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : mode === "file" ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center transition hover:border-violet-400/40 hover:bg-violet-500/5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/5 text-violet-300 ring-1 ring-white/10">
            <ImagePlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">
              Click to upload screenshot
            </p>
            <p className="mt-0.5 text-[10px] text-violet-100/40">
              PNG, JPG · max 4.5MB
            </p>
          </div>
        </button>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-[11px] text-violet-100/60">
            Screenshot URL
          </Label>
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://imgur.com/..."
              className="border-white/10 bg-white/5 text-white placeholder:text-violet-100/30"
            />
            <GlowButton
              variant="secondary"
              size="sm"
              onClick={() => {
                if (urlInput.trim().length < 8) {
                  toast.error("Enter a valid URL");
                  return;
                }
                onUrl(urlInput.trim());
              }}
            >
              Add
            </GlowButton>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}

function ScreenshotThumb({ url }: { url: string }) {
  const [error, setError] = React.useState(false);
  React.useEffect(() => setError(false), [url]);
  if (error || !url) {
    return (
      <div className="flex h-12 w-16 items-center justify-center text-[10px] text-violet-100/30">
        No image
      </div>
    );
  }
  return (
    <img
      src={url}
      alt="Task screenshot"
      className="h-12 w-16 object-cover"
      onError={() => setError(true)}
    />
  );
}

function ScreenshotLarge({ url }: { url: string }) {
  const [error, setError] = React.useState(false);
  React.useEffect(() => setError(false), [url]);
  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-violet-100/40">
        Could not load image.
      </div>
    );
  }
  return (
    <img
      src={url}
      alt="Task screenshot (full size)"
      className="max-h-[80vh] w-full object-contain"
      onError={() => setError(true)}
    />
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone: "violet" | "fuchsia" | "emerald" | "amber";
}) {
  const toneMap = {
    violet: "text-violet-200 ring-violet-400/20 bg-violet-500/8",
    fuchsia: "text-fuchsia-200 ring-fuchsia-400/20 bg-fuchsia-500/8",
    emerald: "text-emerald-200 ring-emerald-400/20 bg-emerald-500/8",
    amber: "text-amber-200 ring-amber-400/20 bg-amber-500/8",
  } as const;
  return (
    <GlassCard className="p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
        {label}
      </p>
      <p
        className={`mt-1.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-base font-bold tabular-nums ring-1 ring-inset ${toneMap[tone]}`}
      >
        {value}
      </p>
    </GlassCard>
  );
}
