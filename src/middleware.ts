import { NextRequest, NextResponse } from "next/server";

/**
 * Security middleware — applies security headers to every response.
 * This is the first line of defense against XSS, clickjacking, MIME sniffing,
 * and provides a baseline Content Security Policy.
 */

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  // Content Security Policy — allows inline styles (Tailwind requires this),
  // inline scripts (Next.js requires this), images from any source, and
  // connects to Supabase + Vercel analytics.
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://vercel.live wss://*.supabase.co",
    "media-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

// Simple in-memory rate limiter (per IP, per route prefix).
// For production with multiple serverless instances, consider Upstash Redis.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMITS: Record<string, number> = {
  "/api/auth/login": 10, // 10 login attempts per minute
  "/api/auth/signup": 5, // 5 signups per minute
  "/api/wallet/withdraw": 5, // 5 withdrawals per minute
  "/api/tasks-cms": 20, // 20 task submissions per minute
  "/api/gmail/my-gmail": 10, // 10 gmail submissions per minute
  "/api/joining-fee/pay": 5, // 5 joining fee submissions per minute
};

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function getRateLimitKey(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const path = new URL(req.url).pathname;
  // Find matching rate limit rule
  for (const prefix of Object.keys(RATE_LIMITS)) {
    if (path === prefix || path.startsWith(prefix + "/")) {
      return `${ip}:${prefix}`;
    }
  }
  return "";
}

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= limit) {
    return false;
  }
  entry.count++;
  return true;
}

// Periodically clean up expired entries (prevents memory leak)
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000); // every 5 minutes
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Apply security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }

  // Rate limiting on sensitive API routes
  const rateLimitKey = getRateLimitKey(req);
  if (rateLimitKey) {
    const path = rateLimitKey.split(":").slice(1).join(":");
    const limit = RATE_LIMITS[path];
    if (limit && !checkRateLimit(rateLimitKey, limit)) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests. Please try again later.",
          error_code: "RATE_LIMITED",
          timestamp: new Date().toISOString(),
        },
        { status: 429, headers: SECURITY_HEADERS }
      );
    }
  }

  return res;
}

export const config = {
  matcher: [
    // Apply to all API routes + pages
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|robots.txt).*)",
  ],
};
