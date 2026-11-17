"use client";
import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { ChevronLeft, WifiOff } from "lucide-react";
import { Aurora } from "@/components/shell/aurora";
import { ThemeSync } from "@/components/shell/theme";
import { LogoMark } from "@/components/shell/logo";
import { useAgent } from "@/store/agent";
import { useHydrated, useUI } from "@/store/ui";
import { cn } from "@/lib/utils";

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}
export function useOnline() {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

/** Phone-width column used by every field-agent screen. */
export function AgentFrame({ children, requireAuth = true }: { children: React.ReactNode; requireAuth?: boolean }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const agent = useAgent((s) => s.agent);
  const theme = useUI((s) => s.theme);
  const online = useOnline();

  // installable + offline: register the service worker in production builds
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    if (requireAuth && hydrated && !agent) router.replace("/agent/login");
  }, [requireAuth, hydrated, agent, router, pathname]);

  return (
    <>
      <Aurora />
      <ThemeSync />
      <div className="relative z-10 flex min-h-dvh justify-center sm:py-6">
        <div className="relative flex w-full max-w-[430px] flex-col overflow-hidden bg-[var(--canvas)] sm:min-h-[860px] sm:rounded-[32px] sm:shadow-[var(--shadow-lg)] sm:ring-1 sm:ring-[var(--line)]">
          {!online && (
            <div className="flex items-center justify-center gap-2 bg-ochre-soft px-4 py-2 text-[13px] font-medium text-ochre" role="status">
              <WifiOff className="h-4 w-4" strokeWidth={1.8} /> ইন্টারনেট নেই — নিবন্ধন ফোনে জমা থাকবে
            </div>
          )}
          {hydrated && (!requireAuth || agent) ? children : <div className="grid flex-1 place-items-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-line-strong border-t-copper" /></div>}
        </div>
      </div>
      <Toaster position="top-center" theme={theme} toastOptions={{ className: "!font-sans !rounded-2xl !text-[14px]" }} richColors />
    </>
  );
}

/** Branded header used on agent screens. */
export function AgentHeader({ eyebrow, title, subtitle, onBack, children, compact }: { eyebrow?: string; title?: string; subtitle?: string; onBack?: () => void; children?: React.ReactNode; compact?: boolean }) {
  return (
    <header className={cn("relative overflow-hidden bg-[linear-gradient(150deg,#1f4d58_0%,#163a43_55%,#12303a_100%)] px-5 text-[#f2efe9]", compact ? "pb-5 pt-5" : "pb-6 pt-5")}>
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(201,126,82,.35),transparent_70%)]" />
      <div className="relative flex items-center justify-between gap-3">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="পেছনে" className="grid h-11 w-11 place-items-center rounded-[12px] border border-white/25 text-white transition-colors hover:bg-white/10">
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2.5">
          <div className="text-right leading-tight">
            <div className="text-[15px] font-bold text-white">কালিয়াকৈর পৌরসভা</div>
            <div className="text-[12px] font-medium text-[#e8ab86]">নাগরিক রেশন সেবা</div>
          </div>
          <LogoMark size={46} />
        </div>
      </div>
      {(eyebrow || title) && (
        <div className="relative mt-4">
          {eyebrow && <div className="text-[13px] font-semibold text-[#e8ab86]">{eyebrow}</div>}
          {title && <h1 className="text-[25px] font-bold leading-tight text-white">{title}</h1>}
          {subtitle && <p className="mt-1 text-[14px] text-[#cfdde0]">{subtitle}</p>}
        </div>
      )}
      {children && <div className="relative mt-4">{children}</div>}
    </header>
  );
}

export const bigInput =
  "h-[52px] w-full rounded-[14px] border border-line-strong bg-surface-solid px-4 text-[16px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-4 focus:border-copper focus:shadow-[0_0_0_3px_var(--copper-soft)]";
