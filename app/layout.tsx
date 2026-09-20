import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const siteUrl = process.env.VERCEL_URL
  ? new URL(`https://${process.env.VERCEL_URL}`)
  : new URL("http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "NYC + Newark Events",
    template: "%s | NYC + Newark Events",
  },
  description: "Discover upcoming sports, concerts, theatre, comedy, and family events across New York City and Newark.",
  openGraph: {
    title: "NYC + Newark Events",
    description: "Make a plan. See something live across NYC and Newark.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "NYC + Newark Events — Make a plan. See something live." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NYC + Newark Events",
    description: "Make a plan. See something live across NYC and Newark.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#events">Skip to events</a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
