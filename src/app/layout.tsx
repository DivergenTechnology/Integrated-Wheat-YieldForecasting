import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "IWCYES · IWSS Dashboard — Irrigated Wheat Decision Support (Ethiopia)",
  description:
    "Remote sensing-enabled decision support system for irrigated wheat farming across the Bishoftu, Asella, and Ambo agricultural research institutes in Ethiopia. Provides yield estimation, irrigation scheduling, and UAV-based disease detection with attention-based ML attribution.",
  keywords: [
    "IWCYES",
    "IWSS",
    "Ethiopia",
    "irrigated wheat",
    "remote sensing",
    "Sentinel-2",
    "UAV multispectral",
    "attention mechanism",
    "decision support",
    "PostGIS",
    "Firebase",
    "Bishoftu",
    "Asella",
    "Ambo",
  ],
  authors: [{ name: "IWCYES-IWSS Project Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "IWCYES · IWSS Dashboard",
    description:
      "Remote sensing-enabled decision support system for irrigated wheat farming in Ethiopia",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IWCYES · IWSS Dashboard",
    description:
      "Remote sensing-enabled decision support system for irrigated wheat farming in Ethiopia",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
