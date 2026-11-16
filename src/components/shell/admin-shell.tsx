"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "sonner";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { Aurora } from "./aurora";
import { ThemeSync } from "./theme";
import { TooltipProvider, Modal } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";
import { useData } from "@/store/data";
import { useHydrated, useUI } from "@/store/ui";
import { bn } from "@/lib/bn";

const WARN_BEFORE_MS = 2 * 60_000;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const touch = useAuth((s) => s.touch);
  const timeoutMin = useData((s) => s.settings.sessionTimeoutMin);
  const expireOrders = useData((s) => s.expireOrders);
  const theme = useUI((s) => s.theme);
  const [warn, setWarn] = useState(false);
  const [left, setLeft] = useState(0);
  const lastTouch = useRef(0);

  // auth guard
  useEffect(() => {
    if (hydrated && !user) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, user, router, pathname]);

  // scheduled job stand-in: expire overdue orders on load and every minute
  useEffect(() => {
    if (!hydrated) return;
    expireOrders();
    const t = setInterval(expireOrders, 60_000);
    return () => clearInterval(t);
  }, [hydrated, expireOrders]);

  // activity tracking + session timeout
  useEffect(() => {
    if (!user) return;
    const onAct = () => {
      const now = Date.now();
      if (now - lastTouch.current > 10_000) {
        lastTouch.current = now;
        touch();
      }
    };
    const evs = ["pointerdown", "keydown", "scroll", "pointermove"] as const;
    evs.forEach((e) => window.addEventListener(e, onAct, { passive: true }));
    const tick = setInterval(() => {
      const idle = Date.now() - useAuth.getState().lastActivity;
      const limit = timeoutMin * 60_000;
      if (idle >= limit) {
        logout();
        router.replace("/admin/login?reason=timeout");
      } else if (idle >= limit - WARN_BEFORE_MS) {
        setWarn(true);
        setLeft(Math.ceil((limit - idle) / 1000));
      } else setWarn(false);
    }, 1000);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, onAct));
      clearInterval(tick);
    };
  }, [user, timeoutMin, touch, logout, router]);

  if (!hydrated || !user) {
    return (
      <>
        <Aurora />
        <ThemeSync />
        <div className="relative z-10 grid h-dvh place-items-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-line-strong border-t-copper" />
            <div className="text-[13px] text-ink-3">লোড হচ্ছে…</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <TooltipProvider>
      <Aurora />
      <ThemeSync />
      <div className="relative z-10 flex h-dvh overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <div key={pathname} className="page-enter mx-auto w-full max-w-[1600px] px-4 py-5 md:px-6 md:py-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      <CommandPalette />
      <Toaster position="bottom-right" theme={theme} toastOptions={{ className: "!font-sans !rounded-2xl !border-line !bg-surface-solid !text-ink !shadow-lg", duration: 4200 }} richColors closeButton />
      <Modal open={warn} onOpenChange={() => {}} title="আপনি কি এখনও কাজ করছেন?" description={`নিষ্ক্রিয়তার কারণে ${bn(left)} সেকেন্ড পর স্বয়ংক্রিয়ভাবে লগ আউট হবে।`}>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              router.replace("/admin/login");
            }}
          >
            লগ আউট
          </Button>
          <Button
            onClick={() => {
              touch();
              setWarn(false);
            }}
          >
            হ্যাঁ, কাজ চালিয়ে যাই
          </Button>
        </div>
      </Modal>
    </TooltipProvider>
  );
}
