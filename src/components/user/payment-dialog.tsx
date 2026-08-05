"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  ImagePlus,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import { GlowButton, PremiumBadge } from "@/components/premium";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import type { PlatformSettings, SafeUser, PaymentMethod } from "@/lib/types";
import { methodLabel } from "./shared";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: "joining_fee" | "subscription";
  settings: PlatformSettings;
  onPaid: (user: SafeUser) => void;
}

const MAX_MB = 4.5;

export function PaymentDialog({
  open,
  onOpenChange,
  mode,
  settings,
  onPaid,
}: PaymentDialogProps) {
  const { money } = useCurrency();
  const isJoining = mode === "joining_fee";
  const fee = isJoining ? settings.joining_fee : settings.subscription_fee;

  const [method, setMethod] = React.useState<PaymentMethod>("easypaisa");
  const [account, setAccount] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const merchantNumber =
    method === "easypaisa"
      ? settings.easypaisa_number
      : method === "jazzcash"
        ? settings.jazzcash_number
        : settings.binance_id;

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setMethod("easypaisa");
      setAccount("");
      setFile(null);
      setPreview(null);
      setLoading(false);
      setDragOver(false);
    }
  }, [open]);

  function pickFile(f: File | null | undefined) {
    if (!f) return;
    if (!/image\/(png|jpe?g|webp)/.test(f.type)) {
      toast.error("Please upload a PNG, JPG, or WEBP image.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_MB} MB.`);
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(f);
  }

  function clearFile(e: React.MouseEvent) {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  async function pay() {
    if (!account.trim()) {
      toast.error("Enter your account number / ID");
      return;
    }
    if (isJoining && !file) {
      toast.error("Please upload your payment screenshot");
      return;
    }
    setLoading(true);
    try {
      if (isJoining) {
        // Joining fee → multipart upload with screenshot → PENDING approval.
        const fd = new FormData();
        fd.append("method", method);
        fd.append("account", account.trim());
        fd.append("screenshot", file!);
        const res = await fetch("/api/joining-fee/pay", {
          method: "POST",
          body: fd,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            (data && typeof data === "object" && "error" in data && String((data as Record<string, unknown>).error)) ||
              "Submission failed"
          );
        }
        toast.success(
          "Joining fee submitted! Awaiting admin verification."
        );
        onPaid((data as { user: SafeUser }).user);
        onOpenChange(false);
      } else {
        // Subscription → JSON, instant activation (admin-controlled rate).
        const { user: updated } = await apiFetch<{ user: SafeUser }>(
          "/api/subscription/pay",
          {
            method: "POST",
            body: JSON.stringify({ method, account: account.trim() }),
          }
        );
        toast.success("Subscription renewed! Access restored.");
        onPaid(updated);
        onOpenChange(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/30 to-orange-500/10 text-amber-300 ring-1 ring-white/10">
              {isJoining ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
            </div>
            <PremiumBadge tone={isJoining ? "amber" : "violet"}>
              {isJoining ? "One-time fee" : "Monthly renewal"}
            </PremiumBadge>
          </div>
          <DialogTitle className="text-xl text-white">
            {isJoining ? "Pay Joining Fee" : "Renew Subscription"}
          </DialogTitle>
          <DialogDescription className="text-violet-100/55">
            {isJoining
              ? "Upload your payment screenshot. An admin will verify it before unlocking tasks, withdrawals, and referrals."
              : `Extend your subscription by ${settings.subscription_duration_days} days and restore full access to your wallet.`}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-violet-100/55">Amount due</span>
            <span className="text-lg font-bold text-amber-300">
              {money(fee)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-violet-100/55">
              Merchant {method === "binance" ? "Binance ID" : "Number"}
            </span>
            <span className="font-mono text-sm font-semibold text-violet-100">
              {merchantNumber || "—"}
            </span>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-violet-100/45">
            Send <span className="font-semibold text-amber-200">{money(fee)}</span>{" "}
            to the merchant {method === "binance" ? "Binance ID" : "number"} above,
            then enter <em>your</em> {methodLabel(method)} account and upload the
            payment screenshot below.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-violet-100/70">
              Payment Method
            </Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as PaymentMethod)}
            >
              <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                <SelectItem value="jazzcash">JazzCash</SelectItem>
                <SelectItem value="binance">Binance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-violet-100/70">
              Your {method === "binance" ? "Binance ID" : "Account Number"}
            </Label>
            <Input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder={
                method === "binance" ? "Your Binance ID" : "03XX-XXXXXXX"
              }
              className="border-white/10 bg-white/5 text-white placeholder:text-violet-100/30"
            />
          </div>

          {isJoining && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium text-violet-100/70">
                <ImagePlus className="h-3.5 w-3.5" />
                Payment Screenshot <span className="text-rose-300">*</span>
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              {!preview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition ${
                    dragOver
                      ? "border-violet-400/60 bg-violet-500/10"
                      : "border-white/12 bg-white/[0.02] hover:border-violet-400/40 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/5 text-violet-300 ring-1 ring-white/10">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-violet-100/80">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-[10px] text-violet-100/40">
                    PNG, JPG, WEBP · max {MAX_MB} MB
                  </p>
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden rounded-xl border border-white/10 ring-1 ring-violet-400/20"
                >
                  <img
                    src={preview}
                    alt="Payment screenshot preview"
                    className="max-h-52 w-full object-contain bg-black/40"
                  />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-rose-500/80"
                    aria-label="Remove screenshot"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-violet-100/60">
                    <ImagePlus className="h-3 w-3 text-emerald-300" />
                    <span className="truncate">{file?.name}</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <GlowButton
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </GlowButton>
          <GlowButton
            variant="gold"
            onClick={pay}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading
              ? "Submitting…"
              : isJoining
                ? "Submit for Verification"
                : `Pay ${money(fee)}`}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </GlowButton>
        </DialogFooter>

        <div className="flex items-center justify-center gap-2 text-[11px] text-violet-100/40">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          {isJoining
            ? "Admin-verifed activation · No auto-unlock"
            : "Instant activation · Secured payout ledger"}
        </div>
      </DialogContent>
    </Dialog>
  );
}
