"use client";

import * as React from "react";
import { apiFetch } from "@/lib/client";
import { CurrencyProvider } from "@/lib/currency";
import { MeshBackground } from "@/components/premium";
import { PageShell } from "@/components/shared/page-shell";
import { AuthLanding } from "@/components/auth/auth-landing";
import { PaymentRequired } from "@/components/auth/payment-required";
import { UserPanel } from "@/components/user/user-panel";
import { AdminPanel } from "@/components/admin/admin-panel";
import type { PlatformSettings, SafeUser } from "@/lib/types";
import { Sparkles, Heart } from "lucide-react";

export default function Home() {
  const [booted, setBooted] = React.useState(false);
  const [user, setUser] = React.useState<SafeUser | null>(null);
  const [settings, setSettings] = React.useState<PlatformSettings | null>(null);

  const bootstrap = React.useCallback(async () => {
    // Race the bootstrap fetches against a hard timeout so the boot splash
    // can never freeze forever (e.g. if the dev server is restarting).
    const timeout = new Promise<{ user: null; settings: null }>((resolve) =>
      setTimeout(() => resolve({ user: null, settings: null }), 8000)
    );
    try {
      const result = await Promise.race([
        Promise.all([
          apiFetch<{ user: SafeUser | null }>("/api/auth/me"),
          apiFetch<{ settings: PlatformSettings }>("/api/settings"),
        ]).then(([meRes, settingsRes]) => ({
          user: meRes.user,
          settings: settingsRes.settings,
        })),
        timeout,
      ]);
      setUser(result.user);
      if (result.settings) setSettings(result.settings);
    } catch {
      setUser(null);
    } finally {
      setBooted(true);
    }
  }, []);

  React.useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (!booted || !settings) {
    return (
      <PageShell>
        {booted && !settings ? (
          <ConnectionError onRetry={() => { setBooted(false); bootstrap(); }} />
        ) : (
          <BootSplash />
        )}
      </PageShell>
    );
  }

  if (!user) {
    return (
      <CurrencyProvider initialSettings={settings}>
        <PageShell>
          <AuthLanding
            settings={settings}
            onAuthed={(u) => setUser(u)}
          />
        </PageShell>
      </CurrencyProvider>
    );
  }

  // Suspended non-admin users → payment required page
  if (user.role !== "admin" && user.is_suspended) {
    return (
      <CurrencyProvider initialSettings={settings}>
        <PageShell>
          <PaymentRequired
            user={user}
            settings={settings}
            onPaid={(u) => setUser(u)}
            onLogout={() => {
              setUser(null);
            }}
          />
        </PageShell>
      </CurrencyProvider>
    );
  }

  if (user.role === "admin") {
    return (
      <CurrencyProvider initialSettings={settings}>
        <PageShell>
          <AdminPanel
            user={user}
            settings={settings}
            onSettingsChange={setSettings}
            onLogout={() => setUser(null)}
            onUserUpdate={(u) => {
              // if admin somehow suspends themselves, keep them in admin panel
              setUser(u);
            }}
          />
        </PageShell>
      </CurrencyProvider>
    );
  }

  return (
    <CurrencyProvider initialSettings={settings}>
      <PageShell>
        <UserPanel
          user={user}
          settings={settings}
          onUserUpdate={(u) => setUser(u)}
          onLogout={() => setUser(null)}
        />
      </PageShell>
    </CurrencyProvider>
  );
}

function BootSplash() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-2xl bg-violet-500/40" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-xl glow-violet">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
      </div>
      <p className="text-sm text-violet-100/50">Loading EarnStream…</p>
    </div>
  );
}

function ConnectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/30 to-fuchsia-500/10 text-rose-300 ring-1 ring-white/10">
        <Sparkles className="h-7 w-7" />
      </div>
      <div>
        <p className="text-lg font-bold text-white">Connection issue</p>
        <p className="mt-1 max-w-sm text-sm text-violet-100/55">
          We couldn't reach the EarnStream server. It may be restarting.
          Please wait a moment and try again.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
      >
        Retry connection
      </button>
    </div>
  );
}
