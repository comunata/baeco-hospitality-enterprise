import type { Metadata } from "next";
import { Analytics } from "@/components/analytics/Analytics";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Baeco Hospitality",
    template: "%s — Baeco Hospitality",
  },
  description: "Ospitalitate discretă, standard de lux.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className="h-full" suppressHydrationWarning>
      <body className="min-h-full overflow-x-hidden bg-midnight text-ivory antialiased">
        {children}
        <Analytics />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
