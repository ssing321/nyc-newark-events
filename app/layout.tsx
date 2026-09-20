import type { Metadata } from "next";
import { Barlow_Condensed, Space_Grotesk } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const displayFont = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const siteUrl = process.env.VERCEL_URL
  ? new URL(`https://${process.env.VERCEL_URL}`)
  : new URL("http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "SCENE — NYC / North Jersey Events",
    template: "%s | SCENE",
  },
  description: "Find your next move across NYC and North Jersey—music, sports, theatre, comedy, family events, and more.",
  openGraph: {
    title: "SCENE — Find Your Next Move",
    description: "Event discovery for NYC and North Jersey.",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "SCENE — Find your next move in NYC and North Jersey." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SCENE — Find Your Next Move",
    description: "Event discovery for NYC and North Jersey.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
