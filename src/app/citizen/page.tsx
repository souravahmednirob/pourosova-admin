"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Bell, ChevronRight, LogOut, MapPin, QrCode, ShoppingBasket, Clock } from "lucide-react";
import { CitizenFrame } from "@/components/citizen-app/frame";
import { CitizenTracker } from "@/components/citizen-app/tracker";
import { useMe, useAllowance } from "@/components/citizen-app/hooks";
import { LogoMark } from "@/components/shell/logo";
import { Pill } from "@/components/ui/primitives";
import { useCitizen } from "@/store/citizen";
import { useData } from "@/store/data";
import { ORDER_STATUS_LABEL, UNIT_LABEL } from "@/lib/types";
import { orderTotals, orderTone } from "@/lib/orders";
import { bn, taka, fmtDateTime, fmtMonthYear, WARD_NAME } from "@/lib/bn";
import { cn } from "@/lib/utils";

function Home() {
  const { citizen, orders } = useMe();
  const allowance = useAllowance();
  const logout = useCitizen((s) => s.logout);
  const wards = useData((s) => s.wards);
  const notes = useData((s) => s.notifications);
  const markRead = useData((s) => s.markNotificationRead);
  const myNotes = useMemo(() => notes.filter((n) => n.target === citizen.id).slice(0, 3), [notes, citizen.id]);
  const latest = orders[0];
  const pickup = orders.find((o) => o.status === "AWAITING_PICKUP");
  const saved = orders.filter((o) => o.status === "COLLECTED").reduce((s, o) => s + orderTotals(o).saving, 0);
  const ward = wards.find((w) => w.id === citizen.wardId);
  const leftCount = allowance.filter((a) => a.left > 0 && a.product.stock > 0).length;
  const firstName = citizen.nameBn.replace(/^(মোছাঃ|মোঃ)\s*/, "").split(" ")[0];

  return (
    <div className="page-enter flex flex-col gap-5 px-5 pb-6 pt-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[14px] text-ink-3">আসসালামু আলাইকুম,</div>
          <div className="text-[22px] font-bold leading-tight text-ink">{firstName}</div>
        </div>
        <button type="button" onClick={logout} aria-label="বের হন" className="grid h-11 w-11 place-items-center rounded-[14px] border border-line-strong text-ink-3 hover:text-brick">
          <LogOut className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>

      {/* ration card */}
      <div className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#1f4d58_0%,#163a43_50%,#7e4323_130%)] p-5 text-white shadow-[0_24px_48px_-20px_rgba(31,77,88,.7)]">
        <div aria-hidden className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(232,171,134,.45),transparent_70%)]" />
        <div aria-hidden className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(124,188,203,.25),transparent_70%)]" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-[12px] font-medium text-[#e8ab86]">রেশন কার্ড</div>
            <div className="num mt-1 text-[26px] font-bold tracking-wide">{bn(citizen.rationCardNo ?? "")}</div>
          </div>
          <LogoMark size={44} />
        </div>
        <div className="relative mt-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[16px] font-semibold">{citizen.nameBn}</div>
            <div className="text-[12.5px] text-[#cfdde0]">{ward ? WARD_NAME(ward.number) : ""} · পরিবার {bn(citizen.familySize)} জন</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11.5px] text-[#cfdde0]">মোট সাশ্রয়</div>
            <div className="num text-[18px] font-bold text-[#e8ab86]">{taka(saved)}</div>
          </div>
        </div>
      </div>

      {/* ready to collect */}
      {pickup && (
        <Link href={`/citizen/orders/${pickup.id}`} className="hairline flex items-center gap-4 rounded-[22px] bg-petrol-soft p-4 transition-transform active:scale-[0.99]">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-petrol text-white dark:text-[#0a1114]"><QrCode className="h-6 w-6" strokeWidth={1.8} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold text-petrol">পণ্য সংগ্রহের জন্য প্রস্তুত</span>
            <span className="flex items-center gap-1 text-[13px] text-ink-2"><Clock className="h-3.5 w-3.5" /> শেষ সময় {fmtDateTime(pickup.pickupDeadline!)}</span>
          </span>
          <ChevronRight className="h-5 w-5 text-petrol" />
        </Link>
      )}

      {/* this month's allowance */}
      <section className="glass rounded-[22px] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-ink">এই মাসে বাকি বরাদ্দ</h2>
          <span className="text-[12.5px] text-ink-3">{fmtMonthYear(new Date())}</span>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {allowance.map(({ product: p, left, used }) => (
            <li key={p.id} className="rounded-2xl bg-sunken px-3 py-2.5">
              <div className="truncate text-[13px] text-ink-2">{p.name}</div>
              <div className="flex items-baseline gap-1">
                <span className={cn("num text-[18px] font-bold", left === 0 ? "text-ink-4" : "text-ink")}>{bn(left)}</span>
                <span className="text-[12px] text-ink-3">/ {bn(p.perFamilyLimit)} {UNIT_LABEL[p.unit]}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--line)]">
                <div className="h-full rounded-full bg-sage-2" style={{ width: `${(left / p.perFamilyLimit) * 100}%` }} />
              </div>
              {used > 0 && left === 0 && <div className="mt-1 text-[11px] text-ink-3">এ মাসের সীমা শেষ</div>}
            </li>
          ))}
        </ul>
        <Link href="/citizen/products" className={cn("grad-copper mt-4 flex h-[52px] items-center justify-center gap-2 rounded-[16px] text-[16px] font-bold text-white shadow-[0_10px_24px_-10px_var(--glow)]", leftCount === 0 && "pointer-events-none opacity-50")}>
          <ShoppingBasket className="h-5 w-5" strokeWidth={1.8} /> {leftCount === 0 ? "এ মাসের সব বরাদ্দ নেওয়া হয়েছে" : "পণ্যের আবেদন করুন"}
        </Link>
      </section>

      {/* latest order */}
      {latest && (
        <section className="glass rounded-[22px] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-ink">শেষ অর্ডার</h2>
            <Link href={`/citizen/orders/${latest.id}`} className="flex items-center text-[13px] font-semibold text-copper-deep dark:text-copper">বিস্তারিত <ChevronRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="num text-[13px] text-ink-3">{bn(latest.orderNo)} · {taka(orderTotals(latest).total)}</span>
            <Pill tone={orderTone[latest.status]} dot>{ORDER_STATUS_LABEL[latest.status]}</Pill>
          </div>
          <div className="mt-4"><CitizenTracker o={latest} /></div>
          {latest.status === "CANCELLED" && latest.rejectReason && <div className="mt-3 rounded-xl bg-brick-soft px-3 py-2 text-[13px] text-brick">কারণ: {latest.rejectReason}</div>}
        </section>
      )}

      {/* messages */}
      {myNotes.length > 0 && (
        <section className="glass rounded-[22px] p-4">
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-ink"><Bell className="h-4.5 w-4.5" strokeWidth={1.8} /> বার্তা</h2>
          <ul className="mt-2 divide-y divide-line">
            {myNotes.map((n) => (
              <li key={n.id} onClick={() => markRead(n.id)} className="flex items-start gap-2.5 py-2.5">
                <span className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-ink-4/40" : "bg-copper")} />
                <span>
                  <span className="block text-[14px] text-ink">{n.text}</span>
                  <span className="block text-[12px] text-ink-3">{fmtDateTime(n.at)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex items-center justify-center gap-1.5 text-[12px] text-ink-4"><MapPin className="h-3.5 w-3.5" /> কালিয়াকৈর পৌরসভা, গাজীপুর</div>
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
