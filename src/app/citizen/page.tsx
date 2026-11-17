"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ArrowUpRight, Bell, ChevronRight, LogOut, Sparkles, TrendingDown, PackageCheck, Hourglass, QrCode } from "lucide-react";
import { CitizenFrame } from "@/components/citizen-app/frame";
import { useMe, useAllowance } from "@/components/citizen-app/hooks";
import { WalletCard } from "@/components/citizen-app/wallet-card";
import { ProductArt } from "@/components/citizen-app/product-art";
import { Ring, Stagger, greeting, useCountdown } from "@/components/citizen-app/ui";
import { useCitizen } from "@/store/citizen";
import { useData } from "@/store/data";
import { UNIT_LABEL, type Order } from "@/lib/types";
import { orderTotals } from "@/lib/orders";
import { bn, taka, fmtDateTime, monthName } from "@/lib/bn";
import { cn } from "@/lib/utils";

/** iOS "live activity"-style strip for the order that is in progress. */
function LiveActivity({ o }: { o: Order }) {
  const cd = useCountdown(o.pickupDeadline);
  const ready = o.status === "AWAITING_PICKUP";
  return (
    <Link href={`/citizen/orders/${o.id}`} className="group relative flex items-center gap-3.5 overflow-hidden rounded-[22px] bg-[#121a1c] p-3.5 pr-4 text-white shadow-[0_14px_30px_-16px_rgba(18,26,28,.8)] transition-transform active:scale-[0.985] dark:bg-[#ece7de] dark:text-[#121a1c]">
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", ready ? "bg-[#8cc39a]" : "bg-[#e0b45a]")} />
      <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", ready ? "bg-[#8cc39a]/20 text-[#8cc39a] dark:text-[#3f7050]" : "bg-[#e0b45a]/20 text-[#e0b45a] dark:text-[#8a6212]")}>
        {ready ? <QrCode className="h-6 w-6" strokeWidth={1.8} /> : <Hourglass className="h-6 w-6 animate-[spin_6s_linear_infinite]" strokeWidth={1.8} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-wider opacity-60">
          <span className={cn("h-1.5 w-1.5 animate-pulse rounded-full", ready ? "bg-[#8cc39a]" : "bg-[#e0b45a]")} /> চলমান · {bn(o.orderNo)}
        </span>
        <span className="mt-0.5 block text-[15.5px] font-bold">{ready ? "পণ্য নেওয়ার জন্য প্রস্তুত" : "পৌরসভা আবেদন দেখছে"}</span>
        <span className="block text-[12.5px] opacity-70">{ready ? cd.text : `জমা ${fmtDateTime(o.appliedAt)}`}</span>
      </span>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition-transform group-hover:translate-x-0.5 dark:bg-black/10"><ChevronRight className="h-5 w-5" /></span>
    </Link>
  );
}

function Home() {
  const { citizen, orders } = useMe();
  const allowance = useAllowance();
  const logout = useCitizen((s) => s.logout);
  const wards = useData((s) => s.wards);
  const notes = useData((s) => s.notifications);
  const markRead = useData((s) => s.markNotificationRead);
  const myNotes = useMemo(() => notes.filter((n) => n.target === citizen.id).slice(0, 6), [notes, citizen.id]);
  const unread = myNotes.filter((n) => !n.read).length;
  const [, setTick] = useState(0);

  const active = orders.find((o) => o.status === "AWAITING_PICKUP") ?? orders.find((o) => o.status === "PENDING");
  const collected = orders.filter((o) => o.status === "COLLECTED");
  const saved = collected.reduce((s, o) => s + orderTotals(o).saving, 0);
  const ward = wards.find((w) => w.id === citizen.wardId);
  const firstName = citizen.nameBn.replace(/^(মোছাঃ|মোঃ)\s*/, "").split(" ")[0];

  // this month's usage in taka terms gives a single, readable "how much of my allowance is used" number
  const totalLimitValue = allowance.reduce((s, a) => s + a.product.perFamilyLimit * a.product.municipalPrice, 0);
  const usedValue = allowance.reduce((s, a) => s + a.used * a.product.municipalPrice, 0);
  const usedRatio = totalLimitValue ? usedValue / totalLimitValue : 0;
  const canBuy = allowance.filter((a) => a.left > 0 && a.product.stock > 0).length;

  // savings for the last 6 months for the sparkline
  const spark = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return collected.filter((o) => { const c = new Date(o.collectedAt!); return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth(); }).reduce((s, o) => s + orderTotals(o).saving, 0);
    });
  }, [collected]);
  const max = Math.max(1, ...spark);

  return (
    <div className="flex flex-col gap-5 px-5 pb-4 pt-6">
      {/* top bar */}
      <Stagger i={0} className="flex items-center justify-between">
        <div>
          <div className="text-[13.5px] font-medium text-ink-3">{greeting()},</div>
          <div className="text-[26px] font-bold leading-tight tracking-tight text-ink">{firstName}</div>
        </div>
        <div className="flex items-center gap-2">
          <Popover.Root onOpenChange={(o) => { if (!o) { myNotes.forEach((n) => !n.read && markRead(n.id)); setTick((t) => t + 1); } }}>
            <Popover.Trigger asChild>
              <button type="button" aria-label={`বার্তা${unread ? `, ${bn(unread)}টি নতুন` : ""}`} className="relative grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface-solid text-ink transition-colors hover:bg-sunken">
                <Bell className="h-5 w-5" strokeWidth={1.8} />
                {unread > 0 && <span className="num absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-copper px-1 text-[10.5px] font-bold text-white ring-2 ring-[var(--canvas)]">{bn(unread)}</span>}
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content align="end" sideOffset={10} className="glass-strong z-[60] w-[min(340px,calc(100vw-32px))] rounded-[22px] p-2 outline-none data-[state=open]:animate-[rise_260ms_var(--ease-out)]">
                <div className="px-3 py-2 text-[15px] font-bold text-ink">বার্তা</div>
                {myNotes.length === 0 && <div className="px-3 pb-4 text-[13.5px] text-ink-3">এখনও কোনো বার্তা নেই</div>}
                {myNotes.map((n) => (
                  <div key={n.id} className={cn("rounded-2xl px-3 py-2.5", !n.read && "bg-copper-soft/50")}>
                    <div className="text-[14px] leading-snug text-ink">{n.text}</div>
                    <div className="mt-0.5 text-[12px] text-ink-3">{fmtDateTime(n.at)}</div>
                  </div>
                ))}
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <button type="button" onClick={logout} aria-label="বের হন" className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface-solid text-ink-3 transition-colors hover:text-brick">
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>
        </div>
      </Stagger>

      <Stagger i={1}>
        <WalletCard citizen={citizen} wardNo={ward?.number} saved={saved} />
      </Stagger>

      {active && (
        <Stagger i={2}>
          <LiveActivity o={active} />
        </Stagger>
      )}

      {/* bento */}
      <Stagger i={3} className="grid grid-cols-2 gap-3">
        <div className="col-span-1 row-span-2 flex flex-col justify-between rounded-[24px] bg-sage-soft p-4">
          <div className="flex items-center justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-sage text-white dark:text-[#0a1114]"><TrendingDown className="h-[18px] w-[18px]" strokeWidth={2} /></span>
            <Link href="/citizen/orders" aria-label="অর্ডার ইতিহাস" className="grid h-8 w-8 place-items-center rounded-full text-sage hover:bg-sage/10"><ArrowUpRight className="h-[18px] w-[18px]" /></Link>
          </div>
          <div className="mt-6">
            <div className="text-[12.5px] font-medium text-ink-2">বাজারের চেয়ে কম দিয়েছেন</div>
            <div className="num mt-0.5 text-[26px] font-bold leading-tight tracking-tight text-sage">{taka(saved)}</div>
          </div>
          <div className="mt-3 flex h-12 items-end gap-1.5" aria-label="শেষ ৬ মাসের সাশ্রয়">
            {spark.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className={cn("w-full rounded-full transition-[height] duration-1000 ease-[var(--ease-out)]", i === 5 ? "bg-sage" : "bg-sage/30")} style={{ height: `${Math.max(8, (v / max) * 40)}px` }} />
              </div>
            ))}
          </div>
          <div className="mt-1.5 text-[11px] text-ink-3">শেষ ৬ মাস</div>
        </div>

        <div className="flex items-center gap-3 rounded-[24px] border border-line bg-surface-solid p-3.5">
          <Ring value={1 - usedRatio} size={48} stroke={5} color="var(--copper)">
            <span className="num text-[11.5px] font-bold text-ink">{bn(Math.round((1 - usedRatio) * 100))}%</span>
          </Ring>
          <div className="min-w-0">
            <div className="text-[12px] text-ink-3">এ মাসের বরাদ্দ</div>
            <div className="text-[14px] font-bold leading-tight text-ink">{usedRatio >= 1 ? "সব নেওয়া হয়েছে" : "এখনও বাকি"}</div>
          </div>
        </div>
        <Link href="/citizen/orders" className="flex items-center gap-3 rounded-[24px] border border-line bg-surface-solid p-3.5 transition-colors hover:bg-sunken">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-petrol-soft text-petrol"><PackageCheck className="h-[22px] w-[22px]" strokeWidth={1.8} /></span>
          <div className="min-w-0">
            <div className="text-[12px] text-ink-3">সংগ্রহ করেছেন</div>
            <div className="num text-[18px] font-bold leading-tight text-ink">{bn(collected.length)} বার</div>
          </div>
        </Link>
      </Stagger>

      {/* allowance carousel */}
      <Stagger i={4}>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-[18px] font-bold tracking-tight text-ink">এ মাসে আর নিতে পারবেন</h2>
            <p className="text-[12.5px] text-ink-3">{monthName(new Date().getMonth())} মাসের পরিবারপ্রতি সীমা</p>
          </div>
          <Link href="/citizen/products" className="flex items-center gap-0.5 text-[13px] font-semibold text-copper-deep dark:text-copper">সব <ChevronRight className="h-4 w-4" /></Link>
        </div>
        <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
          {allowance.map(({ product: p, left }) => (
            <Link key={p.id} href="/citizen/products" className={cn("w-[132px] shrink-0 snap-start overflow-hidden rounded-[22px] border border-line bg-surface-solid transition-transform active:scale-[0.97]", left === 0 && "opacity-55")}>
              <ProductArt product={p} size={56} className="h-[84px]" />
              <div className="p-3">
                <div className="truncate text-[13.5px] font-semibold text-ink">{p.name}</div>
                <div className="mt-1 flex items-center gap-2">
                  <Ring value={left / p.perFamilyLimit} size={22} stroke={3} />
                  <span className="num text-[13px] text-ink-2"><b className="text-ink">{bn(left)}</b>/{bn(p.perFamilyLimit)} {UNIT_LABEL[p.unit]}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Stagger>

      <Stagger i={5}>
        <Link href="/citizen/products" className={cn("group relative flex h-[60px] items-center justify-between overflow-hidden rounded-full bg-[#121a1c] pl-6 pr-2 text-white shadow-[0_18px_36px_-16px_rgba(18,26,28,.7)] transition-transform active:scale-[0.985] dark:bg-[#ece7de] dark:text-[#121a1c]", canBuy === 0 && "pointer-events-none opacity-50")}>
          <span className="flex items-center gap-2 text-[16px] font-bold"><Sparkles className="h-[18px] w-[18px] text-[#e8ab86] dark:text-copper" strokeWidth={2} /> {canBuy === 0 ? "এ মাসের সব বরাদ্দ নেওয়া হয়েছে" : "পণ্য বেছে নিন"}</span>
          <span className="grad-copper grid h-11 w-11 place-items-center rounded-full text-white transition-transform duration-300 group-hover:translate-x-0.5"><ChevronRight className="h-5 w-5" strokeWidth={2.4} /></span>
        </Link>
      </Stagger>
    </div>
  );
}

export default function CitizenHomePage() {
  return (
    <CitizenFrame>
      <Home />
    </CitizenFrame>
  );
}
