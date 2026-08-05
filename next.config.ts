import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No `output: "standalone"` — Vercel handles the build output natively.
  // No `ignoreBuildErrors` — production builds must surface type errors.
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "rayhnuzdewzhtrwahzas.supabase.co" },
    ],
  },
};

export default nextConfig;
