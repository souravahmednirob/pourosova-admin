"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { Home, ShoppingBasket, ReceiptText, WifiOff } from "lucide-react";
import { Aurora } from "@/components/shell/aurora";
import { ThemeSync } from "@/components/shell/theme";
import { useOnline } from "@/components/agent/agent-frame";
import { useCitizen } from "@/store/citizen";
import { useData } from "@/store/data";
import { useHydrated, useUI } from "@/store/ui";
import { bn } from "@/lib/bn";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/citizen", label: "হোম", Icon: Home },
  { href: "/citizen/products", label: "পণ্য", Icon: ShoppingBasket },
  { href: "/citizen/orders", label: "আমার অর্ডার", Icon: ReceiptText },
];

/** Phone-width shell for the citizen app, with bottom tab bar. */
export function CitizenFrame({ children, requireAuth = true, tabs = true }: { children: React.ReactNode; requireAuth?: boolean; tabs?: boolean }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const citizenId = useCitizen((s) => s.citizenId);
  const cartCount = useCitizen((s) => Object.keys(s.cart).length);
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
          <div className={cn("flex flex-1 flex-col", tabs && ready && "pb-[84px]")}>
            {ready ? children : <div className="grid flex-1 place-items-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-line-strong border-t-copper" /></div>}
          </div>
          {tabs && ready && (
            <nav aria-label="প্রধান মেনু" className="glass-strong fixed bottom-0 left-1/2 z-30 flex w-full max-w-[430px] -translate-x-1/2 items-stretch justify-around rounded-none border-x-0 border-b-0 px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 sm:absolute sm:rounded-b-[32px]">
              {TABS.map(({ href, label, Icon }) => {
                const on = isActive(href);
                return (
                  <Link key={href} href={href} aria-current={on ? "page" : undefined} className={cn("relative flex min-w-[88px] flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-[12.5px] font-semibold transition-colors", on ? "text-copper-deep dark:text-copper" : "text-ink-3")}>
                    <span className={cn("grid h-9 w-14 place-items-center rounded-full transition-all duration-300 ease-[var(--ease-spring)]", on && "bg-copper-soft")}>
                      <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
                    </span>
                    {label}
                    {href === "/citizen/products" && cartCount > 0 && <span className="num absolute right-4 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-copper px-1 text-[11px] font-bold text-white">{bn(cartCount)}</span>}
                  </Link>
                );
              })}
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
