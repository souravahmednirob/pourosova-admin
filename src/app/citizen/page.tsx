"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Bell, ChevronRight, LogOut, Sparkles, Hourglass, QrCode } from "lucide-react";
import { CitizenFrame } from "@/components/citizen-app/frame";
import { useMe, useAllowance } from "@/components/citizen-app/hooks";
import { WalletCard } from "@/components/citizen-app/wallet-card";
import { SavingsCard } from "@/components/citizen-app/savings-card";
import { ProductArt } from "@/components/citizen-app/product-art";
import { Stagger, greeting, useCountdown } from "@/components/citizen-app/ui";
import { useCitizen } from "@/store/citizen";
import { useData } from "@/store/data";
import { UNIT_LABEL, type Order } from "@/lib/types";
import { orderTotals } from "@/lib/orders";
import { bn, fmtDateTime, monthName } from "@/lib/bn";
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

  const canBuy = allowance.filter((a) => a.left > 0 && a.product.stock > 0).length;

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

      {/* this month's allowance — plain: product and how much is left */}
      <Stagger i={3}>
        <section className="rounded-[28px] border border-line bg-surface-solid p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[18px] font-bold tracking-tight text-ink">এ মাসে নিতে পারবেন</h2>
            <span className="text-[12.5px] text-ink-3">{monthName(new Date().getMonth())}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {allowance.map(({ product: p, left }) => (
              <Link key={p.id} href={`/citizen/products?p=${p.id}`} className={cn("flex items-center gap-2.5 rounded-[18px] bg-sunken p-2 transition-transform active:scale-[0.97]", left === 0 && "opacity-45")}>
                <ProductArt product={p} size={30} className="h-11 w-11 shrink-0 rounded-[14px]" />
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-ink">{p.name}</div>
                  <div className="num whitespace-nowrap text-[13px] text-ink-2">{left === 0 ? "নেওয়া হয়েছে" : <><b className="text-ink">{bn(left)}</b> {UNIT_LABEL[p.unit]}</>}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </Stagger>

      <Stagger i={4}>
        <SavingsCard orders={orders} />
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
