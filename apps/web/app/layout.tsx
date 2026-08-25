import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import PwaRegister from "@/components/pwa-register";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MarketUp | Your Personal Storefront SaaS",
  description: "Create and manage your online shop in minutes with MarketUp.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MarketUp",
  },
  other: {
    // Older iOS (<17.4) only recognizes the vendor-prefixed tag; Next.js's
    // appleWebApp.capable only emits the newer unprefixed "mobile-web-app-capable".
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster position="top-center" richColors />
          <PwaRegister />
        </QueryProvider>
      </body>
    </html>
  );
}
