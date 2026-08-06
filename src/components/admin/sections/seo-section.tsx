"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Globe,
  Image as ImageIcon,
  Loader2,
  Save,
  Search,
  Twitter,
} from "lucide-react";
import {
  GlassCard,
  GlowButton,
  PremiumBadge,
  SectionHeading,
} from "@/components/premium";
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
import { apiFetch } from "@/lib/client";
import { toast } from "sonner";
import type { PlatformSettings } from "@/lib/types";

interface SeoSectionProps {
  settings: PlatformSettings;
  onSettingsChange: (s: PlatformSettings) => void;
}

interface FieldDef {
  key: keyof PlatformSettings;
  label: string;
  hint?: string;
  placeholder?: string;
  type?: "text" | "textarea";
}

const FIELDS: FieldDef[] = [
  {
    key: "seo_title",
    label: "SEO Title",
    hint: "Shown in browser tab and search results (≤60 chars).",
    placeholder: "EarnStream — Earn by completing micro-tasks",
  },
  {
    key: "seo_description",
    label: "Meta Description",
    hint: "Short summary shown under the title in search results.",
    placeholder: "EarnStream pays you for completing TikTok and Gmail micro-tasks.",
    type: "textarea",
  },
  {
    key: "seo_keywords",
    label: "Keywords",
    hint: "Comma-separated keywords for legacy meta tags.",
    placeholder: "earn money, micro tasks, tiktok rewards",
  },
  {
    key: "seo_canonical",
    label: "Canonical URL",
    hint: "The canonical URL for the homepage.",
    placeholder: "https://earnstream.app",
  },
  {
    key: "seo_robots",
    label: "Robots Directive",
    hint: "Comma-separated crawler directives (e.g. index, follow).",
    placeholder: "index, follow",
  },
  {
    key: "seo_og_image",
    label: "Open Graph Image URL",
    hint: "Social-share preview image (1200×630 recommended).",
    placeholder: "https://earnstream.app/og.png",
  },
  {
    key: "seo_twitter_card",
    label: "Twitter Card Type",
    hint: "summary, summary_large_image, or player.",
    placeholder: "summary_large_image",
  },
  {
    key: "google_analytics_id",
    label: "Google Analytics ID",
    hint: "GA4 measurement ID like G-XXXXXXX.",
    placeholder: "G-ABC12345XY",
  },
  {
    key: "google_verification",
    label: "Google Search Console Verification",
    hint: "The content value for the google-site-verification meta tag.",
    placeholder: "google-site-verification-token",
  },
];

export function SeoSection({ settings, onSettingsChange }: SeoSectionProps) {
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const next: Record<string, string> = {};
    for (const f of FIELDS) {
      next[f.key] = String(settings[f.key] ?? "");
    }
    setForm(next);
  }, [settings]);

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const { settings: updated } = await apiFetch<{ settings: PlatformSettings }>(
        "/api/admin/settings",
        {
          method: "PATCH",
          body: JSON.stringify(form),
        }
      );
      onSettingsChange(updated);
      toast.success("SEO settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const twitterOptions = ["summary", "summary_large_image", "player", "app"];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <Search className="h-3 w-3" /> SEO
          </>
        }
        title="Search Engine Optimization"
        description="Control how EarnStream appears in search results and social shares. Changes apply to the public landing page meta tags."
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-violet-300 ring-1 ring-white/10">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Search & Social</h3>
              <p className="text-[11px] text-violet-100/45">9 fields · saved to platform settings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div
                key={f.key}
                className={f.type === "textarea" ? "sm:col-span-2 space-y-2" : "space-y-2"}
              >
                <Label htmlFor={f.key} className="text-xs">
                  {f.label}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={f.key}
                    value={form[f.key] ?? ""}
                    onChange={(e) => update(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={3}
                    className="border-white/10 bg-white/5"
                  />
                ) : f.key === "seo_twitter_card" ? (
                  <Select
                    value={form[f.key] ?? "summary_large_image"}
                    onValueChange={(v) => update(f.key, v)}
                  >
                    <SelectTrigger id={f.key} className="w-full border-white/10 bg-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {twitterOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={f.key}
                    value={form[f.key] ?? ""}
                    onChange={(e) => update(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="border-white/10 bg-white/5"
                  />
                )}
                {f.hint && (
                  <p className="text-[10px] text-violet-100/40">{f.hint}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <GlowButton variant="primary" size="md" onClick={save} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save SEO Settings
            </GlowButton>
          </div>
        </GlassCard>
      </motion.div>

      {/* Preview card */}
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/10 text-amber-300 ring-1 ring-white/10">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Search Preview</h3>
            <p className="text-[11px] text-violet-100/45">How the page appears in Google</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-[11px] text-emerald-300/80">
            https://earnstream.app
          </p>
          <p className="mt-0.5 text-base font-medium text-violet-200">
            {form.seo_title || "EarnStream — Earn by completing micro-tasks"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-violet-100/55">
            {form.seo_description || "EarnStream pays you for completing TikTok and Gmail micro-tasks."}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PremiumBadge tone="violet">
            <Globe className="h-3 w-3" /> {form.seo_robots || "index, follow"}
          </PremiumBadge>
          <PremiumBadge tone="fuchsia">
            <Twitter className="h-3 w-3" /> {form.seo_twitter_card || "summary_large_image"}
          </PremiumBadge>
          {form.google_analytics_id && (
            <PremiumBadge tone="emerald">
              <CheckCircle2 className="h-3 w-3" /> GA connected
            </PremiumBadge>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
