import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EarnStream — Premium Micro-Task Earning Platform",
  description:
    "EarnStream is a premium micro-tasking platform. Complete Gmail and TikTok tasks, withdraw to EasyPaisa/JazzCash/Binance, and earn 10% referral bonuses.",
  keywords: [
    "EarnStream",
    "micro-tasks",
    "earn money online",
    "EasyPaisa",
    "JazzCash",
    "Binance",
    "referral earnings",
  ],
  authors: [{ name: "EarnStream" }],
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
        <SonnerToaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast:
                "!bg-[rgba(20,16,32,0.92)] !backdrop-blur-xl !border !border-white/10 !text-violet-50",
              title: "!text-white",
              description: "!text-violet-100/60",
            },
          }}
        />
      </body>
    </html>
  );
}
