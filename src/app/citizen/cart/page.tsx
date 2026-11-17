"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, Clock, MapPin, Minus, Plus, Wallet } from "lucide-react";
import { CitizenFrame } from "@/components/citizen-app/frame";
import { useMe, useAllowance } from "@/components/citizen-app/hooks";
import { ProductArt } from "@/components/citizen-app/product-art";
import { Stagger } from "@/components/citizen-app/ui";
import { useCitizen } from "@/store/citizen";
import { useData, RuleError } from "@/store/data";
import { UNIT_LABEL } from "@/lib/types";
import { bn, taka } from "@/lib/bn";
import { cn } from "@/lib/utils";

function Cart() {
  const router = useRouter();
  const { citizen } = useMe();
  const allowance = useAllowance();
  const cart = useCitizen((s) => s.cart);
  const setQty = useCitizen((s) => s.setQty);
  const clearCart = useCitizen((s) => s.clearCart);
  const points = useData((s) => s.points);
  const createOrder = useData((s) => s.createOrder);
  const deadlineDays = useData((s) => s.settings.pickupDeadlineDays);
  const [pointId, setPointId] = useState(() => points.find((p) => p.wardId === citizen.wardId)?.id ?? points[0]?.id);
  const [busy, setBusy] = useState(false);

  const lines = useMemo(() => allowance.filter((a) => cart[a.product.id]).map((a) => ({ ...a, qty: Math.min(cart[a.product.id], a.left, a.product.stock), max: Math.min(a.left, a.product.stock) })).filter((l) => l.qty > 0), [allowance, cart]);

  // drop anything that is no longer available this month (limit used up or out of stock)
  useEffect(() => {
    const dead = allowance.filter((a) => cart[a.product.id] && Math.min(a.left, a.product.stock) === 0);
    if (dead.length) {
      dead.forEach((a) => setQty(a.product.id, 0));
      toast(`${dead.map((a) => a.product.name).join(", ")} এ মাসে আর নেওয়া যাবে না, তাই বাদ দেওয়া হয়েছে`);
    }
  }, [allowance, cart, setQty]);
  const total = lines.reduce((s, l) => s + l.qty * l.product.municipalPrice, 0);
  const market = lines.reduce((s, l) => s + l.qty * l.product.marketPrice, 0);

  const apply = async () => {
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const o = createOrder(citizen.id, lines.filter((l) => l.qty > 0).map((l) => ({ productId: l.product.id, quantity: l.qty })), pointId);
      clearCart();
      router.replace(`/citizen/orders/${o.id}?new=1`);
    } catch (e) {
      toast.error(e instanceof RuleError ? e.message : "আবেদন পাঠানো যায়নি, আবার চেষ্টা করুন");
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 px-5 pb-1 pt-6">
        <Link href="/citizen/products" aria-label="পণ্যে ফিরে যান" className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface-solid text-ink transition-colors hover:bg-sunken"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-[22px] font-bold leading-tight tracking-tight text-ink">আবেদন দেখে নিন</h1>
          <p className="text-[13px] text-ink-3">পাঠানোর আগে একবার মিলিয়ে নিন</p>
        </div>
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <ProductArt product={{ name: "", category: "GROCERY" }} size={72} className="h-28 w-28 rounded-full" />
          <div className="text-[17px] font-bold text-ink">ঝুড়ি খালি</div>
          <Link href="/citizen/products" className="rounded-full bg-[#121a1c] px-6 py-3 text-[15px] font-bold text-white dark:bg-[#ece7de] dark:text-[#121a1c]">পণ্য বেছে নিন</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5 px-5 pb-6 pt-4">
          <ul className="flex flex-col gap-2.5">
            {lines.map((l, i) => (
              <Stagger key={l.product.id} i={i}>
                <li className="flex items-center gap-3 rounded-[22px] border border-line bg-surface-solid p-2.5 pr-3">
                  <ProductArt product={l.product} size={44} className="h-16 w-16 shrink-0 rounded-[16px]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold text-ink">{l.product.name}</div>
                    <div className="num text-[12.5px] text-ink-3">{taka(l.product.municipalPrice)} / {UNIT_LABEL[l.product.unit]}</div>
                    <div className="num mt-0.5 text-[15px] font-bold text-ink">{taka(l.qty * l.product.municipalPrice)}</div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-sunken p-1">
                    <button type="button" onClick={() => setQty(l.product.id, l.qty - 1)} aria-label={`${l.product.name} কমান`} className="grid h-9 w-9 place-items-center rounded-full bg-surface-solid text-ink shadow-sm"><Minus className="h-4 w-4" strokeWidth={2.4} /></button>
                    <span className="num w-7 text-center text-[15px] font-bold text-ink">{bn(l.qty)}</span>
                    <button type="button" onClick={() => setQty(l.product.id, l.qty + 1)} disabled={l.qty >= l.max} aria-label={`${l.product.name} বাড়ান`} className="grid h-9 w-9 place-items-center rounded-full bg-surface-solid text-ink shadow-sm disabled:opacity-30"><Plus className="h-4 w-4" strokeWidth={2.4} /></button>
                  </div>
                </li>
              </Stagger>
            ))}
          </ul>

          {/* receipt */}
          <Stagger i={lines.length} className="relative overflow-hidden rounded-[24px] bg-[#121a1c] p-5 text-white dark:bg-[#ece7de] dark:text-[#121a1c]">
            <div aria-hidden className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(201,126,82,.5),transparent_70%)]" />
            <div className="relative flex items-center justify-between text-[14px] opacity-70"><span>বাজারে কিনলে</span><s className="num">{taka(market)}</s></div>
            <div className="relative mt-3 flex items-end justify-between">
              <div>
                <div className="text-[13px] opacity-70">আপনি দেবেন</div>
                <div className="num text-[34px] font-bold leading-none tracking-tight">{taka(total)}</div>
              </div>
              <div className="rounded-2xl bg-[#8cc39a]/20 px-3 py-2 text-right dark:bg-[#3f7050]/15">
                <div className="text-[11.5px] text-[#8cc39a] dark:text-[#3f7050]">সাশ্রয়</div>
                <div className="num text-[17px] font-bold text-[#8cc39a] dark:text-[#3f7050]">{taka(market - total)}</div>
              </div>
            </div>
            <div className="relative mt-4 flex items-center gap-2 border-t border-white/10 pt-3 text-[12.5px] opacity-70 dark:border-black/10"><Wallet className="h-4 w-4" strokeWidth={1.8} /> টাকা দেবেন পণ্য নেওয়ার সময়, নগদে</div>
          </Stagger>

          <Stagger i={lines.length + 1}>
            <h2 className="mb-2.5 text-[16px] font-bold text-ink">কোথা থেকে নেবেন</h2>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="বিতরণ কেন্দ্র">
              {points.map((p) => {
                const on = pointId === p.id;
                return (
                  <button key={p.id} type="button" role="radio" aria-checked={on} onClick={() => setPointId(p.id)} className={cn("flex items-center gap-3 rounded-[20px] border-2 p-3.5 text-left transition-all duration-300", on ? "border-copper bg-copper-soft/50" : "border-transparent bg-surface-solid")}>
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors", on ? "grad-copper text-white" : "bg-sunken text-ink-3")}><MapPin className="h-[18px] w-[18px]" strokeWidth={1.8} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-bold text-ink">{p.name}</span>
                      <span className="flex items-center gap-1 text-[12px] text-ink-3"><Clock className="h-3 w-3" /> {p.openHours}</span>
                    </span>
                    <span className={cn("grid h-6 w-6 place-items-center rounded-full border-2 transition-colors", on ? "border-copper bg-copper text-white" : "border-line-strong")}>{on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</span>
                  </button>
                );
              })}
            </div>
          </Stagger>

          <p className="text-center text-[12.5px] leading-relaxed text-ink-3">পৌরসভা অনুমোদন দিলে জানানো হবে। তারপর {bn(deadlineDays)} দিনের মধ্যে পণ্য নিতে হবে।</p>
          <button type="button" onClick={apply} disabled={busy} className="grad-copper flex h-[60px] items-center justify-between rounded-full pl-6 pr-2 text-white shadow-[0_18px_36px_-14px_var(--glow)] transition-transform active:scale-[0.985] disabled:opacity-80">
            <span className="text-[16.5px] font-bold">{busy ? "পাঠানো হচ্ছে…" : "আবেদন পাঠান"}</span>
            <span className="num flex h-11 items-center rounded-full bg-white/20 px-4 text-[15px] font-bold">
              {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : taka(total)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function CitizenCartPage() {
  return (
    <CitizenFrame tabs={false}>
      <Cart />
    </CitizenFrame>
  );
}
