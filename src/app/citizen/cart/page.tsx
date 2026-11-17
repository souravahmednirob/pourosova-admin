"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, MapPin, Trash2 } from "lucide-react";
import { CitizenFrame } from "@/components/citizen-app/frame";
import { useMe, useAllowance } from "@/components/citizen-app/hooks";
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
  // default: the distribution point in the citizen's ward, otherwise the first one
  const [pointId, setPointId] = useState(() => points.find((p) => p.wardId === citizen.wardId)?.id ?? points[0]?.id);
  const [busy, setBusy] = useState(false);

  const lines = useMemo(() => allowance.filter((a) => cart[a.product.id]).map((a) => ({ ...a, qty: Math.min(cart[a.product.id], a.left, a.product.stock) })), [allowance, cart]);
  const total = lines.reduce((s, l) => s + l.qty * l.product.municipalPrice, 0);
  const market = lines.reduce((s, l) => s + l.qty * l.product.marketPrice, 0);

  const apply = async () => {
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      const o = createOrder(citizen.id, lines.filter((l) => l.qty > 0).map((l) => ({ productId: l.product.id, quantity: l.qty })), pointId);
      clearCart();
      router.replace(`/citizen/orders/${o.id}?new=1`);
    } catch (e) {
      toast.error(e instanceof RuleError ? e.message : "আবেদন পাঠানো যায়নি, আবার চেষ্টা করুন");
      setBusy(false);
    }
  };

  return (
    <div className="page-enter flex flex-1 flex-col">
      <div className="flex items-center gap-3 px-5 pb-2 pt-5">
        <Link href="/citizen/products" aria-label="পণ্যে ফিরে যান" className="grid h-11 w-11 place-items-center rounded-[14px] border border-line-strong text-ink"><ChevronLeft className="h-5 w-5" /></Link>
        <h1 className="text-[22px] font-bold text-ink">আবেদনের তালিকা</h1>
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <div className="text-[16px] font-semibold text-ink-2">এখনও কিছু বাছা হয়নি</div>
          <Link href="/citizen/products" className="text-[15px] font-semibold text-copper-deep dark:text-copper">পণ্য দেখুন →</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-5 py-3">
          <ul className="glass divide-y divide-line rounded-[22px] px-4">
            {lines.map((l) => (
              <li key={l.product.id} className="flex items-center justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <div className="text-[15.5px] font-semibold text-ink">{l.product.name}</div>
                  <div className="num text-[13px] text-ink-3">{bn(l.qty)} {UNIT_LABEL[l.product.unit]} × {taka(l.product.municipalPrice)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="num text-[16px] font-bold text-ink">{taka(l.qty * l.product.municipalPrice)}</span>
                  <button type="button" onClick={() => setQty(l.product.id, 0)} aria-label={`${l.product.name} বাদ দিন`} className="grid h-10 w-10 place-items-center rounded-xl text-ink-3 hover:bg-brick-soft hover:text-brick"><Trash2 className="h-4.5 w-4.5" strokeWidth={1.8} /></button>
                </div>
              </li>
            ))}
          </ul>

          <div className="glass flex flex-col gap-2 rounded-[22px] p-4 text-[14.5px]">
            <div className="flex justify-between text-ink-3"><span>বাজারে কিনলে</span><span className="num line-through">{taka(market)}</span></div>
            <div className="flex justify-between text-ink"><span className="font-semibold">আপনি দেবেন</span><span className="num text-[22px] font-bold">{taka(total)}</span></div>
            <div className="flex items-center justify-between"><span className="text-ink-2">আপনার সাশ্রয়</span><span className="num rounded-full bg-sage-soft px-3 py-1 text-[14px] font-bold text-sage">{taka(market - total)}</span></div>
            <div className="mt-1 text-[12.5px] text-ink-3">টাকা দেবেন পণ্য নেওয়ার সময়, বিতরণ কেন্দ্রে।</div>
          </div>

          <section>
            <h2 className="mb-2 text-[15px] font-semibold text-ink">কোথা থেকে নেবেন</h2>
            <div className="flex flex-col gap-2" role="radiogroup">
              {points.map((p) => (
                <button key={p.id} type="button" role="radio" aria-checked={pointId === p.id} onClick={() => setPointId(p.id)} className={cn("flex items-start gap-3 rounded-[18px] border p-3.5 text-left transition-colors", pointId === p.id ? "border-copper bg-copper-soft/60" : "border-line-strong bg-surface-solid")}>
                  <MapPin className={cn("mt-0.5 h-5 w-5 shrink-0", pointId === p.id ? "text-copper" : "text-ink-3")} strokeWidth={1.8} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-semibold text-ink">{p.name}</span>
                    <span className="block text-[12.5px] text-ink-3">{p.address} · {p.openHours}</span>
                  </span>
                  {pointId === p.id && <Check className="h-5 w-5 text-copper" strokeWidth={2.4} />}
                </button>
              ))}
            </div>
          </section>

          <p className="text-[13px] leading-relaxed text-ink-3">পৌরসভা আবেদন দেখে অনুমোদন দিলে জানানো হবে। তারপর {bn(deadlineDays)} দিনের মধ্যে পণ্য নিতে হবে।</p>
          <button type="button" onClick={apply} disabled={busy} className="grad-copper flex h-[56px] items-center justify-center gap-2 rounded-[16px] text-[16px] font-bold text-white shadow-[0_12px_28px_-10px_var(--glow)] disabled:opacity-70">
            {busy && <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            আবেদন পাঠান
          </button>
        </div>
      )}
    </div>
  );
}

export default function CitizenCartPage() {
  return (
    <CitizenFrame>
      <Cart />
    </CitizenFrame>
  );
}
