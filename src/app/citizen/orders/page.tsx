"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CitizenFrame } from "@/components/citizen-app/frame";
import { useMe } from "@/components/citizen-app/hooks";
import { ProductArt } from "@/components/citizen-app/product-art";
import { Stagger } from "@/components/citizen-app/ui";
import { CartButton } from "@/components/citizen-app/cart-bubble";
import { Pill } from "@/components/ui/primitives";
import { useData } from "@/store/data";
import { ORDER_STATUS_LABEL } from "@/lib/types";
import { orderTotals, orderTone } from "@/lib/orders";
import { bn, taka, fmtDateTime } from "@/lib/bn";
import { cn } from "@/lib/utils";

function Orders() {
  const { orders } = useMe();
  const products = useData((s) => s.products);
  const running = orders.filter((o) => o.status === "PENDING" || o.status === "AWAITING_PICKUP");
  const past = orders.filter((o) => o.status === "COLLECTED" || o.status === "CANCELLED");
  const [tab, setTab] = useState<"run" | "past">(running.length ? "run" : "past");
  const done = orders.filter((o) => o.status === "COLLECTED");
  const saved = done.reduce((s, o) => s + orderTotals(o).saving, 0);
  const spent = done.reduce((s, o) => s + orderTotals(o).total, 0);
  const list = tab === "run" ? running : past;

  return (
    <div className="flex flex-col gap-5 px-5 pb-4 pt-6">
      <Stagger i={0} className="flex items-center justify-between">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink">অর্ডার</h1>
        <CartButton />
      </Stagger>

      <Stagger i={1} className="grid grid-cols-2 gap-3">
        <div className="rounded-[22px] bg-sage-soft p-4">
          <div className="text-[12.5px] text-ink-2">মোট সাশ্রয়</div>
          <div className="num mt-1 text-[24px] font-bold leading-tight tracking-tight text-sage">{taka(saved)}</div>
        </div>
        <div className="rounded-[22px] border border-line bg-surface-solid p-4">
          <div className="text-[12.5px] text-ink-3">{bn(done.length)} বার সংগ্রহে খরচ</div>
          <div className="num mt-1 text-[24px] font-bold leading-tight tracking-tight text-ink">{taka(spent)}</div>
        </div>
      </Stagger>

      {/* segmented control */}
      <Stagger i={2} className="relative grid grid-cols-2 rounded-full bg-sunken p-1">
        <span aria-hidden className="absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-full bg-surface-solid shadow-sm transition-transform duration-500 ease-[var(--ease-spring)]" style={{ left: 4, transform: tab === "past" ? "translateX(100%)" : "none" }} />
        {([["run", "চলমান", running.length], ["past", "আগের", past.length]] as const).map(([k, l, n]) => (
          <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k} className={cn("relative z-10 flex h-11 items-center justify-center gap-2 rounded-full text-[14.5px] font-semibold transition-colors", tab === k ? "text-ink" : "text-ink-3")}>
            {l} <span className={cn("num rounded-full px-1.5 text-[11.5px]", tab === k ? "bg-copper text-white" : "bg-[var(--line)]")}>{bn(n)}</span>
          </button>
        ))}
      </Stagger>

      <ul key={tab} className="flex flex-col gap-3">
        {list.length === 0 && (
          <li className="py-14 text-center">
            <div className="text-[15px] font-semibold text-ink-2">{tab === "run" ? "এখন কোনো চলমান অর্ডার নেই" : "এখনও কোনো অর্ডার শেষ হয়নি"}</div>
            {tab === "run" && <Link href="/citizen/products" className="mt-2 inline-block text-[14px] font-semibold text-copper-deep dark:text-copper">পণ্য বেছে নিন →</Link>}
          </li>
        )}
        {list.map((o, i) => {
          const t = orderTotals(o);
          const items = o.items.map((it) => products.find((p) => p.id === it.productId)).filter(Boolean);
          return (
            <Stagger key={o.id} i={i + 3}>
              <li>
                <Link href={`/citizen/orders/${o.id}`} className="group flex items-center gap-3.5 rounded-[24px] border border-line bg-surface-solid p-3.5 transition-[transform,box-shadow] duration-300 hover:shadow-[var(--shadow-md)] active:scale-[0.99]">
                  {/* stacked product thumbnails */}
                  <div className="relative h-14 w-14 shrink-0">
                    {items.slice(0, 3).map((p, k) => (
                      <div key={p!.id} className="absolute" style={{ left: k * 6, top: k * 6, zIndex: 3 - k }}>
                        <ProductArt product={p!} size={30} className="h-11 w-11 rounded-[14px] ring-2 ring-[var(--surface-solid)]" />
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="num truncate text-[15px] font-bold text-ink">{bn(o.orderNo)}</span>
                      <Pill tone={orderTone[o.status]} dot className="h-6 px-2 text-[11.5px]">{ORDER_STATUS_LABEL[o.status]}</Pill>
                    </div>
                    <div className="truncate text-[12.5px] text-ink-3">{items.map((p) => p!.name).join(", ")}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="num text-[15px] font-bold text-ink">{taka(t.total)}</span>
                        <span className="num rounded-full bg-sage-soft px-1.5 py-0.5 text-[11px] font-bold text-sage">সাশ্রয় {taka(t.saving)}</span>
                      </span>
                      <span className="text-[11.5px] text-ink-4">{fmtDateTime(o.appliedAt).split(",")[0]}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            </Stagger>
          );
        })}
      </ul>
    </div>
  );
}

export default function CitizenOrdersPage() {
  return (
    <CitizenFrame>
      <Orders />
    </CitizenFrame>
  );
}
