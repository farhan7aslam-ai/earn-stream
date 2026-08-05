"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Ban,
  CalendarPlus,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  Loader2,
  MoreHorizontal,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  Wallet as WalletIcon,
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
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  apiFetch,
  formatDate,
  formatDateTime,
  timeAgo,
} from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import type {
  Payment,
  Referral,
  SafeUser,
  TaskRow,
  User,
} from "@/lib/types";
import {
  FeeStatusFor,
  JoiningFeePill,
  PaymentStatusPill,
  TaskTypePill,
  UserStatusPill,
  initialsOf,
  methodLabel,
} from "../shared";

interface UsersSectionProps {
  tick: number;
}

interface Activity {
  tasks: TaskRow[];
  payments: Payment[];
  referrals: Referral[];
}

export function UsersSection({ tick }: UsersSectionProps) {
  const { money } = useCurrency();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");

  // Dialogs
  const [editProfileFor, setEditProfileFor] = React.useState<User | null>(
    null
  );
  const [editLedgerFor, setEditLedgerFor] = React.useState<User | null>(null);
  const [referralFor, setReferralFor] = React.useState<User | null>(null);
  const [extendFor, setExtendFor] = React.useState<User | null>(null);
  const [activityFor, setActivityFor] = React.useState<User | null>(null);
  const [banFor, setBanFor] = React.useState<User | null>(null);

  // Debounced search
  React.useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}` : "";
      const { users: list } = await apiFetch<{ users: User[] }>(
        `/api/admin/users/list${qs}`
      );
      setUsers(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    refresh();
  }, [search, tick]);

  function patchUserLocally(id: string, patch: Partial<User>) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
    );
  }

  async function patchUser(id: string, patch: Record<string, unknown>) {
    const { user: updated } = await apiFetch<{ user: SafeUser }>(
      "/api/admin/users",
      {
        method: "PATCH",
        body: JSON.stringify({ id, ...patch }),
      }
    );
    patchUserLocally(id, updated);
    return updated;
  }

  async function toggleFeePaid(u: User) {
    patchUserLocally(u.id, { joining_fee_paid: !u.joining_fee_paid });
    try {
      await patchUser(u.id, { joining_fee_paid: !u.joining_fee_paid });
      toast.success(
        `Joining fee ${!u.joining_fee_paid ? "marked paid" : "marked unpaid"}`
      );
    } catch (err) {
      patchUserLocally(u.id, { joining_fee_paid: u.joining_fee_paid });
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function suspendUser(u: User) {
    patchUserLocally(u.id, { is_suspended: true });
    try {
      await patchUser(u.id, { is_suspended: true });
      toast.success(`${u.full_name || u.email} suspended`);
    } catch (err) {
      patchUserLocally(u.id, { is_suspended: u.is_suspended });
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function unbanUser(u: User) {
    patchUserLocally(u.id, { is_banned: false, is_suspended: false });
    try {
      await patchUser(u.id, { is_banned: false, is_suspended: false });
      toast.success(`${u.full_name || u.email} reinstated`);
    } catch (err) {
      patchUserLocally(u.id, {
        is_banned: u.is_banned,
        is_suspended: u.is_suspended,
      });
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function banUser(u: User) {
    patchUserLocally(u.id, { is_banned: true });
    try {
      await patchUser(u.id, { is_banned: true });
      toast.success(`${u.full_name || u.email} banned`);
    } catch (err) {
      patchUserLocally(u.id, { is_banned: u.is_banned });
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <Users className="h-3 w-3" /> Users
          </>
        }
        title="Member management"
        description="Search, audit, and manage every member — balances, subscription status, joining fee, bans, and full activity history."
      />

      {/* Search bar */}
      <GlassCard className="p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-100/40" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, phone, or referral code…"
            className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-violet-100/30"
          />
        </div>
      </GlassCard>

      {/* Users table */}
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">
              All Members
            </h3>
            <p className="mt-0.5 text-xs text-violet-100/45">
              {users.length} {users.length === 1 ? "user" : "users"}
              {search ? ` matching “${search}”` : ""}
            </p>
          </div>
          <PremiumBadge tone="violet">
            <UserCog className="h-3 w-3" />
            Full control
          </PremiumBadge>
        </div>

        {loading && users.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title={search ? "No matches found" : "No active logs found"}
            description={
              search
                ? "Try a different search term."
                : "Registered users will appear here automatically once they sign up."
            }
          />
        ) : (
          <div className="max-h-[34rem] overflow-y-auto pr-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="text-violet-100/50">User</TableHead>
                    <TableHead className="text-violet-100/50">Phone</TableHead>
                    <TableHead className="text-violet-100/50">
                      Referral
                    </TableHead>
                    <TableHead className="text-violet-100/50">Balance</TableHead>
                    <TableHead className="text-violet-100/50">Fee</TableHead>
                    <TableHead className="text-violet-100/50">
                      Subscription
                    </TableHead>
                    <TableHead className="text-violet-100/50">Status</TableHead>
                    <TableHead className="text-right text-violet-100/50">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u, i) => {
                    const fee = FeeStatusFor(u.subscription_end_date);
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: 0.2,
                          delay: Math.min(i * 0.015, 0.25),
                        }}
                        className="border-white/5 hover:bg-white/[0.03]"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 ring-1 ring-inset ring-white/10">
                              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
                                {initialsOf(u.full_name, u.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                {u.full_name || "Unnamed"}
                              </p>
                              <p className="truncate text-[11px] text-violet-100/45">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-violet-100/70">
                            {u.phone || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] font-mono text-violet-200 ring-1 ring-inset ring-white/10">
                            {u.referral_code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-emerald-300 tabular-nums">
                            {money(u.balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <JoiningFeePill paid={u.joining_fee_paid} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-violet-100/65">
                              {formatDate(u.subscription_end_date)}
                            </span>
                            <PremiumBadge tone={fee.tone}>{fee.label}</PremiumBadge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <UserStatusPill
                            isBanned={u.is_banned}
                            isSuspended={u.is_suspended}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-violet-100/70 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white"
                                aria-label="User actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-52 border-white/10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl"
                            >
                              <DropdownMenuLabel className="text-violet-100/55">
                                {u.full_name || u.email}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-white/8" />
                              <DropdownMenuItem
                                onClick={() => setEditProfileFor(u)}
                                className="text-violet-100/80 focus:bg-white/5 focus:text-white"
                              >
                                <UserCog className="h-4 w-4" />
                                Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setEditLedgerFor(u)}
                                className="text-violet-100/80 focus:bg-white/5 focus:text-white"
                              >
                                <WalletIcon className="h-4 w-4" />
                                Edit Balances
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setActivityFor(u)}
                                className="text-violet-100/80 focus:bg-white/5 focus:text-white"
                              >
                                <Eye className="h-4 w-4" />
                                View activity
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setExtendFor(u)}
                                className="text-violet-100/80 focus:bg-white/5 focus:text-white"
                              >
                                <CalendarPlus className="h-4 w-4" />
                                Extend subscription
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setReferralFor(u)}
                                className="text-violet-100/80 focus:bg-white/5 focus:text-white"
                              >
                                <Gift className="h-4 w-4" />
                                Referral Settings
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toggleFeePaid(u)}
                                className="text-violet-100/80 focus:bg-white/5 focus:text-white"
                              >
                                {u.joining_fee_paid ? (
                                  <>
                                    <XCircle className="h-4 w-4" />
                                    Mark fee unpaid
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Mark fee paid
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/8" />
                              {u.is_banned || u.is_suspended ? (
                                <DropdownMenuItem
                                  onClick={() => unbanUser(u)}
                                  className="text-emerald-300 focus:bg-emerald-500/10 focus:text-emerald-200"
                                >
                                  <ShieldCheck className="h-4 w-4" />
                                  Reinstate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => suspendUser(u)}
                                  className="text-amber-300 focus:bg-amber-500/10 focus:text-amber-200"
                                >
                                  <Sparkles className="h-4 w-4" />
                                  Suspend
                                </DropdownMenuItem>
                              )}
                              {!u.is_banned && (
                                <DropdownMenuItem
                                  onClick={() => setBanFor(u)}
                                  className="text-rose-300 focus:bg-rose-500/10 focus:text-rose-200"
                                >
                                  <Ban className="h-4 w-4" />
                                  Ban user
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Edit profile dialog */}
      {editProfileFor && (
        <EditProfileDialog
          user={editProfileFor}
          onOpenChange={(o) => !o && setEditProfileFor(null)}
          onSaved={(u) => {
            patchUserLocally(u.id, u);
            setEditProfileFor(null);
            refresh();
          }}
        />
      )}

      {/* Edit balances dialog */}
      {editLedgerFor && (
        <EditLedgerDialog
          user={editLedgerFor}
          onOpenChange={(o) => !o && setEditLedgerFor(null)}
          onSaved={(u) => {
            patchUserLocally(u.id, u);
            setEditLedgerFor(null);
            refresh();
          }}
        />
      )}

      {/* Referral settings dialog */}
      {referralFor && (
        <ReferralSettingsDialog
          user={referralFor}
          onOpenChange={(o) => !o && setReferralFor(null)}
          onSaved={(u) => {
            patchUserLocally(u.id, u);
            setReferralFor(null);
            refresh();
          }}
        />
      )}

      {/* Extend subscription dialog */}
      {extendFor && (
        <ExtendSubscriptionDialog
          user={extendFor}
          onOpenChange={(o) => !o && setExtendFor(null)}
          onSaved={(u) => {
            patchUserLocally(u.id, u);
            setExtendFor(null);
          }}
        />
      )}

      {/* Activity dialog */}
      {activityFor && (
        <ActivityDialog
          user={activityFor}
          onOpenChange={(o) => !o && setActivityFor(null)}
        />
      )}

      {/* Ban confirm dialog */}
      <AlertDialog
        open={banFor !== null}
        onOpenChange={(o) => !o && setBanFor(null)}
      >
        <AlertDialogContent className="border-rose-400/20 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <Ban className="h-5 w-5 text-rose-400" />
              Ban {banFor?.full_name || banFor?.email}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-violet-100/55">
              Banning permanently revokes access. The user can no longer log
              in. You can reinstate later from the user menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/5 text-violet-100 hover:bg-white/10 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (banFor) banUser(banFor);
                setBanFor(null);
              }}
              className="border-0 bg-gradient-to-br from-rose-500 to-red-600 text-white hover:brightness-110"
            >
              <Ban className="h-4 w-4" />
              Confirm ban
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditProfileDialog({
  user,
  onOpenChange,
  onSaved,
}: {
  user: User;
  onOpenChange: (o: boolean) => void;
  onSaved: (u: SafeUser) => void;
}) {
  const [fullName, setFullName] = React.useState(user.full_name);
  const [email, setEmail] = React.useState(user.email);
  const [phone, setPhone] = React.useState(user.phone);
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setFullName(user.full_name);
    setEmail(user.email);
    setPhone(user.phone);
    setPassword("");
    setShowPassword(false);
  }, [user.id, user.full_name, user.email, user.phone]);

  async function save() {
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      toast.error("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (password && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        id: user.id,
        full_name: fullName.trim(),
        email: emailTrimmed,
        phone: phone.trim(),
      };
      if (password) body.password = password;
      const { user: updated } = await apiFetch<{ user: SafeUser }>(
        "/api/admin/users",
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      );
      toast.success("Profile updated");
      onSaved(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <UserCog className="h-4 w-4 text-violet-300" />
            Edit Profile
          </DialogTitle>
          <DialogDescription className="text-violet-100/55">
            Update profile details for{" "}
            <span className="font-semibold text-white">
              {user.full_name || user.email}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
              Full Name
            </Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className="border-white/10 bg-white/5 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
              Email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="border-white/10 bg-white/5 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
              Phone
            </Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 3XX XXXXXXX"
              className="border-white/10 bg-white/5 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
              Password
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="border-white/10 bg-white/5 pr-10 text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-violet-100/60 transition hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-violet-100/45">
              Leave blank to keep current. Min 6 chars.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <GlowButton
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancel
          </GlowButton>
          <GlowButton
            variant="primary"
            onClick={save}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save changes
              </>
            )}
          </GlowButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditLedgerDialog({
  user,
  onOpenChange,
  onSaved,
}: {
  user: User;
  onOpenChange: (o: boolean) => void;
  onSaved: (u: SafeUser) => void;
}) {
  const [balance, setBalance] = React.useState(user.balance.toFixed(2));
  const [pending, setPending] = React.useState(
    user.pending_earnings.toFixed(2)
  );
  const [earned, setEarned] = React.useState(user.total_earned.toFixed(2));
  const [withdrawn, setWithdrawn] = React.useState(
    user.total_withdrawn.toFixed(2)
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setBalance(user.balance.toFixed(2));
    setPending(user.pending_earnings.toFixed(2));
    setEarned(user.total_earned.toFixed(2));
    setWithdrawn(user.total_withdrawn.toFixed(2));
  }, [
    user.id,
    user.balance,
    user.pending_earnings,
    user.total_earned,
    user.total_withdrawn,
  ]);

  async function save() {
    const b = Number(balance);
    const p = Number(pending);
    const e = Number(earned);
    const w = Number(withdrawn);
    if (![b, p, e, w].every((n) => Number.isFinite(n) && n >= 0)) {
      toast.error("All balances must be valid non-negative numbers");
      return;
    }
    setSaving(true);
    try {
      const { user: updated } = await apiFetch<{ user: SafeUser }>(
        "/api/admin/users",
        {
          method: "PATCH",
          body: JSON.stringify({
            id: user.id,
            balance: b,
            pending_earnings: p,
            total_earned: e,
            total_withdrawn: w,
          }),
        }
      );
      toast.success("Ledger balances updated");
      onSaved(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <WalletIcon className="h-4 w-4 text-violet-300" />
            Edit Balances
          </DialogTitle>
          <DialogDescription className="text-violet-100/55">
            Adjust the wallet ledger for{" "}
            <span className="font-semibold text-white">
              {user.full_name || user.email}
            </span>
            . All amounts are in Rs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <LedgerField
            label="Current Balance"
            value={balance}
            onChange={setBalance}
            tone="emerald"
          />
          <LedgerField
            label="Pending Balance"
            value={pending}
            onChange={setPending}
            tone="amber"
          />
          <LedgerField
            label="Total Earned"
            value={earned}
            onChange={setEarned}
            tone="violet"
          />
          <LedgerField
            label="Total Withdrawn"
            value={withdrawn}
            onChange={setWithdrawn}
            tone="fuchsia"
          />
        </div>

        <DialogFooter className="gap-2">
          <GlowButton
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancel
          </GlowButton>
          <GlowButton
            variant="primary"
            onClick={save}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save ledger
              </>
            )}
          </GlowButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LedgerField({
  label,
  value,
  onChange,
  tone,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tone: "emerald" | "amber" | "violet" | "fuchsia";
}) {
  const dot = {
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    violet: "bg-violet-400",
    fuchsia: "bg-fuchsia-400",
  }[tone];
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-violet-100/45">
          Rs
        </span>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border-white/10 bg-white/5 pl-9 text-white"
        />
      </div>
    </div>
  );
}

function ReferralSettingsDialog({
  user,
  onOpenChange,
  onSaved,
}: {
  user: User;
  onOpenChange: (o: boolean) => void;
  onSaved: (u: SafeUser) => void;
}) {
  const [referredBy, setReferredBy] = React.useState(user.referred_by ?? "");
  const [bonusPercent, setBonusPercent] = React.useState(
    user.custom_referral_bonus_percent === null
      ? ""
      : String(user.custom_referral_bonus_percent)
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setReferredBy(user.referred_by ?? "");
    setBonusPercent(
      user.custom_referral_bonus_percent === null
        ? ""
        : String(user.custom_referral_bonus_percent)
    );
  }, [user.id, user.referred_by, user.custom_referral_bonus_percent]);

  async function save() {
    const bonusValue = bonusPercent.trim();
    let bonus: number | null = null;
    if (bonusValue !== "") {
      const n = Number(bonusValue);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        toast.error("Bonus percent must be between 0 and 100");
        return;
      }
      bonus = n;
    }
    setSaving(true);
    try {
      const { user: updated } = await apiFetch<{ user: SafeUser }>(
        "/api/admin/users",
        {
          method: "PATCH",
          body: JSON.stringify({
            id: user.id,
            referred_by: referredBy.trim(),
            custom_referral_bonus_percent: bonus,
          }),
        }
      );
      toast.success("Referral settings updated");
      onSaved(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Gift className="h-4 w-4 text-fuchsia-300" />
            Referral Settings
          </DialogTitle>
          <DialogDescription className="text-violet-100/55">
            Configure the referral chain and bonus override for{" "}
            <span className="font-semibold text-white">
              {user.full_name || user.email}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-violet-100/55">User's referral code</span>
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-violet-200 ring-1 ring-inset ring-white/10">
              {user.referral_code}
            </code>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
              Referred By
            </Label>
            <Input
              value={referredBy}
              onChange={(e) => setReferredBy(e.target.value)}
              placeholder="Referrer's user ID or referral code"
              className="border-white/10 bg-white/5 text-white"
            />
            <p className="text-[11px] text-violet-100/45">
              Enter the referrer's user ID or referral code. Leave blank to
              clear.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
              Custom Referral Bonus %
            </Label>
            <Input
              type="number"
              step="1"
              min="0"
              max="100"
              value={bonusPercent}
              onChange={(e) => setBonusPercent(e.target.value)}
              placeholder="Global setting"
              className="border-white/10 bg-white/5 text-white"
            />
            <p className="text-[11px] text-violet-100/45">
              Leave blank to use the global setting.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <GlowButton
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancel
          </GlowButton>
          <GlowButton
            variant="primary"
            onClick={save}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save settings
              </>
            )}
          </GlowButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExtendSubscriptionDialog({
  user,
  onOpenChange,
  onSaved,
}: {
  user: User;
  onOpenChange: (o: boolean) => void;
  onSaved: (u: SafeUser) => void;
}) {
  const [days, setDays] = React.useState("30");
  const [saving, setSaving] = React.useState(false);

  const currentEnd = user.subscription_end_date
    ? new Date(user.subscription_end_date).getTime()
    : null;
  const base = currentEnd && currentEnd > Date.now() ? currentEnd : Date.now();
  const projected = new Date(base + Number(days || 0) * 86400000);

  async function save() {
    const d = Number(days);
    if (!Number.isFinite(d) || d <= 0) {
      toast.error("Enter a valid number of days");
      return;
    }
    setSaving(true);
    try {
      const newIso = new Date(base + d * 86400000).toISOString();
      const { user: updated } = await apiFetch<{ user: SafeUser }>(
        "/api/admin/users",
        {
          method: "PATCH",
          body: JSON.stringify({
            id: user.id,
            subscription_end_date: newIso,
            is_suspended: false,
          }),
        }
      );
      toast.success(`Subscription extended by ${d} days`);
      onSaved(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <CalendarPlus className="h-4 w-4 text-violet-300" />
            Extend Subscription
          </DialogTitle>
          <DialogDescription className="text-violet-100/55">
            Extend{" "}
            <span className="font-semibold text-white">
              {user.full_name || user.email}
            </span>
            &apos;s subscription by adding days from today (or the current end
            date if still active).
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-violet-100/55">Current end date</span>
            <span className="font-semibold text-white">
              {formatDate(user.subscription_end_date)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-violet-100/55">Projected new end</span>
            <span className="font-semibold text-emerald-300">
              {formatDate(projected.toISOString())}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-violet-100/70">
            Days to add
          </Label>
          <Input
            type="number"
            min="1"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="border-white/10 bg-white/5 text-white"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[7, 14, 30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(String(d))}
                className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-violet-200 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white"
              >
                +{d}d
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <GlowButton
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancel
          </GlowButton>
          <GlowButton
            variant="primary"
            onClick={save}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Extending…
              </>
            ) : (
              <>
                <CalendarPlus className="h-4 w-4" />
                Extend
              </>
            )}
          </GlowButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActivityDialog({
  user,
  onOpenChange,
}: {
  user: User;
  onOpenChange: (o: boolean) => void;
}) {
  const { money } = useCurrency();
  const [activity, setActivity] = React.useState<Activity | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { activity } = await apiFetch<{ activity: Activity }>(
          `/api/admin/users?id=${encodeURIComponent(user.id)}`
        );
        if (!cancelled) setActivity(activity);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const tasks = activity?.tasks ?? [];
  const payments = activity?.payments ?? [];
  const referrals = activity?.referrals ?? [];

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Avatar className="h-7 w-7 ring-1 ring-inset ring-white/10">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-bold text-white">
                {initialsOf(user.full_name, user.email)}
              </AvatarFallback>
            </Avatar>
            {user.full_name || user.email}
          </DialogTitle>
          <DialogDescription className="text-violet-100/55">
            {user.email} · joined {formatDate(user.created_at)}
          </DialogDescription>
        </DialogHeader>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-2">
          <ActivityStat
            label="Tasks"
            value={tasks.length}
            tone="violet"
          />
          <ActivityStat
            label="Payments"
            value={payments.length}
            tone="fuchsia"
          />
          <ActivityStat
            label="Referrals"
            value={referrals.length}
            tone="emerald"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={<XCircle className="h-6 w-6" />}
            title="Could not load activity"
            description={error}
          />
        ) : (
          <Tabs defaultValue="tasks">
            <TabsList className="bg-white/5">
              <TabsTrigger value="tasks" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">
                Tasks ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">
                Payments ({payments.length})
              </TabsTrigger>
              <TabsTrigger value="referrals" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">
                Referrals ({referrals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks">
              <ActivityList
                empty={
                  <EmptyState
                    icon={<CheckCircle2 className="h-6 w-6" />}
                    title="No tasks"
                    description="This user has not submitted any tasks yet."
                  />
                }
                items={tasks.map((t) => ({
                  id: t.id,
                  left: <TaskTypePill type={t.type} />,
                  middle: (
                    <>
                      <p className="text-xs text-violet-100/55">
                        {formatDateTime(t.created_at)} · {timeAgo(t.created_at)}
                      </p>
                      {t.note && (
                        <p className="mt-0.5 truncate text-[11px] text-rose-300/80">
                          {t.note}
                        </p>
                      )}
                    </>
                  ),
                  right: (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-semibold text-emerald-300">
                        {money(t.reward)}
                      </span>
                      <PaymentStatusPill status={t.status} />
                    </div>
                  ),
                }))}
              />
            </TabsContent>

            <TabsContent value="payments">
              <ActivityList
                empty={
                  <EmptyState
                    icon={<WalletIcon className="h-6 w-6" />}
                    title="No payments"
                    description="No wallet transactions recorded for this user."
                  />
                }
                items={payments.map((p) => ({
                  id: p.id,
                  left: (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-white">
                        {methodLabel(p.method)} · {p.type.replace("_", " ")}
                      </span>
                      <span className="text-[11px] text-violet-100/45">
                        {formatDateTime(p.created_at)}
                      </span>
                    </div>
                  ),
                  middle: (
                    <p className="truncate text-[11px] text-violet-100/45">
                      {p.account || "—"}
                    </p>
                  ),
                  right: (
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          p.amount >= 0 ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {p.amount >= 0 ? "+" : "−"} {money(Math.abs(p.amount))}
                      </span>
                      <PaymentStatusPill status={p.status} />
                    </div>
                  ),
                }))}
              />
            </TabsContent>

            <TabsContent value="referrals">
              <ActivityList
                empty={
                  <EmptyState
                    icon={<Sparkles className="h-6 w-6" />}
                    title="No referrals"
                    description="This user has not referred anyone yet."
                  />
                }
                items={referrals.map((r) => ({
                  id: r.id,
                  left: (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-white">
                        User {r.referred_id.slice(0, 8)}
                      </span>
                      <span className="text-[11px] text-violet-100/45">
                        {formatDateTime(r.created_at)}
                      </span>
                    </div>
                  ),
                  middle: (
                    <span className="text-[11px] text-violet-100/45">
                      bonus {money(r.bonus_amount)}
                    </span>
                  ),
                  right: (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-semibold text-fuchsia-300">
                        {money(r.bonus_amount)}
                      </span>
                      <PremiumBadge
                        tone={r.status === "credited" ? "emerald" : "amber"}
                      >
                        {r.status}
                      </PremiumBadge>
                    </div>
                  ),
                }))}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ActivityStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "violet" | "fuchsia" | "emerald";
}) {
  const toneMap = {
    violet: "text-violet-300 bg-violet-500/10 ring-violet-400/20",
    fuchsia: "text-fuchsia-300 bg-fuchsia-500/10 ring-fuchsia-400/20",
    emerald: "text-emerald-300 bg-emerald-500/10 ring-emerald-400/20",
  } as const;
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
      <div
        className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset ${toneMap[tone]}`}
      >
        <span className="text-[10px] font-bold">{value}</span>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
        {label}
      </p>
    </div>
  );
}

function ActivityList({
  items,
  empty,
}: {
  items: Array<{
    id: string;
    left: React.ReactNode;
    middle: React.ReactNode;
    right: React.ReactNode;
  }>;
  empty: React.ReactNode;
}) {
  if (items.length === 0) return <>{empty}</>;
  return (
    <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
      {items.map((it) => (
        <div
          key={it.id}
          className="flex items-center gap-3 rounded-lg bg-white/[0.02] px-3 py-2 ring-1 ring-inset ring-white/5"
        >
          <div className="min-w-0 flex-1">{it.left}</div>
          <div className="min-w-0 flex-1">{it.middle}</div>
          <div className="shrink-0">{it.right}</div>
        </div>
      ))}
    </div>
  );
}
