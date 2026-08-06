"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Infinity as InfinityIcon,
  Loader2,
  Percent,
  Save,
  Target,
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import { toast } from "sonner";
import type { PlatformSettings } from "@/lib/types";

interface ReferralConfigSectionProps {
  settings: PlatformSettings;
  onSettingsChange: (s: PlatformSettings) => void;
}

export function ReferralConfigSection({
  settings,
  onSettingsChange,
}: ReferralConfigSectionProps) {
  const { money } = useCurrency();
  const [form, setForm] = React.useState({
    referral_type: settings.referral_type,
    referral_bonus_percent: String(settings.referral_bonus_percent ?? 0),
    referral_fixed_amount: String(settings.referral_fixed_amount ?? 0),
    referral_lifetime: settings.referral_lifetime,
    referral_max: String(settings.referral_max ?? 0),
    referral_min_withdrawal: String(settings.referral_min_withdrawal ?? 0),
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setForm({
      referral_type: settings.referral_type,
      referral_bonus_percent: String(settings.referral_bonus_percent ?? 0),
      referral_fixed_amount: String(settings.referral_fixed_amount ?? 0),
      referral_lifetime: settings.referral_lifetime,
      referral_max: String(settings.referral_max ?? 0),
      referral_min_withdrawal: String(settings.referral_min_withdrawal ?? 0),
    });
  }, [settings]);

  async function save() {
    setSaving(true);
    try {
      const payload = {
        referral_type: form.referral_type,
        referral_bonus_percent: Number(form.referral_bonus_percent) || 0,
        referral_fixed_amount: Number(form.referral_fixed_amount) || 0,
        referral_lifetime: form.referral_lifetime,
        referral_max: Number(form.referral_max) || 0,
        referral_min_withdrawal: Number(form.referral_min_withdrawal) || 0,
      };
      const { settings: updated } = await apiFetch<{ settings: PlatformSettings }>(
        "/api/admin/settings",
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );
      onSettingsChange(updated);
      toast.success("Referral settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const previewBonus =
    form.referral_type === "fixed"
      ? money(Number(form.referral_fixed_amount) || 0)
      : `${form.referral_bonus_percent || 0}% of referee's first reward`;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <Gift className="h-3 w-3" /> Referrals
          </>
        }
        title="Referral System Config"
        description="Tune bonus type, payout amount, lifetime attribution and withdrawal thresholds for the referral program."
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-rose-500/10 text-fuchsia-300 ring-1 ring-white/10">
              <Gift className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Program Settings</h3>
              <p className="text-[11px] text-violet-100/45">6 fields · applies platform-wide</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ref-type" className="flex items-center gap-1.5 text-xs">
                <Target className="h-3 w-3" /> Bonus Type
              </Label>
              <Select
                value={form.referral_type}
                onValueChange={(v) =>
                  setForm({ ...form, referral_type: v as "fixed" | "percentage" })
                }
              >
                <SelectTrigger id="ref-type" className="w-full border-white/10 bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed amount</SelectItem>
                  <SelectItem value="percentage">Percentage of referral reward</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.referral_type === "percentage" ? (
              <div className="space-y-2">
                <Label htmlFor="ref-pct" className="flex items-center gap-1.5 text-xs">
                  <Percent className="h-3 w-3" /> Bonus Percent
                </Label>
                <Input
                  id="ref-pct"
                  type="number"
                  step="0.1"
                  value={form.referral_bonus_percent}
                  onChange={(e) =>
                    setForm({ ...form, referral_bonus_percent: e.target.value })
                  }
                  className="border-white/10 bg-white/5"
                />
                <p className="text-[10px] text-violet-100/40">
                  Percentage of the referee's first reward paid to the referrer.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="ref-fixed" className="flex items-center gap-1.5 text-xs">
                  <Wallet className="h-3 w-3" /> Fixed Bonus Amount
                </Label>
                <Input
                  id="ref-fixed"
                  type="number"
                  step="0.01"
                  value={form.referral_fixed_amount}
                  onChange={(e) =>
                    setForm({ ...form, referral_fixed_amount: e.target.value })
                  }
                  className="border-white/10 bg-white/5"
                />
                <p className="text-[10px] text-violet-100/40">
                  Flat payout per successful referral.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ref-max" className="flex items-center gap-1.5 text-xs">
                <Target className="h-3 w-3" /> Max Referrals (per user)
              </Label>
              <Input
                id="ref-max"
                type="number"
                value={form.referral_max}
                onChange={(e) => setForm({ ...form, referral_max: e.target.value })}
                className="border-white/10 bg-white/5"
              />
              <p className="text-[10px] text-violet-100/40">
                0 = unlimited referrals allowed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref-min" className="flex items-center gap-1.5 text-xs">
                <Wallet className="h-3 w-3" /> Min Withdrawal
              </Label>
              <Input
                id="ref-min"
                type="number"
                step="0.01"
                value={form.referral_min_withdrawal}
                onChange={(e) =>
                  setForm({ ...form, referral_min_withdrawal: e.target.value })
                }
                className="border-white/10 bg-white/5"
              />
              <p className="text-[10px] text-violet-100/40">
                Minimum balance required to withdraw referral earnings.
              </p>
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between rounded-lg bg-white/[0.02] p-3 ring-1 ring-inset ring-white/5">
                <div>
                  <Label htmlFor="ref-lifetime" className="flex items-center gap-1.5 text-sm">
                    <InfinityIcon className="h-3.5 w-3.5" /> Lifetime Attribution
                  </Label>
                  <p className="text-[11px] text-violet-100/45">
                    When on, referrers earn on every referral reward (not just the first).
                  </p>
                </div>
                <Switch
                  id="ref-lifetime"
                  checked={form.referral_lifetime}
                  onCheckedChange={(v) => setForm({ ...form, referral_lifetime: v })}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <GlowButton variant="primary" size="md" onClick={save} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Referral Settings
            </GlowButton>
          </div>
        </GlassCard>
      </motion.div>

      {/* Preview */}
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/10 text-emerald-300 ring-1 ring-white/10">
            <Gift className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Program Preview</h3>
            <p className="text-[11px] text-violet-100/45">How referrers will see the program</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-white/[0.02] p-3 ring-1 ring-inset ring-white/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
              Bonus per referral
            </p>
            <p className="mt-0.5 text-base font-bold text-emerald-300">{previewBonus}</p>
          </div>
          <div className="rounded-lg bg-white/[0.02] p-3 ring-1 ring-inset ring-white/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
              Max referrals
            </p>
            <p className="mt-0.5 text-base font-bold text-white">
              {Number(form.referral_max) > 0 ? form.referral_max : "∞"}
            </p>
          </div>
          <div className="rounded-lg bg-white/[0.02] p-3 ring-1 ring-inset ring-white/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
              Attribution
            </p>
            <p className="mt-0.5">
              <PremiumBadge tone={form.referral_lifetime ? "emerald" : "violet"}>
                {form.referral_lifetime ? "Lifetime" : "First reward only"}
              </PremiumBadge>
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
