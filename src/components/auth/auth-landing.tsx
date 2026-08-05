"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Gift,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Wallet,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import {
  GlassCard,
  GlowButton,
  SectionHeading,
  PremiumBadge,
} from "@/components/premium";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { PlatformSettings, SafeUser } from "@/lib/types";

interface AuthLandingProps {
  settings: PlatformSettings;
  onAuthed: (user: SafeUser) => void;
}

export function AuthLanding({ settings, onAuthed }: AuthLandingProps) {
  const { money } = useCurrency();
  const [tab, setTab] = React.useState<"login" | "signup">("login");
  const [signupOpen, setSignupOpen] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(false);

  // login form
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPass, setLoginPass] = React.useState("");
  // signup form
  const [suName, setSuName] = React.useState("");
  const [suEmail, setSuEmail] = React.useState("");
  const [suPass, setSuPass] = React.useState("");
  const [suPhone, setSuPhone] = React.useState("");
  const [suReferral, setSuReferral] = React.useState("");

  // check whether signups are open
  React.useEffect(() => {
    apiFetch<{ open: boolean; used: number; limit: number }>(
      "/api/auth/signup"
    )
      .then((d) => setSignupOpen(d.open))
      .catch(() => setSignupOpen(true));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await apiFetch<{ user: SafeUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      toast.success(`Welcome back, ${user.full_name || user.email}!`);
      onAuthed(user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await apiFetch<{ user: SafeUser }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: suEmail,
          password: suPass,
          full_name: suName,
          phone: suPhone,
          referral_code: suReferral || undefined,
        }),
      });
      toast.success("Account created! Welcome to EarnStream.");
      onAuthed(user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* top nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg glow-violet">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            {settings.site_name}
          </span>
        </div>
        <PremiumBadge tone="violet">
          <ShieldCheck className="h-3 w-3" /> Secure Platform
        </PremiumBadge>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 pb-20 pt-6 lg:grid-cols-2 lg:gap-16 lg:pt-12">
        {/* LEFT — hero / value prop */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col justify-center"
        >
          <PremiumBadge tone="fuchsia" className="mb-5 w-fit">
            <Zap className="h-3 w-3" /> Premium Micro-Task Network
          </PremiumBadge>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Turn spare minutes into{" "}
            <span className="text-gradient">real earnings.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-violet-100/55">
            Complete Gmail and TikTok tasks. Withdraw instantly to EasyPaisa,
            JazzCash, or Binance. Earn{" "}
            <span className="font-semibold text-fuchsia-300">
              {settings.referral_bonus_percent}% referral bonuses
            </span>{" "}
            on every friend who joins.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Wallet, label: "Instant Cashout", tone: "violet" as const },
              { icon: TrendingUp, label: "Live Wallet", tone: "emerald" as const },
              { icon: Users, label: "Referral Bonuses", tone: "fuchsia" as const },
              { icon: ShieldCheck, label: "Verified Payouts", tone: "amber" as const },
            ].map((f) => (
              <GlassCard key={f.label} className="p-4 lift">
                <f.icon className="mb-2 h-5 w-5 text-violet-300" />
                <p className="text-xs font-medium text-violet-100/70">
                  {f.label}
                </p>
              </GlassCard>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3 text-xs text-violet-100/40">
            <div className="flex -space-x-2">
              {["from-violet-500 to-fuchsia-500", "from-emerald-500 to-teal-500", "from-amber-400 to-orange-500"].map(
                (g, i) => (
                  <div
                    key={i}
                    className={`h-7 w-7 rounded-full bg-gradient-to-br ${g} ring-2 ring-[#09070F]`}
                  />
                )
              )}
            </div>
            <span>
              Join thousands of earners. Joining fee{" "}
              <span className="font-semibold text-violet-200">
                {money(settings.joining_fee)}
              </span>{" "}
              · Monthly{" "}
              <span className="font-semibold text-violet-200">
                {money(settings.subscription_fee)}
              </span>
            </span>
          </div>
        </motion.section>

        {/* RIGHT — auth card */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center"
        >
          <GlassCard variant="panel" border="gradient" className="w-full p-6 sm:p-8 glow-soft">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white text-violet-100/60"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white text-violet-100/60"
                >
                  Create Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Field label="Email Address" icon={<Mail className="h-4 w-4" />}>
                    <Input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="border-white/10 bg-white/5 text-white placeholder:text-violet-100/30"
                    />
                  </Field>
                  <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                    <Input
                      type="password"
                      required
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="••••••••"
                      className="border-white/10 bg-white/5 text-white placeholder:text-violet-100/30"
                    />
                  </Field>
                  <GlowButton type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Signing in…" : "Sign In"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </GlowButton>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <AnimatePresence mode="wait">
                  {signupOpen === false ? (
                    <motion.div
                      key="closed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <SignupsClosedAlert />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="open"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <form onSubmit={handleSignup} className="space-y-4">
                        <Field label="Full Name" icon={<UserIcon className="h-4 w-4" />}>
                          <Input
                            required
                            value={suName}
                            onChange={(e) => setSuName(e.target.value)}
                            placeholder="Your name"
                            className="border-white/10 bg-white/5 text-white placeholder:text-violet-100/30"
                          />
                        </Field>
                        <Field label="Email Address" icon={<Mail className="h-4 w-4" />}>
                          <Input
                            type="email"
                            required
                            value={suEmail}
                            onChange={(e) => setSuEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="border-white/10 bg-white/5 text-white placeholder:text-violet-100/30"
                          />
                        </Field>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field label="Phone" icon={<Phone className="h-4 w-4" />}>
                            <Input
                              value={suPhone}
                              onChange={(e) => setSuPhone(e.target.value)}
                              placeholder="0300-0000000"
                              className="border-white/10 bg-white/5 text-white placeholder:text-violet-100/30"
                            />
                          </Field>
                          <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                            <Input
                              type="password"
                              required
                              minLength={6}
                              value={suPass}
                              onChange={(e) => setSuPass(e.target.value)}
                              placeholder="Min 6 characters"
                              className="border-white/10 bg-white/5 text-white placeholder:text-violet-100/30"
                            />
                          </Field>
                        </div>
                        <Field
                          label="Referral Code (optional)"
                          icon={<Gift className="h-4 w-4" />}
                        >
                          <Input
                            value={suReferral}
                            onChange={(e) => setSuReferral(e.target.value.toUpperCase())}
                            placeholder="e.g. DEMO7A2F"
                            className="border-white/10 bg-white/5 text-white placeholder:text-violet-100/30 uppercase"
                          />
                        </Field>
                        <GlowButton
                          type="submit"
                          size="lg"
                          variant="gold"
                          className="w-full"
                          disabled={loading}
                        >
                          {loading ? "Creating account…" : "Create Account"}
                          {!loading && <Sparkles className="h-4 w-4" />}
                        </GlowButton>
                        <p className="text-center text-[11px] leading-relaxed text-violet-100/40">
                          By signing up you agree to pay a one-time joining fee of
                          {" "}{money(settings.joining_fee)} and a monthly
                          subscription of {money(settings.subscription_fee)}.
                        </p>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </GlassCard>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium text-violet-100/70">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}

function SignupsClosedAlert() {
  return (
    <GlassCard
      variant="strong"
      border="gradient"
      glow="fuchsia"
      className="p-8 text-center"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/30 to-rose-500/10 text-fuchsia-300 ring-1 ring-white/10">
        <ShieldCheck className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-bold text-white">
        Signups Closed for This Month
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-violet-100/55">
        We&apos;ve reached our monthly signup capacity to maintain payout
        quality for existing earners. New registrations reopen on the 1st of
        next month.
      </p>
      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs text-violet-100/60 ring-1 ring-inset ring-white/10">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-fuchsia-500" />
        </span>
        Monthly limit reached — check back soon
      </div>
    </GlassCard>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 px-5 py-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-violet-100/40 sm:flex-row">
        <p>© {new Date().getFullYear()} EarnStream. All rights reserved.</p>
        <p>Built for earners · Secured payouts · 24/7 verification</p>
      </div>
    </footer>
  );
}
