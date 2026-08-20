import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Restituisce sempre un URL valido per metadataBase.
 * Il try-catch garantisce che qualsiasi valore malformato in NEXT_PUBLIC_SITE_URL
 * (spazi, brackets, protocollo mancante, caratteri invalidi…) non mandi in crash
 * il build di Vercel con "TypeError: Invalid URL".
 */
function getMetadataBase(): URL {
  try {
    const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    if (!raw.trim()) throw new Error("empty");
    const cleaned = raw.trim().startsWith("http")
      ? raw.trim()
      : `https://${raw.trim()}`;
    return new URL(cleaned);
  } catch {
    // Fallback sicuro: se la variabile è assente o invalida usiamo il dominio default
    return new URL("https://stabia-basket.vercel.app");
  }
}

export const metadata: Metadata = {
  title: "Stabia Basket BTS & NPS – Gestionale",
  description: "Gestionale ufficiale della società sportiva Stabia Basket BTS & NPS",
  metadataBase: getMetadataBase(),

  /* ── Open Graph (WhatsApp, Telegram, Facebook, LinkedIn…) ── */
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Stabia Basket",
    title: "Stabia Basket BTS & NPS",
    description: "Gestionale ufficiale Stabia Basket BTS & NPS",
    images: [
      {
        url: "https://stabia-basket-app.vercel.app/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "Stabia Basket Gestionale",
      }
    ],
  },

  /* ── Twitter / X card ── */
  twitter: {
    card: "summary",
    title: "Stabia Basket BTS & NPS",
    description: "Gestionale ufficiale Stabia Basket BTS & NPS",
    images: ["https://stabia-basket-app.vercel.app/web-app-manifest-512x512.png"],
  },

  /* ── Favicon & icone ── */
  icons: {
    icon: [
      { url: "/favicon.ico",       sizes: "48x48" },
      { url: "/favicon.svg",       type: "image/svg+xml" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  /* ── Web App Manifest (Android / PWA) ── */
  manifest: "/site.webmanifest",

  /* ── Apple Web App (iOS "Aggiungi a schermata Home") ── */
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stabia Basket",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A1F44",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="it"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
