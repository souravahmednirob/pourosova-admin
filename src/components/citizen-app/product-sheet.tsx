"use client";
import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Minus, Plus, ShoppingBag, Trash2, X, Info } from "lucide-react";
import { ProductArt } from "./product-art";
import { CATEGORY_LABEL, UNIT_LABEL, type Product } from "@/lib/types";
import { savingPct } from "@/lib/orders";
import { bn, taka } from "@/lib/bn";
import { cn } from "@/lib/utils";

export function haptic(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch {}
}

/**
 * Big, calm product sheet: art, the two prices, how much is left this month,
 * a large quantity control with quick picks, and a live subtotal on the button.
 */
export function ProductSheet({ product, left, inCart, onSave, onClose }: { product: Product | null; left: number; inCart: number; onSave: (qty: number) => void; onClose: () => void }) {
  const max = product ? Math.min(left, product.stock) : 0;
  const [qty, setQty] = useState(0);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    if (product) queueMicrotask(() => setQty(inCart || (max > 0 ? 1 : 0)));
  }, [product, inCart, max]);

  const change = (n: number) => {
    const v = Math.max(0, Math.min(max, n));
    if (v !== qty) {
      haptic();
      setBump((b) => b + 1);
    }
    setQty(v);
  };

  if (!product) return <DialogPrimitive.Root open={false} />;
  const unit = UNIT_LABEL[product.unit];
  const sub = qty * product.municipalPrice;
  const save = qty * (product.marketPrice - product.municipalPrice);
  const quick = [1, 2, 5, 10].filter((n) => n < max);

  return (
    <DialogPrimitive.Root open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[rgba(10,17,20,0.45)] backdrop-blur-[3px] data-[state=open]:animate-[fade-in_220ms_var(--ease-out)]" />
        <DialogPrimitive.Content className="fixed bottom-0 left-1/2 z-[71] w-full max-w-[430px] -translate-x-1/2 overflow-hidden rounded-t-[32px] bg-[var(--surface-solid)] pb-[max(18px,env(safe-area-inset-bottom))] shadow-[0_-24px_60px_-20px_rgba(0,0,0,.35)] outline-none data-[state=open]:animate-[sheet-up_480ms_var(--ease-spring)]">
          {/* art header */}
          <div className="relative">
            <ProductArt product={product} size={128} className="h-[210px]" />
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--surface-solid)] to-transparent" />
            <div className="absolute left-1/2 top-3 h-1.5 w-12 -translate-x-1/2 rounded-full bg-black/20" />
            <DialogPrimitive.Close aria-label="বন্ধ" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/70 text-[#121a1c] backdrop-blur transition-colors hover:bg-white"><X className="h-5 w-5" /></DialogPrimitive.Close>
            <span className="absolute left-4 top-4 rounded-full bg-white/70 px-3 py-1 text-[12px] font-semibold text-[#121a1c] backdrop-blur">{CATEGORY_LABEL[product.category]}</span>
          </div>

          <div className="px-5">
            <DialogPrimitive.Title className="text-[24px] font-bold leading-tight tracking-tight text-ink">{product.name}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">পরিমাণ বেছে নিয়ে ঝুড়িতে রাখুন</DialogPrimitive.Description>
            <div className="mt-2 flex items-center gap-2 whitespace-nowrap">
              <span className="num text-[28px] font-bold leading-none tracking-tight text-ink">{taka(product.municipalPrice)}</span>
              <span className="text-[14px] text-ink-3">/ {unit}</span>
              <span className="num rounded-full bg-sage-soft px-2.5 py-1 text-[12.5px] font-bold text-sage">সাশ্রয় {bn(savingPct(product))}%</span>
            </div>
            <div className="mt-1 text-[13px] text-ink-3">বাজারে <s className="num">{taka(product.marketPrice)}</s> · প্রতি {unit}-এ <span className="num font-semibold text-sage">{taka(product.marketPrice - product.municipalPrice)}</span> কম</div>

            {/* allowance strip */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-sunken px-4 py-3">
              <Info className="h-[18px] w-[18px] shrink-0 text-ink-3" strokeWidth={1.8} />
              <div className="flex-1 text-[13px] text-ink-2">
                {max === 0 ? (product.stock === 0 ? "এখন মজুত নেই। পরে আবার দেখুন।" : "এ মাসের সীমা শেষ। আগামী মাসে আবার নিতে পারবেন।") : <>এ মাসে আর সর্বোচ্চ <b className="num text-ink">{bn(max)} {unit}</b> নিতে পারবেন</>}
              </div>
              <div className="flex gap-0.5" aria-hidden>
                {Array.from({ length: product.perFamilyLimit }).slice(0, 10).map((_, i) => (
                  <span key={i} className={cn("h-4 w-1.5 rounded-full transition-colors duration-300", i < product.perFamilyLimit - left ? "bg-ink-4/40" : i < product.perFamilyLimit - left + qty ? "bg-copper" : "bg-sage-2/50")} />
                ))}
              </div>
            </div>

            {/* quantity */}
            {max > 0 && (
              <>
                <div className="mt-5 flex items-center justify-between">
                  <button type="button" onClick={() => change(qty - 1)} disabled={qty === 0} aria-label="কমান" className="grid h-16 w-16 place-items-center rounded-full border-2 border-line-strong text-ink transition-[transform,opacity] active:scale-90 disabled:opacity-30"><Minus className="h-6 w-6" strokeWidth={2.4} /></button>
                  <div className="text-center">
                    <div key={bump} className="num text-[52px] font-bold leading-none tracking-tight text-ink animate-[modal-pop_320ms_var(--ease-spring)]">{bn(qty)}</div>
                    <div className="mt-1 text-[13px] text-ink-3">{unit}</div>
                  </div>
                  <button type="button" onClick={() => change(qty + 1)} disabled={qty >= max} aria-label="বাড়ান" className="grad-copper grid h-16 w-16 place-items-center rounded-full text-white shadow-[0_12px_24px_-10px_var(--glow)] transition-[transform,opacity] active:scale-90 disabled:opacity-30"><Plus className="h-6 w-6" strokeWidth={2.4} /></button>
                </div>
                <div className="mt-4 flex justify-center gap-2">
                  {quick.map((n) => (
                    <button key={n} type="button" onClick={() => change(n)} className={cn("num h-9 min-w-12 rounded-full border px-3 text-[14px] font-semibold transition-colors", qty === n ? "border-transparent bg-[#121a1c] text-white dark:bg-[#ece7de] dark:text-[#121a1c]" : "border-line-strong text-ink-2 hover:bg-sunken")}>{bn(n)}</button>
                  ))}
                  <button type="button" onClick={() => change(max)} className={cn("h-9 rounded-full border px-3.5 text-[14px] font-semibold transition-colors", qty === max ? "border-transparent bg-[#121a1c] text-white dark:bg-[#ece7de] dark:text-[#121a1c]" : "border-line-strong text-ink-2 hover:bg-sunken")}>সব <span className="num">({bn(max)})</span></button>
                </div>
              </>
            )}

            {/* actions */}
            <div className="mt-6 flex gap-2.5">
              {inCart > 0 && (
                <button type="button" onClick={() => { haptic(14); onSave(0); }} aria-label="ঝুড়ি থেকে সরান" className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-full border border-line-strong text-brick transition-colors hover:bg-brick-soft"><Trash2 className="h-5 w-5" strokeWidth={1.8} /></button>
              )}
              <button
                type="button"
                disabled={max === 0 || (qty === 0 && inCart === 0)}
                onClick={() => { haptic(14); onSave(qty); }}
                className="flex h-[60px] flex-1 items-center justify-between rounded-full bg-[#121a1c] pl-6 pr-2 text-white transition-[transform,opacity] active:scale-[0.985] disabled:opacity-40 dark:bg-[#ece7de] dark:text-[#121a1c]"
              >
                <span className="flex items-center gap-2 text-[16px] font-bold"><ShoppingBag className="h-5 w-5" strokeWidth={1.8} /> {qty === 0 ? "ঝুড়ি থেকে সরান" : inCart ? "আপডেট করুন" : "ঝুড়িতে রাখুন"}</span>
                {qty > 0 && (
                  <span className="grad-copper flex h-11 flex-col items-end justify-center rounded-full px-4 text-white">
                    <span className="num text-[15px] font-bold leading-none">{taka(sub)}</span>
                    <span className="num text-[10.5px] leading-tight opacity-90">সাশ্রয় {taka(save)}</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
