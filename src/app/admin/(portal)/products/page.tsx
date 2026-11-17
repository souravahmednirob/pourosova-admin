"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Package, PackageCheck, AlertTriangle, PackageX, Pencil, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Pill, Switch, Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { DataGrid, type GridColumn } from "@/components/grid/data-grid";
import { ProductDrawer } from "@/components/products/product-drawer";
import { useData, RuleError } from "@/store/data";
import { useAuth, can } from "@/store/auth";
import { CATEGORY_LABEL, UNIT_LABEL, type Product, type ProductCategory } from "@/lib/types";
import { bn, taka, pct } from "@/lib/bn";
import { stockState, STOCK_LABEL, stockTone, savingPct, CATEGORY_TONE } from "@/lib/orders";
import { cn } from "@/lib/utils";

const CATS: (ProductCategory | "ALL")[] = ["ALL", "RICE_FLOUR", "LENTIL", "OIL_SPICE", "GROCERY", "VEG"];

function ProductsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const user = useAuth((s) => s.user);
  const products = useData((s) => s.products);
  const lowPct = useData((s) => s.settings.lowStockPct);
  const toggle = useData((s) => s.toggleProduct);
  const [cat, setCat] = useState<ProductCategory | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; id?: string }>({ open: false });
  const canEdit = can(user?.role, "product.edit");

  useEffect(() => {
    const p = params.get("product");
    if (p) {
      queueMicrotask(() => setDrawer({ open: true, id: p }));
      router.replace("/admin/products");
    }
  }, [params, router]);

  const rows = useMemo(() => products.filter((p) => (cat === "ALL" || p.category === cat) && (!q || p.name.includes(q))), [products, cat, q]);
  const counts = useMemo(() => {
    const low = products.filter((p) => stockState(p, lowPct) === "LOW").length;
    const out = products.filter((p) => stockState(p, lowPct) === "OUT").length;
    return { total: products.length, active: products.filter((p) => p.active).length, low, out };
  }, [products, lowPct]);

  const columns = useMemo<GridColumn<Product>[]>(
    () => [
      {
        key: "name",
        label: "পণ্য",
        value: (p) => p.name,
        minWidth: 170,
        render: (p) => (
          <div>
            <div className="font-semibold text-ink">{p.name}</div>
            <div className="text-[12px] text-ink-3">প্রতি {UNIT_LABEL[p.unit]}</div>
          </div>
        ),
      },
      { key: "cat", label: "ক্যাটাগরি", value: (p) => CATEGORY_LABEL[p.category], render: (p) => <Pill tone={CATEGORY_TONE[p.category]}>{CATEGORY_LABEL[p.category]}</Pill>, width: 120 },
      { key: "market", label: "বাজার দাম", value: (p) => p.marketPrice, render: (p) => <span className="num text-ink-3 line-through">{taka(p.marketPrice)}</span>, align: "right", width: 100 },
      {
        key: "price",
        label: "পৌরসভার দাম",
        value: (p) => p.municipalPrice,
        align: "right",
        minWidth: 170,
        render: (p) => (
          <span className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
            <span className="num text-[15px] font-bold text-ink">{taka(p.municipalPrice)}</span>
            <Pill tone="sage" className="h-[22px] px-2 text-[11.5px]">সাশ্রয় {pct(savingPct(p))}</Pill>
          </span>
        ),
      },
      {
        key: "stock",
        label: "মজুত",
        value: (p) => p.stock,
        minWidth: 160,
        render: (p) => {
          const r = Math.min(1, p.stock / p.capacity);
          const st = stockState(p, lowPct);
          return (
            <div className="min-w-[130px]">
              <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
                <span className={cn("num font-semibold", st === "OK" ? "text-ink" : "text-brick")}>{bn(p.stock)} {UNIT_LABEL[p.unit]}</span>
                <span className="num text-ink-3">{pct(Math.round(r * 100))}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunken">
                <div className={cn("h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out)]", st === "OK" ? "bg-sage-2" : st === "LOW" ? "bg-brick-2" : "bg-brick")} style={{ width: `${Math.max(2, r * 100)}%` }} />
              </div>
            </div>
          );
        },
      },
      { key: "limit", label: "পরিবারপ্রতি সীমা", value: (p) => p.perFamilyLimit, render: (p) => <span className="num whitespace-nowrap">{bn(p.perFamilyLimit)} {UNIT_LABEL[p.unit]}/মাস</span>, align: "right", width: 130 },
      { key: "state", label: "অবস্থা", value: (p) => STOCK_LABEL[stockState(p, lowPct)], render: (p) => { const st = stockState(p, lowPct); return <Pill tone={stockTone[st]} dot>{STOCK_LABEL[st]}</Pill>; }, width: 120 },
      {
        key: "active",
        label: "চালু",
        value: (p) => (p.active ? "চালু" : "বন্ধ"),
        align: "center",
        width: 80,
        render: (p) => (
          <span onClick={(e) => e.stopPropagation()} className="inline-flex">
            <Switch checked={p.active} disabled={!canEdit} label={`${p.name} চালু/বন্ধ`} onCheckedChange={() => { try { const n = toggle(p.id, { id: user!.id, name: user!.name }); toast(n.active ? `${p.name} চালু হয়েছে` : `${p.name} বন্ধ হয়েছে`); } catch (e) { toast.error(e instanceof RuleError ? e.message : "করা যায়নি"); } }} />
          </span>
        ),
      },
      {
        key: "act",
        label: "কাজ",
        value: () => "",
        sortable: false,
        width: 110,
        render: (p) => (
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setDrawer({ open: true, id: p.id }); }}>
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} /> {canEdit ? "সম্পাদনা" : "বিস্তারিত"}
          </Button>
        ),
      },
    ],
    [lowPct, canEdit, toggle, user],
  );

  return (
    <>
      <PageHeader title="পণ্য ব্যবস্থাপনা" subtitle="দাম, মজুত ও পরিবারপ্রতি মাসিক সীমা" actions={canEdit && <Button onClick={() => setDrawer({ open: true })}><Plus className="h-4 w-4" strokeWidth={1.8} /> নতুন পণ্য</Button>} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="মোট পণ্য" value={counts.total} icon={Package} tone="petrol" />
        <KpiCard label="চালু পণ্য" value={counts.active} icon={PackageCheck} tone="sage" />
        <KpiCard label="কম মজুত" value={counts.low} icon={AlertTriangle} tone="ochre" />
        <KpiCard label="মজুত শেষ" value={counts.out} icon={PackageX} tone="brick" />
      </div>

      <div className="mt-5">
        <DataGrid<Product>
          rows={rows}
          columns={columns}
          rowKey={(p) => p.id}
          onRowClick={(p) => setDrawer({ open: true, id: p.id })}
          defaultPageSize={15}
          exportFileName="products"
          features={{ groupBar: false, filters: false, columnPanel: false }}
          minHeight={360}
          toolbar={
            <>
              <div className="flex flex-wrap gap-1.5">
                {CATS.map((c) => (
                  <button key={c} type="button" onClick={() => setCat(c)} className={cn("h-9 rounded-full border px-3.5 text-[13px] font-medium transition-colors", cat === c ? "border-copper bg-copper-soft text-copper-deep dark:text-copper" : "border-line-strong text-ink-2 hover:bg-sunken")}>
                    {c === "ALL" ? "সব" : CATEGORY_LABEL[c]}
                  </button>
                ))}
              </div>
              <div className="relative ml-auto w-full max-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" strokeWidth={1.8} />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="পণ্যের নাম…" className="h-9 pl-9 text-[13px]" />
              </div>
            </>
          }
        />
      </div>

      <ProductDrawer open={drawer.open} productId={drawer.id} onClose={() => setDrawer({ open: false })} />
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsInner />
    </Suspense>
  );
}
