import type { Metadata, Viewport } from "next";
import { themeInitScript } from "@/components/shell/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "নাগরিক রেশন সেবা – কালিয়াকৈর পৌরসভা",
  description: "কালিয়াকৈর পৌরসভার ভর্তুকিযুক্ত নিত্যপণ্য বিতরণ ব্যবস্থাপনা পোর্টাল",
  applicationName: "নাগরিক রেশন সেবা",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2efe9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1114" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
