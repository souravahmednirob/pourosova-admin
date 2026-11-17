"use client";
import Link from "next/link";
import { ChevronRight, PiggyBank } from "lucide-react";
import { CitizenFrame, CitizenTitle } from "@/components/citizen-app/frame";
import { useMe } from "@/components/citizen-app/hooks";
import { Pill } from "@/components/ui/primitives";
import { useData } from "@/store/data";
import { ORDER_STATUS_LABEL } from "@/lib/types";
import { orderTotals, orderTone } from "@/lib/orders";
import { bn, taka, fmtDateTime } from "@/lib/bn";

function Orders() {
  const { orders } = useMe();
  const products = useData((s) => s.products);
  const done = orders.filter((o) => o.status === "COLLECTED");
  const saved = done.reduce((s, o) => s + orderTotals(o).saving, 0);
  const spent = done.reduce((s, o) => s + orderTotals(o).total, 0);

  return (
    <>
      <CitizenTitle title="আমার অর্ডার" subtitle="সব আবেদন ও সংগ্রহের হিসাব" />
      <div className="flex flex-col gap-4 px-5 pb-6">
        <div className="hairline flex items-center gap-4 rounded-[22px] bg-sage-soft p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sage text-white dark:text-[#0a1114]"><PiggyBank className="h-6 w-6" strokeWidth={1.8} /></span>
          <div>
            <div className="text-[13px] text-ink-2">এ পর্যন্ত মোট সাশ্রয়</div>
            <div className="num text-[24px] font-bold text-sage">{taka(saved)}</div>
            <div className="text-[12.5px] text-ink-3">{bn(done.length)}টি সংগ্রহে খরচ {taka(spent)}</div>
          </div>
        </div>

        {orders.length === 0 && <div className="py-12 text-center text-[15px] text-ink-3">এখনও কোনো অর্ডার নেই</div>}
        <ul className="flex flex-col gap-3">
          {orders.map((o) => {
            const t = orderTotals(o);
            return (
              <li key={o.id}>
                <Link href={`/citizen/orders/${o.id}`} className="glass block rounded-[20px] p-4 transition-transform active:scale-[0.99]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="num text-[15px] font-bold text-ink">{bn(o.orderNo)}</div>
                      <div className="text-[12.5px] text-ink-3">{fmtDateTime(o.appliedAt)}</div>
                    </div>
                    <Pill tone={orderTone[o.status]} dot>{ORDER_STATUS_LABEL[o.status]}</Pill>
                  </div>
                  <div className="mt-2 line-clamp-1 text-[13.5px] text-ink-2">{o.items.map((i) => `${products.find((p) => p.id === i.productId)?.name ?? ""} ${bn(i.quantity)}`).join(" · ")}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[14px]">
                      <span className="num font-bold text-ink">{taka(t.total)}</span>
                      <span className="num rounded-full bg-sage-soft px-2 py-0.5 text-[12px] font-bold text-sage">সাশ্রয় {taka(t.saving)}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-ink-4" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export default function CitizenOrdersPage() {
  return (
    <CitizenFrame>
      <Orders />
    </CitizenFrame>
  );
}
