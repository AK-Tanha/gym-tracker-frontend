import type { Metadata, Viewport } from "next";
import { Oswald, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import TabBar from "@/components/TabBar";
import Providers from "@/components/Providers";
import AppBackground from "@/components/AppBackground";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";
import OfflineBanner from "@/components/OfflineBanner";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Stat-Fit",
  description: "Track your workout routine",
  manifest: "/manifest.webmanifest",
  applicationName: "Stat·Fit",
  icons: {
    icon: "/icon-192x192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Stat·Fit",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b1b1d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${oswald.variable} ${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>
          <RegisterServiceWorker />
          <OfflineBanner />
          <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-iron">
            <AppBackground />
            <div className="relative z-10 flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1 overflow-y-auto pb-20 pt-14">{children}</main>
              <TabBar />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
