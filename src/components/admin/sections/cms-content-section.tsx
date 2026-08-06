"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Eye,
  FileText,
  Globe,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch, formatDate } from "@/lib/client";
import { toast } from "sonner";
import type { CmsContent } from "@/lib/types";

function typeTone(type: CmsContent["type"]): "violet" | "fuchsia" | "emerald" {
  switch (type) {
    case "page":
      return "violet";
    case "section":
      return "fuchsia";
    case "snippet":
      return "emerald";
  }
}

export function CmsContentSection() {
  const [pages, setPages] = React.useState<CmsContent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<CmsContent | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [isPublished, setIsPublished] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [previewKey, setPreviewKey] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const { content: list } = await apiFetch<{ content: CmsContent[] }>(
        "/api/admin/cms-content"
      );
      list.sort((a, b) => a.key.localeCompare(b.key));
      setPages(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function openEdit(c: CmsContent) {
    setEditing(c);
    setTitle(c.title);
    setBody(c.body);
    setIsPublished(c.is_published);
    setDialogOpen(true);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      await apiFetch("/api/admin/cms-content", {
        method: "PATCH",
        body: JSON.stringify({
          key: editing.key,
          title,
          body,
          is_published: isPublished,
        }),
      });
      toast.success("Content updated");
      setDialogOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  const previewPage = pages.find((p) => p.key === previewKey);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <FileText className="h-3 w-3" /> CMS
          </>
        }
        title="Content Pages"
        description="Edit platform pages like About, Privacy, Terms, FAQ and Contact. Changes publish instantly when toggled on."
      />

      <GlassCard className="flex items-center justify-between gap-3 p-4">
        <p className="text-xs text-violet-100/55">
          {pages.length} pages · {pages.filter((p) => p.is_published).length} published
        </p>
        <GlowButton variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </GlowButton>
      </GlassCard>

      {loading && pages.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <GlassCard className="p-6">
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No CMS pages yet"
            description="CMS content keys will appear here once seeded in the database."
            className="py-12"
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pages.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.25) }}
            >
              <GlassCard className="flex h-full flex-col p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-violet-300" />
                    <code className="text-xs font-mono text-violet-200">{c.key}</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PremiumBadge tone={typeTone(c.type)}>{c.type}</PremiumBadge>
                    {c.is_published ? (
                      <PremiumBadge tone="emerald">Published</PremiumBadge>
                    ) : (
                      <PremiumBadge tone="amber">Draft</PremiumBadge>
                    )}
                  </div>
                </div>
                <h3 className="text-base font-bold text-white">
                  {c.title || "Untitled"}
                </h3>
                <p className="mt-1 mb-4 line-clamp-2 text-xs leading-relaxed text-violet-100/55">
                  {c.body || "No content yet."}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="text-[10px] text-violet-100/40">
                    Updated {formatDate(c.updated_at)}
                  </span>
                  <div className="flex gap-2">
                    <GlowButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewKey(c.key)}
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </GlowButton>
                    <GlowButton variant="outline" size="sm" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </GlowButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-white/10 bg-[rgba(15,11,24,0.95)] backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Edit {editing?.key ?? "page"}
            </DialogTitle>
            <DialogDescription>
              Update the page title, body and publication status. Markdown is supported in body.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cms-title">Title</Label>
              <Input
                id="cms-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="About EarnStream"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cms-body">Body</Label>
              <Textarea
                id="cms-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write the page content here…"
                rows={12}
                className="border-white/10 bg-white/5 font-mono text-xs"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/[0.02] p-3 ring-1 ring-inset ring-white/5">
              <div>
                <Label htmlFor="cms-published" className="text-sm">
                  Published
                </Label>
                <p className="text-[11px] text-violet-100/45">
                  When on, this content is visible to users.
                </p>
              </div>
              <Switch
                id="cms-published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
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
                <Save className="h-3.5 w-3.5" />
              )}
              Save Changes
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewPage} onOpenChange={(o) => !o && setPreviewKey(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-white/10 bg-[rgba(15,11,24,0.95)] backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{previewPage?.title ?? "Preview"}</DialogTitle>
            <DialogDescription>
              <code className="font-mono text-violet-200">{previewPage?.key}</code>
            </DialogDescription>
          </DialogHeader>
          <pre className="whitespace-pre-wrap rounded-xl bg-black/30 p-4 text-xs leading-relaxed text-violet-100/80 ring-1 ring-inset ring-white/5">
            {previewPage?.body || "No content yet."}
          </pre>
          <DialogFooter>
            <GlowButton
              variant="primary"
              size="sm"
              onClick={() => {
                if (previewPage) {
                  openEdit(previewPage);
                  setPreviewKey(null);
                }
              }}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit this page
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {previewPage && (
        <p className="sr-only">
          <CheckCircle2 className="h-3 w-3" /> Previewing {previewPage.key}
        </p>
      )}
    </div>
  );
}
