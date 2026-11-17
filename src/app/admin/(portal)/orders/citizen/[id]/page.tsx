"use client";
import { use, useMemo, useState } from "react";
import { ShoppingBag, PackageCheck, PiggyBank, CalendarClock, Phone, MapPin, Users, CreditCard, IdCard } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, Pill, Empty } from "@/components/ui/primitives";
import { OrderDrawer, OrderTimeline } from "@/components/orders/order-drawer";
import { useData } from "@/store/data";
import { ORDER_STATUS_LABEL, UNIT_LABEL, CITIZEN_STATUS_LABEL } from "@/lib/types";
import { bn, taka, fmtDate, fmtDateTime, fmtMonthYear, WARD_NAME } from "@/lib/bn";
import { orderTotals, orderTone } from "@/lib/orders";
import { statusTone } from "@/components/citizen/citizen-drawer";
import { cn } from "@/lib/utils";

export default function CitizenHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const citizen = useData((s) => s.citizens.find((c) => c.id === id));
  const orders = useData((s) => s.orders);
  const products = useData((s) => s.products);
  const wards = useData((s) => s.wards);
  const monthlyUsage = useData((s) => s.monthlyUsage);
  const [open, setOpen] = useState<string | null>(null);

  const mine = useMemo(() => orders.filter((o) => o.citizenId === id).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)), [orders, id]);
  const stats = useMemo(() => {
    const collected = mine.filter((o) => o.status === "COLLECTED");
    return { total: mine.length, collected: collected.length, saving: collected.reduce((s, o) => s + orderTotals(o).saving, 0), last: mine[0]?.appliedAt };
  }, [mine]);

  if (!citizen) {
    return (
      <>
        <PageHeader title="নাগরিকের ইতিহাস" back={{ href: "/admin/orders", label: "অর্ডার অনুরোধ" }} />
        <Card className="p-10"><Empty title="নাগরিক পাওয়া যায়নি" /></Card>
      </>
    );
  }
  const ward = wards.find((w) => w.id === citizen.wardId);

  return (
    <>
      <PageHeader title="পূর্ণ ইতিহাস ও ট্র্যাকিং" back={{ href: "/admin/orders", label: "অর্ডার অনুরোধ" }} />

      {/* hero */}
      <Card hairline className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[24px] font-bold text-ink">{citizen.nameBn}</h2>
              <Pill tone={statusTone[citizen.status]} dot>{citizen.status === "APPROVED" ? "সক্রিয়" : CITIZEN_STATUS_LABEL[citizen.status]}</Pill>
            </div>
            <div className="num text-[13.5px] text-ink-3">{citizen.nameEn}</div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[13.5px] sm:grid-cols-4">
            {[
              { Icon: CreditCard, l: "কার্ড নম্বর", v: citizen.rationCardNo ? bn(citizen.rationCardNo) : "—", mono: true },
              { Icon: Phone, l: "মোবাইল", v: bn(citizen.mobile), mono: true },
              { Icon: MapPin, l: "ওয়ার্ড", v: ward ? WARD_NAME(ward.number) : "—" },
              { Icon: Users, l: "পরিবার", v: `${bn(citizen.familySize)} জন` },
            ].map((x) => (
              <div key={x.l} className="flex items-start gap-2">
                <x.Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.8} />
                <div>
                  <div className="text-[11.5px] text-ink-3">{x.l}</div>
                  <div className={cn("font-semibold text-ink", x.mono && "num")}>{x.v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="মোট অর্ডার" value={stats.total} icon={ShoppingBag} tone="petrol" />
        <KpiCard label="সংগ্রহ সম্পন্ন" value={stats.collected} icon={PackageCheck} tone="sage" />
        <KpiCard label="মোট সাশ্রয়" value={stats.saving} prefix="৳" icon={PiggyBank} tone="copper" />
        <div className="glass hairline card relative overflow-hidden p-5 after:absolute after:bottom-0 after:left-6 after:right-6 after:h-[3px] after:rounded-t-full after:bg-ochre-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] font-medium text-ink-3">শেষ অর্ডার</div>
              <div className="mt-1.5 text-[22px] font-bold leading-tight text-ink">{stats.last ? fmtDate(stats.last) : "—"}</div>
              {mine[0] && <div className="mt-1 text-[12.5px] text-ink-3">{ORDER_STATUS_LABEL[mine[0].status]}</div>}
            </div>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-ochre-soft text-ochre"><CalendarClock className="h-5.5 w-5.5" strokeWidth={1.8} /></div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        {/* order history */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[17px] font-semibold text-ink">অর্ডার ইতিহাস</h3>
          {mine.length === 0 && <Card className="p-8"><Empty title="এখনও কোনো অর্ডার নেই" /></Card>}
          {mine.map((o) => {
            const t = orderTotals(o);
            return (
              <Card key={o.id} className="p-5 transition-shadow hover:shadow-lg">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <button type="button" onClick={() => setOpen(o.id)} className="num text-[16px] font-bold text-ink hover:text-copper-deep dark:hover:text-copper">{bn(o.orderNo)}</button>
                    <div className="text-[12.5px] text-ink-3">{fmtDateTime(o.appliedAt)}</div>
                  </div>
                  <Pill tone={orderTone[o.status]} dot>{ORDER_STATUS_LABEL[o.status]}</Pill>
                </div>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {o.items.map((it) => {
                    const p = products.find((x) => x.id === it.productId);
                    return (
                      <li key={it.productId} className="rounded-lg bg-sunken px-2.5 py-1 text-[12.5px] text-ink-2">
                        {p?.name} <span className="num font-semibold text-ink">× {bn(it.quantity)}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]">
                  <span className="text-ink-3">মোট <b className="num text-ink">{taka(t.total)}</b></span>
                  <span className="text-ink-3">বাজার মূল্য হলে <s className="num">{taka(t.market)}</s></span>
                  <Pill tone="sage">সাশ্রয় {taka(t.saving)}</Pill>
                </div>
                <div className="mt-4 border-t border-line pt-4">
                  <OrderTimeline o={o} compact />
                </div>
              </Card>
            );
          })}
        </div>

        {/* right column */}
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h3 className="text-[16px] font-semibold text-ink">এই মাসের কেনার হিসাব</h3>
            <div className="text-[12.5px] text-ink-3">{fmtMonthYear(new Date())} · পরিবারপ্রতি সীমার তুলনায়</div>
            <ul className="mt-4 flex flex-col gap-3">
              {products.filter((p) => p.active).map((p) => {
                const used = monthlyUsage(citizen.id, p.id);
                const r = Math.min(1, used / p.perFamilyLimit);
                return (
                  <li key={p.id}>
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="text-ink-2">{p.name}</span>
                      <span className={cn("num", used >= p.perFamilyLimit ? "font-semibold text-brick" : "text-ink-3")}>{bn(used)} / {bn(p.perFamilyLimit)} {UNIT_LABEL[p.unit]}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunken">
                      <div className={cn("h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out)]", r >= 1 ? "bg-brick-2" : "bg-petrol-2")} style={{ width: `${r * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card className="p-5">
            <h3 className="text-[16px] font-semibold text-ink">নাগরিকের তথ্য</h3>
            <dl className="mt-3 flex flex-col divide-y divide-line text-[13.5px]">
              {[
                { Icon: IdCard, l: "পরিচয়পত্র নম্বর", v: bn(citizen.nationalId), mono: true },
                { Icon: MapPin, l: "ঠিকানা", v: `${citizen.mohalla}, ${citizen.address}` },
                { Icon: Users, l: "নিবন্ধন", v: `${citizen.registeredByName} · ${fmtDate(citizen.registeredAt)}` },
                { Icon: CreditCard, l: "অনুমোদন", v: citizen.approvedAt ? fmtDateTime(citizen.approvedAt) : "—" },
              ].map((x) => (
                <div key={x.l} className="flex items-start gap-3 py-2.5">
                  <x.Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.8} />
                  <div className="min-w-0">
                    <dt className="text-[12px] text-ink-3">{x.l}</dt>
                    <dd className={cn("text-ink", x.mono && "num")}>{x.v}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>

      <OrderDrawer orderId={open} onClose={() => setOpen(null)} onOpenOrder={setOpen} />
    </>
  );
}
