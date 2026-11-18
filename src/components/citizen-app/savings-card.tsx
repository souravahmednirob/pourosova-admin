"use client";
import { useMemo, useState } from "react";
import { TrendingDown } from "lucide-react";
import type { Order } from "@/lib/types";
import { orderTotals } from "@/lib/orders";
import { bn, taka, monthName } from "@/lib/bn";
import { cn } from "@/lib/utils";

const shortTaka = (v: number) => (v >= 1000 ? `৳${bn((v / 1000).toFixed(1))}হা` : taka(v));

/**
 * "How much did I save?" in two plain pictures:
 *  1. one bar = what the market would have charged, split into what you paid and what you kept;
 *  2. six monthly columns with the saving written on top — tap a month to read its numbers.
 */
export function SavingsCard({ orders }: { orders: Order[] }) {
  const collected = useMemo(() => orders.filter((o) => o.status === "COLLECTED"), [orders]);
  const all = useMemo(() => collected.reduce((a, o) => { const t = orderTotals(o); return { market: a.market + t.market, paid: a.paid + t.total }; }, { market: 0, paid: 0 }), [collected]);
  const saved = all.market - all.paid;
  const paidPct = all.market ? (all.paid / all.market) * 100 : 0;

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const inMonth = collected.filter((o) => { const c = new Date(o.collectedAt!); return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth(); });
      const t = inMonth.reduce((a, o) => { const x = orderTotals(o); return { market: a.market + x.market, paid: a.paid + x.total }; }, { market: 0, paid: 0 });
      return { m: d.getMonth(), y: d.getFullYear(), count: inMonth.length, ...t, saved: t.market - t.paid };
    });
  }, [collected]);
  const max = Math.max(1, ...months.map((m) => m.saved));
  const lastWithData = [...months].reverse().findIndex((m) => m.count > 0);
  const [sel, setSel] = useState(lastWithData < 0 ? 5 : 5 - lastWithData);
  const s = months[sel];

  return (
    <section className="hairline relative overflow-hidden rounded-[28px] border border-line bg-surface-solid p-5">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,var(--sage-soft),transparent_70%)]" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-medium text-ink-3">আপনার মোট সাশ্রয়</div>
          <div className="num mt-0.5 text-[34px] font-bold leading-none tracking-tight text-sage">{taka(saved)}</div>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-sage text-white dark:text-[#0a1114]"><TrendingDown className="h-5 w-5" strokeWidth={2.2} /></span>
      </div>

      {all.market === 0 && <p className="relative mt-3 text-[13.5px] leading-relaxed text-ink-3">প্রথমবার পণ্য নেওয়ার পর এখানে দেখাবে বাজারের তুলনায় কত টাকা বাঁচল।</p>}
      {/* 1 — market price split into paid + saved */}
      {all.market > 0 && (
      <div className="relative mt-5">
        <div className="mb-1.5 flex justify-between text-[12px] text-ink-3">
          <span>বাজারে কিনলে লাগত</span>
          <span className="num font-semibold text-ink-2">{taka(all.market)}</span>
        </div>
        <div className="flex h-11 overflow-hidden rounded-2xl ring-1 ring-[var(--line)]">
          <div className="flex items-center bg-[#121a1c] px-3 text-white transition-[width] duration-1000 ease-[var(--ease-out)] dark:bg-[#ece7de] dark:text-[#121a1c]" style={{ width: `${Math.max(paidPct, 28)}%` }}>
            <span className="truncate text-[12.5px] font-semibold">দিয়েছেন <span className="num">{taka(all.paid)}</span></span>
          </div>
          <div className="flex flex-1 items-center justify-end bg-[repeating-linear-gradient(135deg,var(--sage-soft)_0_8px,transparent_8px_14px)] px-3">
            <span className="num truncate text-[12.5px] font-bold text-sage">বাঁচল {taka(saved)}</span>
          </div>
        </div>
      </div>
      )}

      {/* 2 — month by month */}
      {all.market === 0 ? null : months.every((m) => m.count === 0) ? (
        <div className="relative mt-5 rounded-2xl bg-sunken px-4 py-3.5 text-[13px] leading-relaxed text-ink-2">শেষ ৬ মাসে কোনো পণ্য নেননি। পণ্য নিলে এখানে মাস অনুযায়ী সাশ্রয় দেখাবে।</div>
      ) : (
      <div className="relative mt-6">
        <div className="mb-2 text-[13px] font-semibold text-ink-2">মাস অনুযায়ী সাশ্রয়</div>
        <div className="grid h-[132px] grid-cols-6 items-end gap-2">
          {months.map((m, i) => {
            const on = i === sel;
            const h = m.saved ? Math.max(14, (m.saved / max) * 84) : 6;
            return (
              <button key={i} type="button" onClick={() => setSel(i)} aria-pressed={on} aria-label={`${monthName(m.m)}: সাশ্রয় ${taka(m.saved)}`} className="group flex h-full flex-col items-center justify-end gap-1.5">
                <span className={cn("num text-[10.5px] font-bold transition-colors", on ? "text-sage" : "text-ink-3", !m.saved && "opacity-0")}>{shortTaka(m.saved)}</span>
                <span className={cn("w-full rounded-[10px] transition-all duration-700 ease-[var(--ease-spring)]", on ? "bg-sage shadow-[0_8px_18px_-8px_var(--sage)]" : m.saved ? "bg-sage/25 group-hover:bg-sage/40" : "bg-[var(--line)]")} style={{ height: h }} />
                <span className={cn("text-[11px] transition-colors", on ? "font-bold text-ink" : "text-ink-3")}>{monthName(m.m, true)}</span>
              </button>
            );
          })}
        </div>
        <div key={sel} className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl bg-sunken px-4 py-3 text-[13px] animate-[rise_360ms_var(--ease-out)]">
          <span className="font-semibold text-ink">{monthName(s.m)} {bn(s.y)}</span>
          {s.count ? (
            <span className="text-ink-2"><span className="num">{bn(s.count)}</span> বার নিয়েছেন · দিয়েছেন <b className="num text-ink">{taka(s.paid)}</b> · বাঁচল <b className="num text-sage">{taka(s.saved)}</b></span>
          ) : (
            <span className="text-ink-3">এ মাসে কিছু নেননি</span>
          )}
        </div>
      </div>
      )}
    </section>
  );
}
