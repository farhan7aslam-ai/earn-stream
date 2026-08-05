"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AtSign,
  CalendarDays,
  CreditCard,
  Globe,
  Infinity as InfinityIcon,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Mailbox,
  MapPin,
  Music2,
  Percent,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  Users,
  Wallet,
} from "lucide-react";
import {
  GlassCard,
  GlowButton,
  PremiumBadge,
  SectionHeading,
} from "@/components/premium";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { apiFetch } from "@/lib/client";
import type { PlatformSettings, SafeUser } from "@/lib/types";

interface SettingsSectionProps {
  settings: PlatformSettings;
  /** The current admin user (for the Admin Profile tab). */
  adminUser: SafeUser;
  onSettingsChange: (s: PlatformSettings) => void;
  onAdminUserChange: (u: SafeUser) => void;
}

type FormState = Omit<PlatformSettings, "id" | "updated_at">;

const SIGNUP_OPTIONS = [0, 1, 2, 3, 4, 5, 10, 20, 50];
const CURRENCY_OPTIONS = ["Rs", "PKR", "$", "€", "£", "₹", "د.إ", "﷼"];

export function SettingsSection({
  settings,
  adminUser,
  onSettingsChange,
  onAdminUserChange,
}: SettingsSectionProps) {
  const [tab, setTab] = React.useState<"branding" | "fees" | "security">(
    "branding"
  );

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <SettingsIcon className="h-3 w-3" /> Master Portal
          </>
        }
        title="Master Configuration"
        description="Total dynamic control over branding, fees, merchants, and admin security — no code edits required. Changes apply instantly across the entire platform."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid w-full grid-cols-3 bg-white/5 p-1 sm:max-w-md">
          <TabsTrigger
            value="branding"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white text-violet-100/60"
          >
            <Globe className="mr-1.5 h-3.5 w-3.5" />
            Branding
          </TabsTrigger>
          <TabsTrigger
            value="fees"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white text-violet-100/60"
          >
            <Wallet className="mr-1.5 h-3.5 w-3.5" />
            Fees & Merchants
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white text-violet-100/60"
          >
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            Admin Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="mt-5">
          <BrandingTab settings={settings} onSettingsChange={onSettingsChange} />
        </TabsContent>
        <TabsContent value="fees" className="mt-5">
          <FeesTab settings={settings} onSettingsChange={onSettingsChange} />
        </TabsContent>
        <TabsContent value="security" className="mt-5">
          <SecurityTab
            adminUser={adminUser}
            onAdminUserChange={onAdminUserChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ───────────────────────────── BRANDING TAB ───────────────────────────── */

function BrandingTab({
  settings,
  onSettingsChange,
}: {
  settings: PlatformSettings;
  onSettingsChange: (s: PlatformSettings) => void;
}) {
  const [draft, setDraft] = React.useState<FormState>(() => toForm(settings));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setDraft(toForm(settings)), [settings]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setDraft((p) => ({ ...p, [key]: value }));
  }

  const original = React.useMemo(() => toForm(settings), [settings]);
  const dirtyKeys = useDirtyKeys(original, draft);
  const isDirty = dirtyKeys.length > 0;

  async function save() {
    if (!isDirty) return;
    setSaving(true);
    const patch: Record<string, unknown> = {};
    for (const k of dirtyKeys) patch[k] = draft[k];
    try {
      const { settings: updated } = await apiFetch<{ settings: PlatformSettings }>(
        "/api/admin/settings",
        { method: "PATCH", body: JSON.stringify(patch) }
      );
      onSettingsChange(updated);
      setDraft(toForm(updated));
      toast.success(
        dirtyKeys.length === 1 ? "Branding updated" : `${dirtyKeys.length} branding fields updated`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 lg:col-span-2"
      >
        {/* Branding */}
        <GlassCard variant="panel" border="gradient" className="p-5 sm:p-6">
          <SectionHeader
            icon={<Globe className="h-4 w-4" />}
            tone="violet"
            title="Global Branding"
            subtitle="Website title, logo text, support contact, and footer"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldRow label="Website Title" icon={<Sparkles className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("site_name")}>
              <Input value={draft.site_name} onChange={(e) => setField("site_name", e.target.value)} placeholder="EarnStream" className="border-white/10 bg-white/5 text-white" />
            </FieldRow>
            <FieldRow label="Navbar Logo Text" icon={<Tag className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("nav_logo_text")}>
              <Input value={draft.nav_logo_text} onChange={(e) => setField("nav_logo_text", e.target.value)} placeholder="EarnStream" className="border-white/10 bg-white/5 text-white" />
            </FieldRow>
            <FieldRow label="Support Contact Email" icon={<Mail className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("support_email")}>
              <Input type="email" value={draft.support_email} onChange={(e) => setField("support_email", e.target.value)} placeholder="support@earnstream.io" className="border-white/10 bg-white/5 text-white" />
            </FieldRow>
            <FieldRow label="Footer Notice" icon={<Mailbox className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("footer_notice")}>
              <Input value={draft.footer_notice} onChange={(e) => setField("footer_notice", e.target.value)} placeholder="© EarnStream. All rights reserved." className="border-white/10 bg-white/5 text-white" />
            </FieldRow>
          </div>
        </GlassCard>

        {/* Currency */}
        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            icon={<Tag className="h-4 w-4" />}
            tone="emerald"
            title="Currency Display"
            subtitle="Symbol/prefix shown across all money displays"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldRow label="Currency Symbol / Prefix" hint="e.g. Rs, PKR, $, €" icon={<Wallet className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("currency_symbol")}>
              <Select value={draft.currency_symbol} onValueChange={(v) => setField("currency_symbol", v)}>
                <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Live Preview" icon={<Sparkles className="h-3.5 w-3.5" />}>
              <div className="flex h-10 items-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold text-emerald-300">
                {draft.currency_symbol} {Number(draft.gmail_task_rate || 0).toFixed(2)}
              </div>
            </FieldRow>
          </div>
        </GlassCard>

        {/* Access & signups */}
        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            icon={<Users className="h-4 w-4" />}
            tone="fuchsia"
            title="Access & Signups"
            subtitle="Monthly signup capacity"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldRow label="Monthly Signup Limit" hint="0 = unlimited" icon={<Users className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("monthly_signup_limit")}>
              <Select value={String(draft.monthly_signup_limit)} onValueChange={(v) => setField("monthly_signup_limit", Number(v))}>
                <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  {SIGNUP_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={String(opt)}>
                      {opt === 0 ? (
                        <span className="flex items-center gap-1.5">
                          <InfinityIcon className="h-3.5 w-3.5 text-emerald-300" />
                          Unlimited
                        </span>
                      ) : (
                        `${opt} per month`
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          </div>
        </GlassCard>
      </motion.div>

      <SavePanel
        isDirty={isDirty}
        dirtyKeys={dirtyKeys}
        original={original}
        draft={draft}
        saving={saving}
        onSave={save}
        onReset={() => setDraft(original)}
      />
    </div>
  );
}

/* ───────────────────────────── FEES TAB ───────────────────────────── */

function FeesTab({
  settings,
  onSettingsChange,
}: {
  settings: PlatformSettings;
  onSettingsChange: (s: PlatformSettings) => void;
}) {
  const [draft, setDraft] = React.useState<FormState>(() => toForm(settings));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setDraft(toForm(settings)), [settings]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setDraft((p) => ({ ...p, [key]: value }));
  }

  const original = React.useMemo(() => toForm(settings), [settings]);
  const dirtyKeys = useDirtyKeys(original, draft);
  const isDirty = dirtyKeys.length > 0;

  async function save() {
    if (!isDirty) return;
    setSaving(true);
    const patch: Record<string, unknown> = {};
    for (const k of dirtyKeys) patch[k] = draft[k];
    try {
      const { settings: updated } = await apiFetch<{ settings: PlatformSettings }>(
        "/api/admin/settings",
        { method: "PATCH", body: JSON.stringify(patch) }
      );
      onSettingsChange(updated);
      setDraft(toForm(updated));
      toast.success(
        dirtyKeys.length === 1 ? "Fee updated" : `${dirtyKeys.length} fields updated`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const cur = draft.currency_symbol;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 lg:col-span-2"
      >
        {/* Fees */}
        <GlassCard variant="panel" border="gradient" className="p-5 sm:p-6">
          <SectionHeader
            icon={<CreditCard className="h-4 w-4" />}
            tone="amber"
            title="Fee & Subscription Management"
            subtitle="Registration, monthly renewal, and cashout limits"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldRow label={`Registration / Joining Fee (${cur})`} icon={<Sparkles className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("joining_fee")}>
              <Input type="number" step="0.01" min="0" value={draft.joining_fee} onChange={(e) => setField("joining_fee", Number(e.target.value))} className="border-white/10 bg-white/5 text-white" />
            </FieldRow>
            <FieldRow label={`Monthly Subscription Fee (${cur})`} icon={<CreditCard className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("subscription_fee")}>
              <Input type="number" step="0.01" min="0" value={draft.subscription_fee} onChange={(e) => setField("subscription_fee", Number(e.target.value))} className="border-white/10 bg-white/5 text-white" />
            </FieldRow>
            <FieldRow label="Subscription Duration (days)" icon={<CalendarDays className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("subscription_duration_days")}>
              <Input type="number" min="1" value={draft.subscription_duration_days} onChange={(e) => setField("subscription_duration_days", Number(e.target.value))} className="border-white/10 bg-white/5 text-white" />
            </FieldRow>
            <FieldRow label={`Minimum Payout / Cashout Limit (${cur})`} hint="Lowest amount a user can withdraw" icon={<Wallet className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("minimum_payout")}>
              <Input type="number" step="0.01" min="0" value={draft.minimum_payout} onChange={(e) => setField("minimum_payout", Number(e.target.value))} className="border-white/10 bg-white/5 text-white" />
            </FieldRow>
          </div>
        </GlassCard>

        {/* Task rates */}
        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            icon={<Wallet className="h-4 w-4" />}
            tone="emerald"
            title="Task Reward Rates"
            subtitle="Per-task rewards credited on approval"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FieldRow label={`Gmail Task (${cur})`} icon={<Mail className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("gmail_task_rate")}>
              <Input type="number" step="0.01" min="0" value={draft.gmail_task_rate} onChange={(e) => setField("gmail_task_rate", Number(e.target.value))} className="border-white/10 bg-white/5 text-white" />
            </FieldRow>
            <FieldRow label={`TikTok Like (${cur})`} icon={<Music2 className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("tiktok_like_rate")}>
              <Input type="number" step="0.01" min="0" value={draft.tiktok_like_rate} onChange={(e) => setField("tiktok_like_rate", Number(e.target.value))} className="border-white/10 bg-white/5 text-white" />
            </FieldRow>
            <FieldRow label="Referral Bonus (%)" icon={<Percent className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("referral_bonus_percent")}>
              <Input type="number" min="0" max="100" value={draft.referral_bonus_percent} onChange={(e) => setField("referral_bonus_percent", Number(e.target.value))} className="border-white/10 bg-white/5 text-white" />
            </FieldRow>
          </div>
        </GlassCard>

        {/* Merchant Account Manager */}
        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            icon={<Smartphone className="h-4 w-4" />}
            tone="violet"
            title="Merchant Account Manager"
            subtitle="Live payment gateway details shown at checkout"
          />
          <div className="space-y-5">
            {/* EasyPaisa */}
            <div className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/5">
              <div className="mb-3 flex items-center gap-2">
                <PremiumBadge tone="emerald">EasyPaisa</PremiumBadge>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldRow label="EasyPaisa Number" icon={<Smartphone className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("easypaisa_number")}>
                  <Input value={draft.easypaisa_number} onChange={(e) => setField("easypaisa_number", e.target.value)} placeholder="03XX-XXXXXXX" className="border-white/10 bg-white/5 text-white" />
                </FieldRow>
                <FieldRow label="EasyPaisa Account Name" icon={<AtSign className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("easypaisa_account_name")}>
                  <Input value={draft.easypaisa_account_name} onChange={(e) => setField("easypaisa_account_name", e.target.value)} placeholder="Account holder name" className="border-white/10 bg-white/5 text-white" />
                </FieldRow>
              </div>
            </div>
            {/* JazzCash */}
            <div className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/5">
              <div className="mb-3 flex items-center gap-2">
                <PremiumBadge tone="violet">JazzCash</PremiumBadge>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldRow label="JazzCash Number" icon={<Smartphone className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("jazzcash_number")}>
                  <Input value={draft.jazzcash_number} onChange={(e) => setField("jazzcash_number", e.target.value)} placeholder="03XX-XXXXXXX" className="border-white/10 bg-white/5 text-white" />
                </FieldRow>
                <FieldRow label="JazzCash Account Name" icon={<AtSign className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("jazzcash_account_name")}>
                  <Input value={draft.jazzcash_account_name} onChange={(e) => setField("jazzcash_account_name", e.target.value)} placeholder="Account holder name" className="border-white/10 bg-white/5 text-white" />
                </FieldRow>
              </div>
            </div>
            {/* Binance */}
            <div className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/5">
              <div className="mb-3 flex items-center gap-2">
                <PremiumBadge tone="amber">Binance (BEP20)</PremiumBadge>
              </div>
              <FieldRow label="Binance BEP20 Wallet Address" icon={<Wallet className="h-3.5 w-3.5" />} dirty={dirtyKeys.includes("binance_id")}>
                <Input value={draft.binance_id} onChange={(e) => setField("binance_id", e.target.value)} placeholder="0x... BEP20 address" className="border-white/10 bg-white/5 text-white font-mono text-xs" />
              </FieldRow>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <SavePanel
        isDirty={isDirty}
        dirtyKeys={dirtyKeys}
        original={original}
        draft={draft}
        saving={saving}
        onSave={save}
        onReset={() => setDraft(original)}
      />
    </div>
  );
}

/* ───────────────────────────── SECURITY TAB ───────────────────────────── */

function SecurityTab({
  adminUser,
  onAdminUserChange,
}: {
  adminUser: SafeUser;
  onAdminUserChange: (u: SafeUser) => void;
}) {
  const [email, setEmail] = React.useState(adminUser.email);
  const [newPassword, setNewPassword] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setEmail(adminUser.email);
    setNewPassword("");
    setCurrentPassword("");
  }, [adminUser]);

  const hasChange =
    email.trim().toLowerCase() !== adminUser.email.toLowerCase() ||
    newPassword.length > 0;

  async function save() {
    if (!currentPassword) {
      toast.error("Enter your current password to confirm changes");
      return;
    }
    if (!hasChange) return;
    setSaving(true);
    try {
      const { user } = await apiFetch<{ user: SafeUser }>("/api/admin/profile", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase() !== adminUser.email.toLowerCase() ? email.trim() : undefined,
          newPassword: newPassword || undefined,
          currentPassword,
        }),
      });
      onAdminUserChange(user);
      toast.success("Admin credentials updated — you stay logged in");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl"
    >
      <GlassCard variant="panel" border="gradient" glow="soft" className="p-5 sm:p-7">
        <SectionHeader
          icon={<ShieldCheck className="h-4 w-4" />}
          tone="fuchsia"
          title="Admin Profile & Security"
          subtitle="Update the master admin email and password"
        />

        {/* Current admin card */}
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg font-bold text-white">
            {adminUser.full_name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              {adminUser.full_name}
            </p>
            <p className="truncate text-xs text-violet-100/45">
              {adminUser.email}
            </p>
          </div>
          <PremiumBadge tone="fuchsia" className="ml-auto">
            <ShieldCheck className="h-3 w-3" /> Master Admin
          </PremiumBadge>
        </div>

        <div className="space-y-4">
          <FieldRow label="New Admin Email" icon={<Mail className="h-3.5 w-3.5" />}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ceo.com"
              className="border-white/10 bg-white/5 text-white"
            />
          </FieldRow>

          <FieldRow
            label="New Password"
            hint="Leave blank to keep current password. Min 6 characters."
            icon={<KeyRound className="h-3.5 w-3.5" />}
          >
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="border-white/10 bg-white/5 text-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-violet-100/40 hover:text-violet-100/70"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </FieldRow>

          <div className="rounded-xl border border-amber-400/20 bg-amber-500/8 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-amber-300" />
              <p className="text-xs font-semibold text-amber-200">
                Re-authentication required
              </p>
            </div>
            <FieldRow label="Current Password" icon={<Lock className="h-3.5 w-3.5" />}>
              <Input
                type={showPw ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password to apply changes"
                className="border-amber-400/20 bg-amber-500/5 text-white"
              />
            </FieldRow>
          </div>

          <GlowButton
            variant="primary"
            onClick={save}
            disabled={!hasChange || !currentPassword || saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Update Admin Credentials
              </>
            )}
          </GlowButton>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-violet-100/40">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            You stay logged in after updating — a fresh session is issued automatically.
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ───────────────────────────── SHARED ───────────────────────────── */

function SectionHeader({
  icon,
  tone,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  tone: "violet" | "fuchsia" | "emerald" | "amber";
  title: string;
  subtitle: string;
}) {
  const toneMap = {
    violet: "from-violet-500/30 to-fuchsia-500/10 text-violet-300",
    fuchsia: "from-fuchsia-500/30 to-rose-500/10 text-fuchsia-300",
    emerald: "from-emerald-500/30 to-teal-500/10 text-emerald-300",
    amber: "from-amber-500/30 to-orange-500/10 text-amber-300",
  } as const;
  return (
    <div className="mb-5 flex items-center gap-2.5">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-white/10 ${toneMap[tone]}`}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-[11px] text-violet-100/45">{subtitle}</p>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  hint,
  icon,
  dirty,
  children,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  dirty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-violet-100/70">
          {icon && <span className="text-violet-300">{icon}</span>}
          {label}
        </Label>
        {dirty && (
          <PremiumBadge tone="violet" className="text-[9px]">
            modified
          </PremiumBadge>
        )}
      </div>
      {children}
      {hint && <p className="text-[10px] text-violet-100/40">{hint}</p>}
    </div>
  );
}

function SavePanel({
  isDirty,
  dirtyKeys,
  original,
  draft,
  saving,
  onSave,
  onReset,
}: {
  isDirty: boolean;
  dirtyKeys: (keyof FormState)[];
  original: FormState;
  draft: FormState;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="lg:col-span-1"
    >
      <GlassCard
        variant="panel"
        border="gradient"
        glow={isDirty ? "violet" : "none"}
        className="sticky top-24 p-5 sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Save Changes</h3>
            <p className="text-[11px] text-violet-100/45">
              {isDirty
                ? `${dirtyKeys.length} field${dirtyKeys.length === 1 ? "" : "s"} modified`
                : "No unsaved changes"}
            </p>
          </div>
          <PremiumBadge tone={isDirty ? "violet" : "neutral"}>
            {isDirty ? "Dirty" : "Saved"}
          </PremiumBadge>
        </div>

        {isDirty && (
          <div className="mb-4 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
              Pending changes
            </p>
            <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {dirtyKeys.map((k) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2 py-1 text-[11px] ring-1 ring-inset ring-white/5"
                >
                  <span className="truncate text-violet-100/65">{prettyKey(k)}</span>
                  <span className="flex items-center gap-1 text-violet-100/45">
                    <span className="line-through">{formatVal(original[k])}</span>
                    <span className="text-violet-100/30">→</span>
                    <span className="font-semibold text-emerald-300">{formatVal(draft[k])}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <GlowButton
            variant="primary"
            onClick={onSave}
            disabled={!isDirty || saving}
            className="w-full"
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
          <GlowButton
            variant="ghost"
            onClick={onReset}
            disabled={!isDirty || saving}
            className="w-full"
          >
            Discard
          </GlowButton>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ───────────────────────────── helpers ───────────────────────────── */

function toForm(s: PlatformSettings): FormState {
  const { id: _id, updated_at: _u, ...rest } = s;
  return rest;
}

function useDirtyKeys(original: FormState, draft: FormState) {
  return React.useMemo(() => {
    const keys = Object.keys(original) as (keyof FormState)[];
    return keys.filter((k) => {
      const a = original[k];
      const b = draft[k];
      if (typeof a === "number" && typeof b === "number") return Number(a) !== Number(b);
      return String(a ?? "") !== String(b ?? "");
    });
  }, [original, draft]);
}

function prettyKey(k: keyof FormState): string {
  const map: Partial<Record<keyof FormState, string>> = {
    monthly_signup_limit: "Monthly Signup Limit",
    subscription_fee: "Subscription Fee",
    subscription_duration_days: "Subscription Duration",
    joining_fee: "Joining Fee",
    minimum_payout: "Minimum Payout",
    gmail_task_rate: "Gmail Task Rate",
    tiktok_like_rate: "TikTok Like Rate",
    referral_bonus_percent: "Referral Bonus %",
    easypaisa_number: "EasyPaisa Number",
    easypaisa_account_name: "EasyPaisa Account Name",
    jazzcash_number: "JazzCash Number",
    jazzcash_account_name: "JazzCash Account Name",
    binance_id: "Binance BEP20 Address",
    site_name: "Website Title",
    nav_logo_text: "Navbar Logo Text",
    support_email: "Support Email",
    footer_notice: "Footer Notice",
    currency_symbol: "Currency Symbol",
    video_promotion_rate: "Video Promotion Rate",
  };
  return map[k] ?? k;
}

function formatVal(v: unknown): string {
  if (typeof v === "number") {
    return Number.isInteger(v) ? String(v) : v.toFixed(2);
  }
  if (typeof v === "string") {
    return v.length > 22 ? v.slice(0, 22) + "…" : v || "(empty)";
  }
  return String(v ?? "");
}
