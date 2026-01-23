// app/layout.tsx
import type { Metadata } from "next";
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
        <div className="min-h-screen bg-black text-white">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
