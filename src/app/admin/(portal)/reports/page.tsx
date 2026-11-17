"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ChevronsUpDown, FileSpreadsheet, Printer, Wallet, ShoppingBag, Store, PiggyBank, CalendarRange } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, Field, Input, NativeSelect, Pill, Empty } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { SalesCharts } from "@/components/reports/sales-charts";
import { useData } from "@/store/data";
import { useAuth, can } from "@/store/auth";
import { PERIOD_LABEL, periodRange, completedIn, productRows, totalsOf, type Period, type ProductRow } from "@/lib/reports";
import { CATEGORY_LABEL, UNIT_LABEL, type ProductCategory } from "@/lib/types";
import { bn, taka, fmtDate, fmtDateLong } from "@/lib/bn";
import { PrintReport } from "@/components/reports/print-report";
import { CATEGORY_TONE } from "@/lib/orders";
import { cn } from "@/lib/utils";

type SortKey = "name" | "cat" | "qty" | "sales" | "market" | "saving" | "orders" | "stock";

const COLS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "name", label: "পণ্য" },
  { key: "cat", label: "ক্যাটাগরি" },
  { key: "qty", label: "বিক্রিত পরিমাণ", align: "right" },
  { key: "sales", label: "মোট বিক্রয়", align: "right" },
  { key: "market", label: "বাজার মূল্য হলে", align: "right" },
  { key: "saving", label: "নাগরিকের সাশ্রয়", align: "right" },
  { key: "orders", label: "অর্ডার", align: "right" },
  { key: "stock", label: "মজুত বাকি", align: "right" },
];

function sortVal(r: ProductRow, k: SortKey): string | number {
  switch (k) {
    case "name": return r.product.name;
    case "cat": return CATEGORY_LABEL[r.product.category];
    case "qty": return r.qty;
    case "sales": return r.sales;
    case "market": return r.market;
    case "saving": return r.saving;
    case "orders": return r.orders;
    case "stock": return r.product.stock;
  }
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function ReportsPage() {
  const user = useAuth((s) => s.user);
  const orders = useData((s) => s.orders);
  const products = useData((s) => s.products);
  const [period, setPeriod] = useState<Period>("THIS_YEAR");
  const [from, setFrom] = useState(() => iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [to, setTo] = useState(() => iso(new Date()));
  const [cat, setCat] = useState<ProductCategory | "ALL">("ALL");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "sales", dir: "desc" });
  const canExport = can(user?.role, "report.export");

  const range = useMemo(() => periodRange(period, from, to), [period, from, to]);
  const done = useMemo(() => completedIn(orders, range.start, range.end), [orders, range]);
  const rows = useMemo(() => productRows(done, products, cat), [done, products, cat]);
  const totals = useMemo(() => totalsOf(rows, done, cat, products), [rows, done, cat, products]);
  const sorted = useMemo(() => {
    const out = [...rows].sort((a, b) => {
      const x = sortVal(a, sort.key), y = sortVal(b, sort.key);
      const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "bn");
      return sort.dir === "asc" ? r : -r;
    });
    return out;
  }, [rows, sort]);

  const rangeText = `${fmtDateLong(range.start)} থেকে ${fmtDateLong(range.end)}`;
  const badRange = period === "CUSTOM" && range.start > range.end;

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const header = [
      ["কালিয়াকৈর পৌরসভা — নাগরিক রেশন সেবা"],
      ["বিক্রয় রিপোর্ট"],
      [`সময়: ${fmtDate(range.start)} – ${fmtDate(range.end)}`, "", `ক্যাটাগরি: ${cat === "ALL" ? "সব" : CATEGORY_LABEL[cat]}`],
      [`মোট বিক্রয় (৳)`, totals.sales, "মোট অর্ডার", totals.orders, "বাজার মূল্য হলে (৳)", totals.market, "নাগরিকের সাশ্রয় (৳)", totals.saving],
      [],
      ["পণ্য", "ক্যাটাগরি", "বিক্রিত পরিমাণ", "একক", "মোট বিক্রয় (৳)", "বাজার মূল্য হলে (৳)", "নাগরিকের সাশ্রয় (৳)", "অর্ডার", "মজুত বাকি"],
    ];
    const body = sorted.map((r) => [r.product.name, CATEGORY_LABEL[r.product.category], r.qty, UNIT_LABEL[r.product.unit], r.sales, r.market, r.saving, r.orders, r.product.stock]);
    const ws = XLSX.utils.aoa_to_sheet([...header, ...body]);
    ws["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 12 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "বিক্রয় রিপোর্ট");
    XLSX.writeFile(wb, `sales-report_${iso(range.start)}_${iso(range.end)}.xlsx`);
    toast.success("এক্সেল ফাইল ডাউনলোড হয়েছে");
  };

  const SortIcon = ({ k }: { k: SortKey }) => (sort.key !== k ? <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" /> : sort.dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />);

  return (
    <>
      <PageHeader title="বিক্রয় রিপোর্ট" subtitle="শুধু সংগ্রহ সম্পন্ন অর্ডার থেকে হিসাব" />

      {/* Part A: four charts, always the last 12 months */}
      <SalesCharts />

      {/* Part B: report with its own filters */}
      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-bold text-ink">রিপোর্ট</h2>
            <div className="mt-1 flex items-center gap-1.5 text-[13.5px] text-ink-3">
              <CalendarRange className="h-4 w-4" strokeWidth={1.8} />
              {badRange ? <span className="text-brick">শুরুর তারিখ শেষের তারিখের পরে হতে পারে না</span> : <span>{rangeText}{cat !== "ALL" && ` · ${CATEGORY_LABEL[cat]}`}</span>}
            </div>
          </div>
          {canExport && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={exportExcel} disabled={badRange}><FileSpreadsheet className="h-4 w-4" strokeWidth={1.8} /> এক্সেল ফাইল</Button>
              <Button variant="secondary" onClick={() => window.print()} disabled={badRange}><Printer className="h-4 w-4" strokeWidth={1.8} /> রিপোর্ট প্রিন্ট</Button>
            </div>
          )}
        </div>

        <Card className="mb-4 flex flex-wrap items-end gap-3 p-4">
          <Field label="সময়" className="w-[180px]">
            <NativeSelect value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
              {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => <option key={p} value={p}>{PERIOD_LABEL[p]}</option>)}
            </NativeSelect>
          </Field>
          {period === "CUSTOM" && (
            <>
              <Field label="থেকে" className="w-[170px] animate-[page-in_220ms_var(--ease-out)]"><Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="num" /></Field>
              <Field label="পর্যন্ত" className="w-[170px] animate-[page-in_220ms_var(--ease-out)]"><Input type="date" value={to} min={from} max={iso(new Date())} onChange={(e) => setTo(e.target.value)} className="num" /></Field>
            </>
          )}
          <Field label="ক্যাটাগরি" className="w-[180px]">
            <NativeSelect value={cat} onChange={(e) => setCat(e.target.value as ProductCategory | "ALL")}>
              <option value="ALL">সব</option>
              {(Object.keys(CATEGORY_LABEL) as ProductCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </NativeSelect>
          </Field>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="মোট বিক্রয়" value={badRange ? 0 : totals.sales} prefix="৳" icon={Wallet} tone="copper" />
          <KpiCard label="মোট অর্ডার" value={badRange ? 0 : totals.orders} icon={ShoppingBag} tone="petrol" />
          <KpiCard label="বাজার মূল্য হলে" value={badRange ? 0 : totals.market} prefix="৳" icon={Store} tone="neutral" />
          <KpiCard label="নাগরিকের সাশ্রয়" value={badRange ? 0 : totals.saving} prefix="৳" icon={PiggyBank} tone="sage" />
        </div>

        <Card className="mt-4 overflow-hidden">
          <div className="table-wrap">
            <table className="w-full min-w-[900px] border-separate border-spacing-0 text-[13.5px]">
              <thead>
                <tr>
                  {COLS.map((c) => (
                    <th key={c.key} aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={cn("border-b border-line bg-[var(--surface-solid)] px-4 py-0", c.align === "right" ? "text-right" : "text-left")}>
                      <button type="button" onClick={() => setSort((s) => (s.key === c.key ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: c.align === "right" ? "desc" : "asc" }))} className={cn("label-caps inline-flex h-11 items-center gap-1.5", c.align === "right" && "flex-row-reverse")}>
                        {c.label} <SortIcon k={c.key} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(badRange || sorted.length === 0) && (
                  <tr><td colSpan={COLS.length}><Empty title="এই সময়ে কোনো বিক্রয় নেই" hint="সময় বা ক্যাটাগরি বদলে দেখুন" /></td></tr>
                )}
                {!badRange && sorted.map((r) => (
                  <tr key={r.product.id} className="transition-colors hover:bg-sunken/60">
                    <td className="border-b border-line px-4 py-3 font-semibold text-ink">{r.product.name}</td>
                    <td className="border-b border-line px-4 py-3"><Pill tone={CATEGORY_TONE[r.product.category]}>{CATEGORY_LABEL[r.product.category]}</Pill></td>
                    <td className="num border-b border-line px-4 py-3 text-right text-ink-2">{bn(r.qty)} {UNIT_LABEL[r.product.unit]}</td>
                    <td className="num border-b border-line px-4 py-3 text-right font-semibold text-ink">{taka(r.sales)}</td>
                    <td className="num border-b border-line px-4 py-3 text-right text-ink-3">{taka(r.market)}</td>
                    <td className="border-b border-line px-4 py-3 text-right"><span className="num font-semibold text-sage">{taka(r.saving)}</span></td>
                    <td className="num border-b border-line px-4 py-3 text-right text-ink-2">{bn(r.orders)}</td>
                    <td className={cn("num border-b border-line px-4 py-3 text-right", r.product.stock === 0 ? "text-brick" : "text-ink-2")}>{bn(r.product.stock)} {UNIT_LABEL[r.product.unit]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
      {!badRange && <PrintReport rows={sorted} totals={totals} rangeText={`${fmtDate(range.start)} – ${fmtDate(range.end)}`} categoryText={cat === "ALL" ? "সব" : CATEGORY_LABEL[cat]} preparedBy={user?.name} />}
    </>
  );
}
