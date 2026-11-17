"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Inbox, PackageSearch, PackageCheck, XCircle, Search, ScanSearch, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Pill, Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { DataGrid, type GridColumn } from "@/components/grid/data-grid";
import { OrderDrawer } from "@/components/orders/order-drawer";
import { useData } from "@/store/data";
import { ORDER_STATUS_LABEL, type Order, type OrderStatus } from "@/lib/types";
import { bn, taka, fmtDateTime, WARD_NAME, en } from "@/lib/bn";
import { orderTotals, orderTone } from "@/lib/orders";
import { cn } from "@/lib/utils";

const CHIPS: { key: OrderStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "সব" },
  { key: "PENDING", label: "অপেক্ষায়" },
  { key: "AWAITING_PICKUP", label: "সংগ্রহের অপেক্ষায়" },
  { key: "COLLECTED", label: "সংগৃহীত" },
  { key: "CANCELLED", label: "বাতিল" },
];

function OrdersInner() {
  const router = useRouter();
  const params = useSearchParams();
  const orders = useData((s) => s.orders);
  const citizens = useData((s) => s.citizens);
  const wards = useData((s) => s.wards);
  const [chip, setChip] = useState<OrderStatus | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const id = params.get("order");
    if (id) {
      queueMicrotask(() => setOpen(id));
      router.replace("/admin/orders");
    }
  }, [params, router]);

  const citizenById = useMemo(() => new Map(citizens.map((c) => [c.id, c])), [citizens]);
  const wardNo = (id: string) => wards.find((w) => w.id === id)?.number ?? 0;

  const counts = useMemo(() => {
    const c: Record<OrderStatus | "ALL", number> = { ALL: orders.length, PENDING: 0, AWAITING_PICKUP: 0, COLLECTED: 0, CANCELLED: 0 };
    for (const o of orders) c[o.status] += 1;
    return c;
  }, [orders]);

  const rows = useMemo(() => {
    const qe = en(q.trim()).toLowerCase();
    return orders.filter((o) => {
      if (chip !== "ALL" && o.status !== chip) return false;
      if (!qe) return true;
      const c = citizenById.get(o.citizenId);
      return o.orderNo.toLowerCase().includes(qe) || !!c?.nameBn.includes(q.trim()) || !!c?.nameEn.toLowerCase().includes(qe) || !!c?.rationCardNo?.toLowerCase().includes(qe);
    });
  }, [orders, chip, q, citizenById]);

  const columns = useMemo<GridColumn<Order>[]>(
    () => [
      { key: "no", label: "অর্ডার নং", value: (o) => o.orderNo, render: (o) => <span className="num font-semibold text-ink">{bn(o.orderNo)}</span>, width: 130 },
      {
        key: "citizen",
        label: "নাগরিক",
        value: (o) => citizenById.get(o.citizenId)?.nameBn ?? "",
        minWidth: 200,
        render: (o) => {
          const c = citizenById.get(o.citizenId);
          return (
            <div className="min-w-0">
              <div className="truncate font-medium text-ink">{c?.nameBn ?? "—"}</div>
              <div className="num text-[12px] text-ink-3">{c?.rationCardNo ? bn(c.rationCardNo) : "—"}</div>
            </div>
          );
        },
      },
      { key: "ward", label: "ওয়ার্ড", value: (o) => wardNo(citizenById.get(o.citizenId)?.wardId ?? ""), render: (o) => WARD_NAME(wardNo(citizenById.get(o.citizenId)?.wardId ?? "")), width: 100 },
      { key: "items", label: "পণ্য", value: (o) => o.items.length, render: (o) => <span className="num">{bn(o.items.length)}টি</span>, align: "right", width: 80 },
      { key: "total", label: "মোট মূল্য", value: (o) => orderTotals(o).total, render: (o) => <span className="num font-semibold text-ink">{taka(orderTotals(o).total)}</span>, align: "right", width: 120 },
      { key: "saving", label: "সাশ্রয়", value: (o) => orderTotals(o).saving, render: (o) => <Pill tone="sage">{taka(orderTotals(o).saving)}</Pill>, align: "right", width: 110 },
      { key: "applied", label: "আবেদনের সময়", value: (o) => o.appliedAt, render: (o) => <span className="tabular whitespace-nowrap text-ink-2">{fmtDateTime(o.appliedAt)}</span>, minWidth: 180 },
      { key: "status", label: "অবস্থা", value: (o) => ORDER_STATUS_LABEL[o.status], render: (o) => <Pill tone={orderTone[o.status]} dot>{ORDER_STATUS_LABEL[o.status]}</Pill>, width: 170 },
      {
        key: "act",
        label: "কাজ",
        value: () => "",
        sortable: false,
        width: 130,
        render: (o) => (
          <Button variant={o.status === "PENDING" ? "primary" : "outline"} size="sm" onClick={(e) => { e.stopPropagation(); setOpen(o.id); }}>
            {o.status === "PENDING" ? <><ScanSearch className="h-3.5 w-3.5" strokeWidth={1.8} /> যাচাই করুন</> : <><FileText className="h-3.5 w-3.5" strokeWidth={1.8} /> বিস্তারিত</>}
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [citizenById, wards],
  );

  return (
    <>
      <PageHeader title="অর্ডার অনুরোধ" subtitle={counts.PENDING > 0 ? `${bn(counts.PENDING)}টি অনুরোধ যাচাইয়ের অপেক্ষায়` : "সব অনুরোধ যাচাই করা হয়েছে"} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="নতুন অনুরোধ" value={counts.PENDING} icon={Inbox} tone="ochre" />
        <KpiCard label="সংগ্রহের অপেক্ষায়" value={counts.AWAITING_PICKUP} icon={PackageSearch} tone="petrol" />
        <KpiCard label="সংগ্রহ সম্পন্ন" value={counts.COLLECTED} icon={PackageCheck} tone="sage" />
        <KpiCard label="বাতিল" value={counts.CANCELLED} icon={XCircle} tone="brick" />
      </div>

      <div className="mt-5">
        <DataGrid<Order>
          rows={rows}
          columns={columns}
          rowKey={(o) => o.id}
          onRowClick={(o) => setOpen(o.id)}
          defaultSort={{ key: "applied", dir: "desc" }}
          defaultPageSize={10}
          pageSizeOptions={[10, 20, 50, 100]}
          exportFileName="orders"
          storageKey="orders"
          features={{ groupBar: false, filters: false, columnPanel: false }}
          toolbar={
            <>
              <div className="flex flex-wrap gap-1.5">
                {CHIPS.map((c) => (
                  <button key={c.key} type="button" onClick={() => setChip(c.key)} className={cn("flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors", chip === c.key ? "border-copper bg-copper-soft text-copper-deep dark:text-copper" : "border-line-strong text-ink-2 hover:bg-sunken")}>
                    {c.label}
                    <span className={cn("num rounded-full px-1.5 text-[11px]", chip === c.key ? "bg-copper/15" : "bg-sunken")}>{bn(counts[c.key])}</span>
                  </button>
                ))}
              </div>
              <div className="relative ml-auto w-full max-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" strokeWidth={1.8} />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="অর্ডার নং বা নাগরিকের নাম…" className="h-9 pl-9 text-[13px]" />
              </div>
            </>
          }
        />
      </div>

      <OrderDrawer orderId={open} onClose={() => setOpen(null)} onOpenOrder={(id) => setOpen(id)} />
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersInner />
    </Suspense>
  );
}
