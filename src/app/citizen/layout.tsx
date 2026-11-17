import type { Metadata } from "next";

export const metadata: Metadata = { manifest: "/citizen.webmanifest" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
