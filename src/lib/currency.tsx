"use client";

import * as React from "react";
import { apiFetch } from "./client";
import type { PlatformSettings } from "./types";

interface CurrencyCtx {
  symbol: string;
  /** Format a number with the current currency symbol, e.g. "Rs 245.50". */
  money: (n: number) => string;
  settings: PlatformSettings | null;
}

const Ctx = React.createContext<CurrencyCtx>({
  symbol: "Rs",
  money: (n) => `Rs ${n.toFixed(2)}`,
  settings: null,
});

/**
 * Provides the live currency symbol (from platform settings) to the whole
 * client tree. Mounted once in the app shell. If `initialSettings` is
 * provided, uses it directly (avoids a redundant fetch); otherwise fetches
 * `/api/settings` once on mount. Falls back to "Rs" while loading.
 */
export function CurrencyProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: PlatformSettings | null;
}) {
  const [settings, setSettings] = React.useState<PlatformSettings | null>(
    initialSettings ?? null
  );

  React.useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      return;
    }
    let alive = true;
    apiFetch<{ settings: PlatformSettings }>("/api/settings")
      .then((d) => {
        if (alive) setSettings(d.settings);
      })
      .catch(() => {
        /* keep default */
      });
    return () => {
      alive = false;
    };
  }, [initialSettings]);

  const symbol = settings?.currency_symbol ?? "Rs";
  const money = React.useCallback(
    (n: number) => {
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(n) || 0);
      return `${symbol} ${formatted}`;
    },
    [symbol]
  );

  const value = React.useMemo(
    () => ({ symbol, money, settings }),
    [symbol, money, settings]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Returns the currency context: `{ symbol, money, settings }`. */
export function useCurrency() {
  return React.useContext(Ctx);
}
