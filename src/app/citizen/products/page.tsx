"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Minus, Plus, Search } from "lucide-react";
import { CitizenFrame } from "@/components/citizen-app/frame";
import { useAllowance } from "@/components/citizen-app/hooks";
import { ProductArt } from "@/components/citizen-app/product-art";
import { Stagger } from "@/components/citizen-app/ui";
import { ProductSheet, haptic } from "@/components/citizen-app/product-sheet";
import { flyToCart } from "@/components/citizen-app/cart-bubble";
import { useCitizen } from "@/store/citizen";
import { useData } from "@/store/data";
import { CATEGORY_LABEL, UNIT_LABEL, type ProductCategory } from "@/lib/types";
import { savingPct, stockState } from "@/lib/orders";
import { bn, taka } from "@/lib/bn";
import { cn } from "@/lib/utils";

/** "+" button that grows into a − n + capsule once something is added. */
function AddStepper({ qty, max, onChange, name }: { qty: number; max: number; onChange: (n: number) => void; name: string }) {
  const open = qty > 0;
  return (
    <div className={cn("flex h-10 items-center overflow-hidden rounded-full transition-[width,background-color] duration-500 ease-[var(--ease-spring)]", open ? "w-[104px] bg-[#121a1c] dark:bg-[#ece7de]" : "w-10 bg-transparent")}>
      {open && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); haptic(); onChange(qty - 1); }} aria-label={`${name} কমান`} className="grid h-10 w-10 shrink-0 place-items-center text-white dark:text-[#121a1c]"><Minus className="h-4 w-4" strokeWidth={2.4} /></button>
          <span className="num flex-1 text-center text-[15px] font-bold text-white dark:text-[#121a1c]" aria-live="polite">{bn(qty)}</span>
        </>
      )}
      <button type="button" onClick={(e) => { e.stopPropagation(); haptic(); flyToCart(e.currentTarget); onChange(qty + 1); }} disabled={qty >= max} aria-label={`${name} যোগ করুন`} className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full transition-all disabled:opacity-30", open ? "text-white dark:text-[#121a1c]" : "grad-copper text-white shadow-[0_8px_18px_-8px_var(--glow)]")}>
        <Plus className="h-[18px] w-[18px]" strokeWidth={2.4} />
      </button>
    </div>
  );
}

function Products() {
  const allowance = useAllowance();
  const cart = useCitizen((s) => s.cart);
  const setQty = useCitizen((s) => s.setQty);
  const lowPct = useData((s) => s.settings.lowStockPct);
  const [cat, setCat] = useState<ProductCategory | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const params = useSearchParams();
  const router = useRouter();

  // /citizen/products?p=<id> opens that product's sheet (used from the home screen)
  useEffect(() => {
    const id = params.get("p");
    if (id) {
      queueMicrotask(() => setOpenId(id));
      router.replace("/citizen/products");
    }
  }, [params, router]);
  const open = allowance.find((a) => a.product.id === openId);

  const cats = useMemo(() => ["ALL", ...new Set(allowance.map((a) => a.product.category))] as (ProductCategory | "ALL")[], [allowance]);
  const list = allowance.filter((a) => (cat === "ALL" || a.product.category === cat) && (!q || a.product.name.includes(q)));

  return (
    <div className="flex flex-col pb-4">
      <div className="px-5 pt-6">
        <Stagger i={0}>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink">পণ্য বেছে নিন</h1>
          <p className="mt-1 text-[14px] text-ink-3">বাজারের চেয়ে কম দামে, পরিবারের মাসিক সীমার মধ্যে</p>
        </Stagger>
        <Stagger i={1} className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-4" strokeWidth={1.8} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="পণ্য খুঁজুন" className="h-12 w-full rounded-full border border-line bg-surface-solid pl-11 pr-4 text-[15px] text-ink outline-none transition-shadow placeholder:text-ink-4 focus:border-copper focus:shadow-[0_0_0_4px_var(--copper-soft)]" />
        </Stagger>
      </div>

      <Stagger i={2} className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {cats.map((c) => (
          <button key={c} type="button" onClick={() => setCat(c)} className={cn("h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold transition-all duration-300", cat === c ? "bg-[#121a1c] text-white dark:bg-[#ece7de] dark:text-[#121a1c]" : "border border-line bg-surface-solid text-ink-2 hover:bg-sunken")}>
            {c === "ALL" ? "সব" : CATEGORY_LABEL[c]}
          </button>
        ))}
      </Stagger>

      <div className="mt-4 grid grid-cols-2 gap-3 px-5">
        {list.map(({ product: p, left }, i) => {
          const st = stockState(p, lowPct);
          const qty = cart[p.id] ?? 0;
          const max = Math.min(left, p.stock);
          const blocked = max === 0 && qty === 0;
          return (
            <Stagger key={p.id} i={i + 3}>
              <article onClick={() => setOpenId(p.id)} onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) setOpenId(p.id); }} tabIndex={0} aria-label={`${p.name}, বিস্তারিত`} className={cn("group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] border border-line bg-surface-solid transition-[transform,box-shadow] duration-300 active:scale-[0.98]", qty > 0 && "ring-2 ring-copper/60", !blocked && "hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]")}>
                <div className="relative">
                  <ProductArt product={p} size={76} className={cn("h-[118px] transition-transform duration-500", blocked && "grayscale")} />
                  {qty > 0 && <span key={qty} className="num absolute left-2.5 top-2.5 grid h-7 min-w-7 place-items-center rounded-full bg-copper px-2 text-[13px] font-bold text-white shadow-[0_6px_14px_-6px_var(--glow)] animate-[modal-pop_320ms_var(--ease-spring)]">{bn(qty)}</span>}
                  {st !== "OK" && <span className={cn("absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[11px] font-bold backdrop-blur", st === "OUT" ? "bg-brick text-white" : "bg-ochre-soft text-ochre")}>{st === "OUT" ? "এখন নেই" : "অল্প আছে"}</span>}
                </div>
                <div className="flex flex-1 flex-col p-3.5">
                  <div className="text-[15.5px] font-bold leading-tight text-ink">{p.name}</div>
                  <div className="text-[12px] text-ink-3">প্রতি {UNIT_LABEL[p.unit]} · বাজারে <s className="num">{taka(p.marketPrice)}</s></div>
                  {/* price with the saving pill on the same line */}
                  <div className="mt-2.5 flex items-center gap-1.5 whitespace-nowrap">
                    <span className="num text-[21px] font-bold leading-none tracking-tight text-ink">{taka(p.municipalPrice)}</span>
                    <span className="num rounded-full bg-sage-soft px-1.5 py-0.5 text-[11px] font-bold text-sage">সাশ্রয় {bn(savingPct(p))}%</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <div className={cn("min-w-0 whitespace-nowrap text-[11.5px] leading-tight", left === 0 ? "text-brick" : "text-ink-3")}>{left === 0 ? "সীমা শেষ" : <>আর <b className="num text-ink-2">{bn(left)}</b>{qty > 0 ? "" : ` ${UNIT_LABEL[p.unit]}`}</>}</div>
                    {!blocked && <AddStepper qty={qty} max={max} onChange={(n) => setQty(p.id, n)} name={p.name} />}
                  </div>
                </div>
              </article>
            </Stagger>
          );
        })}
      </div>
      {list.length === 0 && <div className="py-16 text-center text-[14px] text-ink-3">কিছু পাওয়া যায়নি</div>}

      <ProductSheet product={open?.product ?? null} left={open?.left ?? 0} inCart={open ? cart[open.product.id] ?? 0 : 0} onClose={() => setOpenId(null)} onSave={(n) => { if (open) { if (n > (cart[open.product.id] ?? 0)) flyToCart(document.activeElement); setQty(open.product.id, n); } setOpenId(null); }} />

    </div>
  );
}

export default function CitizenProductsPage() {
  return (
    <CitizenFrame>
      <Suspense>
        <Products />
      </Suspense>
    </CitizenFrame>
  );
}
