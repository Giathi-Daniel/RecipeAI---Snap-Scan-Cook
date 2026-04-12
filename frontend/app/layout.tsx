import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header } from "@/components/header";
import { NavigationLoader } from "@/components/navigation-loader";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { getSiteUrl, getSiteUrlObject } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: getSiteUrlObject(),
  applicationName: "RecipeAI",
  title: {
    default: "RecipeAI | Snap, Scan & Cook",
    template: "%s | RecipeAI",
  },
  description:
    "RecipeAI helps you upload food photos or paste recipe text, then turns them into structured, interactive recipes with AI.",
  keywords: [
    "RecipeAI",
    "AI recipes",
    "recipe parser",
    "food photo recipe generator",
    "meal planning",
    "cooking assistant",
  ],
  alternates: {
    canonical: "/",
  },
  category: "food",
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "RecipeAI | Snap, Scan & Cook",
    description:
      "Upload a dish photo or paste recipe text to generate structured, interactive recipes with AI.",
    siteName: "RecipeAI",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "RecipeAI app icon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RecipeAI | Snap, Scan & Cook",
    description:
      "Turn recipe text and food photos into clean, interactive recipes with AI-powered cooking help.",
    images: ["/android-chrome-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/android-chrome-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/android-chrome-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <PerformanceMonitor />
        <ServiceWorkerRegistration />
        <NavigationLoader />
        <Header />
        <main className="min-h-[calc(100vh-89px)]">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
