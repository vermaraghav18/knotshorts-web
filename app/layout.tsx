// app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Oswald, Merriweather } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/app/components/SiteHeader";

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

// ✅ For NEWS CARD TITLE
const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const SITE_NAME = "KnotShorts";
const SITE_URL = "https://knotshorts.com";

// ✅ If you have official socials, put them here. Empty array is fine.
const SAME_AS: string[] = [
  // "https://www.instagram.com/<yourhandle>/",
  // "https://www.youtube.com/@<yourhandle>",
  // "https://x.com/<yourhandle>",
];

export const metadata: Metadata = {
  title: {
    default: "KnotShorts",
    template: "%s · KnotShorts",
  },
  description: "Fast. Clean. Readable.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ SITEWIDE Publisher / Organization JSON-LD
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      // ✅ FIX: real logo file that actually exists in /public
      url: `${SITE_URL}/knotshorts-logo.png`,
    },
    sameAs: SAME_AS,
  };

  return (
    <html lang="en">
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="KnotShorts RSS"
          href="/rss.xml"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} ${merriweather.variable} antialiased`}
      >
        <div className="min-h-screen bg-black text-white">
          <SiteHeader />

          {/* ✅ Main content */}
          {children}

          {/* ✅ Footer: Trust Pages (publisher requirements) */}
          <footer className="mt-12 border-t border-white/10 bg-black/60">
            <div className="mx-auto max-w-6xl px-4 py-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-white/60">
                  © {new Date().getFullYear()} {SITE_NAME}
                </div>

                <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  <Link
                    href="/about"
                    className="text-white/70 hover:text-white transition"
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    className="text-white/70 hover:text-white transition"
                  >
                    Contact
                  </Link>
                  <Link
                    href="/editorial-policy"
                    className="text-white/70 hover:text-white transition"
                  >
                    Editorial Policy
                  </Link>
                  <Link
                    href="/corrections"
                    className="text-white/70 hover:text-white transition"
                  >
                    Corrections
                  </Link>
                  <Link
                    href="/privacy-policy"
                    className="text-white/70 hover:text-white transition"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    className="text-white/70 hover:text-white transition"
                  >
                    Terms
                  </Link>
                </nav>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
