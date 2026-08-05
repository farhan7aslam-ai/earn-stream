"use client";

import * as React from "react";
import {
  Bell,
  LogOut,
  Sparkles,
  CheckCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Gift,
  CreditCard,
  ListChecks,
} from "lucide-react";
import { apiFetch, timeAgo } from "@/lib/client";
import { GlowButton, PremiumBadge } from "@/components/premium";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import type { Notification, NotificationType, SafeUser } from "@/lib/types";

interface AppTopbarProps {
  user: SafeUser;
  siteName: string;
  onLogout: () => void;
  rightSlot?: React.ReactNode;
  leftSlot?: React.ReactNode;
}

const typeIcon: Record<NotificationType, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-violet-300" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-300" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-300" />,
  error: <XCircle className="h-4 w-4 text-rose-300" />,
  payment: <CreditCard className="h-4 w-4 text-fuchsia-300" />,
  task: <ListChecks className="h-4 w-4 text-violet-300" />,
  referral: <Gift className="h-4 w-4 text-emerald-300" />,
};

export function AppTopbar({
  user,
  siteName,
  onLogout,
  rightSlot,
  leftSlot,
}: AppTopbarProps) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = React.useState(false);

  const loadNotif = React.useCallback(async () => {
    try {
      const { notifications } = await apiFetch<{ notifications: Notification[] }>(
        "/api/notifications"
      );
      setNotifications(notifications);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    loadNotif();
    const id = setInterval(loadNotif, 30000);
    return () => clearInterval(id);
  }, [loadNotif]);

  const unread = notifications.filter((n) => !n.is_read).length;

  async function markAllRead() {
    try {
      await apiFetch("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      toast.error("Could not mark notifications");
    }
  }

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    onLogout();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[rgba(9,7,15,0.72)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg glow-violet">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-none text-white">
              {siteName}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-violet-100/40">
              {user.role === "admin" ? "Admin Console" : "Earner Dashboard"}
            </p>
          </div>
        </div>

        {leftSlot}

        <div className="flex items-center gap-2">
          {rightSlot}

          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <button
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-violet-100/70 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-rose-500 px-1 text-[10px] font-bold text-white shadow-lg">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[min(92vw,360px)] border-white/10 bg-[rgba(20,16,32,0.95)] p-0 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <p className="text-sm font-semibold text-white">
                  Notifications
                </p>
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] text-violet-300 transition hover:text-violet-200"
                  >
                    <CheckCheck className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center text-xs text-violet-100/40">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 border-b border-white/5 px-4 py-3 transition hover:bg-white/[0.03] ${
                        !n.is_read ? "bg-violet-500/[0.04]" : ""
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {typeIcon[n.type]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white">
                          {n.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-violet-100/55">
                          {n.body}
                        </p>
                        <p className="mt-1 text-[10px] text-violet-100/30">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      {!n.is_read && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          <div className="hidden items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-inset ring-white/10 sm:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
              {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
            <div className="leading-tight">
              <p className="max-w-[120px] truncate text-xs font-semibold text-white">
                {user.full_name || user.email}
              </p>
              <PremiumBadge
                tone={user.role === "admin" ? "fuchsia" : "violet"}
                className="mt-0.5"
              >
                {user.role === "admin" ? "Admin" : "Earner"}
              </PremiumBadge>
            </div>
          </div>

          <GlowButton
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </GlowButton>
        </div>
      </div>
    </header>
  );
}
