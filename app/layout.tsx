// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald, Merriweather } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/app/components/SiteHeader";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// For BREAKING NEWS pill
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// For NEWS CARD TITLE
const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "KnotShorts",
    template: "%s · KnotShorts",
  },
  description: "Fast. Clean. Readable.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="KnotShorts RSS"
          href="/rss.xml"
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} ${merriweather.variable} antialiased`}
      >
        <div className="min-h-screen bg-black text-white flex flex-col">
          <SiteHeader />

          <main className="flex-1">{children}</main>

          {/* ✅ TRUST FOOTER (Phase 4) */}
          <footer className="border-t border-white/10 mt-16">
            <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-white/70">
              <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-between items-center">
                <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
                  <Link href="/about" className="hover:text-white">
                    About
                  </Link>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                  <Link
                    href="/editorial-policy"
                    className="hover:text-white"
                  >
                    Editorial Policy
                  </Link>
                  <Link href="/corrections" className="hover:text-white">
                    Corrections
                  </Link>
                  <Link
                    href="/privacy-policy"
                    className="hover:text-white"
                  >
                    Privacy Policy
                  </Link>
                </div>

                <div className="text-xs text-white/50 text-center md:text-right">
                  © {new Date().getFullYear()} KnotShorts. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
