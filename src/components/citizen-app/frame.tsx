"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { Home, ShoppingBasket, ReceiptText, WifiOff } from "lucide-react";
import { Aurora } from "@/components/shell/aurora";
import { ThemeSync } from "@/components/shell/theme";
import { useOnline } from "@/components/agent/agent-frame";
import { CartBubble } from "./cart-bubble";
import { useCitizen } from "@/store/citizen";
import { useData } from "@/store/data";
import { useHydrated, useUI } from "@/store/ui";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/citizen", label: "হোম", Icon: Home },
  { href: "/citizen/products", label: "পণ্য", Icon: ShoppingBasket },
  { href: "/citizen/orders", label: "অর্ডার", Icon: ReceiptText },
];

/** Phone-width shell for the citizen app, with bottom tab bar. */
export function CitizenFrame({ children, requireAuth = true, tabs = true }: { children: React.ReactNode; requireAuth?: boolean; tabs?: boolean }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const citizenId = useCitizen((s) => s.citizenId);
  const citizenOk = useData((s) => !!s.citizens.find((c) => c.id === citizenId && c.status === "APPROVED"));
  const logout = useCitizen((s) => s.logout);
  const theme = useUI((s) => s.theme);
  const online = useOnline();
  const expire = useData((s) => s.expireOrders);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    if (citizenId && !citizenOk) logout(); // data was reset or card deactivated
    if (requireAuth && !citizenId) router.replace("/citizen/login");
    expire();
  }, [hydrated, citizenId, citizenOk, requireAuth, router, logout, expire]);

  const ready = hydrated && (!requireAuth || (citizenId && citizenOk));
  const isActive = (href: string) => (href === "/citizen" ? pathname === "/citizen" : pathname.startsWith(href));

  return (
    <>
      <Aurora />
      <ThemeSync />
      <div className="relative z-10 flex min-h-dvh justify-center sm:py-6">
        <div className="relative flex w-full max-w-[430px] flex-col overflow-hidden bg-[var(--canvas)] sm:min-h-[860px] sm:rounded-[32px] sm:shadow-[var(--shadow-lg)] sm:ring-1 sm:ring-[var(--line)]">
          {!online && (
            <div className="flex items-center justify-center gap-2 bg-ochre-soft px-4 py-2 text-[13px] font-medium text-ochre" role="status">
              <WifiOff className="h-4 w-4" strokeWidth={1.8} /> ইন্টারনেট নেই — কিছু তথ্য পুরোনো হতে পারে
            </div>
          )}
          <div className={cn("flex flex-1 flex-col", tabs && ready && "pb-[104px]")}>
            {ready ? children : <div className="grid flex-1 place-items-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-line-strong border-t-copper" /></div>}
          </div>
          {tabs && ready && <CartBubble />}
          {tabs && ready && (
            <nav aria-label="প্রধান মেনু" className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 sm:absolute">
              <div className="relative grid grid-cols-3 rounded-full border border-[var(--line)] bg-[var(--surface-strong)] p-1.5 shadow-[0_18px_40px_-14px_rgba(18,26,28,.35)] backdrop-blur-xl">
                {/* sliding active indicator */}
                <span aria-hidden className="absolute bottom-1.5 top-1.5 rounded-full bg-[#121a1c] transition-transform duration-500 ease-[var(--ease-spring)] dark:bg-[#ece7de]" style={{ left: 6, width: "calc((100% - 12px) / 3)", transform: `translateX(${Math.max(0, TABS.findIndex((t) => isActive(t.href))) * 100}%)` }} />
                {TABS.map(({ href, label, Icon }) => {
                  const on = isActive(href);
                  return (
                    <Link key={href} href={href} aria-current={on ? "page" : undefined} className={cn("relative z-10 flex h-12 items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold transition-colors duration-300", on ? "text-white dark:text-[#121a1c]" : "text-ink-3 hover:text-ink")}>
                      <Icon className="h-[20px] w-[20px] shrink-0" strokeWidth={on ? 2.1 : 1.8} />
                      <span className={cn("overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-500 ease-[var(--ease-out)]", on ? "max-w-[90px] opacity-100" : "max-w-0 opacity-0")}>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </div>
      <Toaster position="top-center" theme={theme} toastOptions={{ className: "!font-sans !rounded-2xl !text-[14px]" }} richColors />
    </>
  );
}

/** Small page title used inside the citizen app. */
export function CitizenTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 px-5 pb-3 pt-6">
      <div>
        <h1 className="text-[24px] font-bold leading-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[14px] text-ink-3">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
