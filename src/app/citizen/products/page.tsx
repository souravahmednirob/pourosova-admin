"use client";
import Link from "next/link";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { CitizenFrame, CitizenTitle } from "@/components/citizen-app/frame";
import { useAllowance } from "@/components/citizen-app/hooks";
import { useCitizen } from "@/store/citizen";
import { useData } from "@/store/data";
import { CATEGORY_LABEL, UNIT_LABEL } from "@/lib/types";
import { savingPct, stockState } from "@/lib/orders";
import { bn, taka, pct } from "@/lib/bn";
import { cn } from "@/lib/utils";

function Products() {
  const allowance = useAllowance();
  const cart = useCitizen((s) => s.cart);
  const setQty = useCitizen((s) => s.setQty);
  const lowPct = useData((s) => s.settings.lowStockPct);
  const lines = allowance.filter((a) => cart[a.product.id]);
  const total = lines.reduce((s, a) => s + cart[a.product.id] * a.product.municipalPrice, 0);
  const saving = lines.reduce((s, a) => s + cart[a.product.id] * (a.product.marketPrice - a.product.municipalPrice), 0);

  return (
    <>
      <CitizenTitle title="পণ্য" subtitle="পরিবারের মাসিক সীমার মধ্যে বেছে নিন" />
      <ul className="flex flex-col gap-3 px-5 pb-28">
        {allowance.map(({ product: p, left }) => {
          const st = stockState(p, lowPct);
          const q = cart[p.id] ?? 0;
          const max = Math.min(left, p.stock);
          const disabled = max === 0;
          return (
            <li key={p.id} className={cn("glass rounded-[22px] p-4 transition-opacity", disabled && q === 0 && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[17px] font-bold text-ink">{p.name}</div>
                  <div className="text-[12.5px] text-ink-3">{CATEGORY_LABEL[p.category]} · প্রতি {UNIT_LABEL[p.unit]}</div>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold", st === "OUT" ? "bg-brick-soft text-brick" : st === "LOW" ? "bg-ochre-soft text-ochre" : "bg-sage-soft text-sage")}>
                  {st === "OUT" ? "এখন নেই" : st === "LOW" ? "অল্প আছে" : "পাওয়া যাচ্ছে"}
                </span>
              </div>
              {/* price with the saving pill on the same line */}
              <div className="mt-3 flex flex-wrap items-center gap-2 whitespace-nowrap">
                <span className="num text-[22px] font-bold text-ink">{taka(p.municipalPrice)}</span>
                <span className="num text-[14px] text-ink-3 line-through">{taka(p.marketPrice)}</span>
                <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-[12.5px] font-bold text-sage">সাশ্রয় {pct(savingPct(p))}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                <span className="text-[13px] text-ink-3">{left === 0 ? "এ মাসের সীমা শেষ" : `এ মাসে আর ${bn(left)} ${UNIT_LABEL[p.unit]} নিতে পারবেন`}</span>
                <div className="flex items-center gap-2.5">
                  <button type="button" onClick={() => setQty(p.id, q - 1)} disabled={q === 0} aria-label={`${p.name} কমান`} className="grid h-11 w-11 place-items-center rounded-[12px] border border-line-strong bg-surface-solid text-ink transition-opacity disabled:opacity-30">
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="num min-w-7 text-center text-[19px] font-bold text-ink" aria-live="polite">{bn(q)}</span>
                  <button type="button" onClick={() => setQty(p.id, q + 1)} disabled={q >= max} aria-label={`${p.name} বাড়ান`} className="grad-copper grid h-11 w-11 place-items-center rounded-[12px] text-white transition-opacity disabled:opacity-30">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {lines.length > 0 && (
        <div className="fixed bottom-[92px] left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 px-4 sm:absolute">
          <Link href="/citizen/cart" className="grad-copper flex items-center justify-between gap-3 rounded-[18px] px-5 py-3.5 text-white shadow-[0_16px_32px_-12px_var(--glow)] animate-[page-in_260ms_var(--ease-out)]">
            <span className="flex items-center gap-2.5">
              <ShoppingCart className="h-5 w-5" strokeWidth={1.8} />
              <span>
                <span className="block text-[15px] font-bold">{bn(lines.length)}টি পণ্য · {taka(total)}</span>
                <span className="block text-[12px] opacity-90">সাশ্রয় {taka(saving)}</span>
              </span>
            </span>
            <span className="text-[15px] font-bold">দেখুন →</span>
          </Link>
        </div>
      )}
    </>
  );
}

export default function CitizenProductsPage() {
  return (
    <CitizenFrame>
      <Products />
    </CitizenFrame>
  );
}
