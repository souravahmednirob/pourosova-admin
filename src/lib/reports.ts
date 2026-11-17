import type { Order, Product, ProductCategory, Citizen } from "./types";

export type Period = "TODAY" | "LAST7" | "THIS_MONTH" | "LAST3M" | "THIS_YEAR" | "CUSTOM";

export const PERIOD_LABEL: Record<Period, string> = {
  TODAY: "আজ",
  LAST7: "শেষ ৭ দিন",
  THIS_MONTH: "এই মাস",
  LAST3M: "শেষ ৩ মাস",
  THIS_YEAR: "এ বছর",
  CUSTOM: "কাস্টম",
};

export function periodRange(p: Period, from?: string, to?: string, now = new Date()): { start: Date; end: Date } {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  switch (p) {
    case "TODAY":
      break;
    case "LAST7":
      start.setDate(start.getDate() - 6);
      break;
    case "THIS_MONTH":
      start.setDate(1);
      break;
    case "LAST3M":
      start.setMonth(start.getMonth() - 2, 1);
      break;
    case "THIS_YEAR":
      start.setMonth(0, 1);
      break;
    case "CUSTOM": {
      const s = from ? new Date(from) : start;
      const e = to ? new Date(to) : end;
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
  }
  return { start, end };
}

/** Sales are counted only from completed (collected) orders, by collection time. */
export function completedIn(orders: Order[], start: Date, end: Date) {
  const s = start.getTime(), e = end.getTime();
  return orders.filter((o) => o.status === "COLLECTED" && o.collectedAt && new Date(o.collectedAt).getTime() >= s && new Date(o.collectedAt).getTime() <= e);
}

export interface ProductRow {
  product: Product;
  qty: number;
  sales: number;
  market: number;
  saving: number;
  orders: number;
}

export function productRows(orders: Order[], products: Product[], category: ProductCategory | "ALL"): ProductRow[] {
  const map = new Map<string, ProductRow>();
  for (const p of products) if (category === "ALL" || p.category === category) map.set(p.id, { product: p, qty: 0, sales: 0, market: 0, saving: 0, orders: 0 });
  for (const o of orders) {
    for (const it of o.items) {
      const r = map.get(it.productId);
      if (!r) continue;
      r.qty += it.quantity;
      r.sales += it.quantity * it.unitPriceSnapshot;
      r.market += it.quantity * it.marketPriceSnapshot;
      r.orders += 1;
    }
  }
  for (const r of map.values()) r.saving = r.market - r.sales;
  return [...map.values()];
}

export function totalsOf(rows: ProductRow[], orders: Order[], category: ProductCategory | "ALL", products: Product[]) {
  const ids = new Set(products.filter((p) => category === "ALL" || p.category === category).map((p) => p.id));
  const orderCount = orders.filter((o) => o.items.some((i) => ids.has(i.productId))).length;
  return rows.reduce((a, r) => ({ sales: a.sales + r.sales, market: a.market + r.market, saving: a.saving + r.saving, orders: orderCount }), { sales: 0, market: 0, saving: 0, orders: orderCount });
}

/** Year view used by the four charts: always the last 12 months ending this month. */
export function yearMonths(now = new Date()) {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
}

export function chartData(orders: Order[], products: Product[], citizens: Citizen[], wardIds: { id: string; number: number }[], now = new Date()) {
  const months = yearMonths(now);
  const start = new Date(months[0].y, months[0].m, 1);
  const done = completedIn(orders, start, new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59));
  const pById = new Map(products.map((p) => [p.id, p]));
  const cById = new Map(citizens.map((c) => [c.id, c]));
  const cats: ProductCategory[] = ["RICE_FLOUR", "LENTIL", "OIL_SPICE", "GROCERY", "VEG"];
  const byCat: Record<ProductCategory, number[]> = Object.fromEntries(cats.map((c) => [c, Array(12).fill(0)])) as Record<ProductCategory, number[]>;
  const monthSales = Array(12).fill(0) as number[];
  const monthMarket = Array(12).fill(0) as number[];
  const byProduct = new Map<string, number>();
  const byWard = new Map<number, number>();
  for (const o of done) {
    const d = new Date(o.collectedAt!);
    const idx = months.findIndex((x) => x.y === d.getFullYear() && x.m === d.getMonth());
    if (idx < 0) continue;
    const ward = wardIds.find((w) => w.id === cById.get(o.citizenId)?.wardId)?.number ?? 0;
    for (const it of o.items) {
      const p = pById.get(it.productId);
      if (!p) continue;
      const s = it.quantity * it.unitPriceSnapshot;
      byCat[p.category][idx] += s;
      monthSales[idx] += s;
      monthMarket[idx] += it.quantity * it.marketPriceSnapshot;
      byProduct.set(p.id, (byProduct.get(p.id) ?? 0) + s);
      byWard.set(ward, (byWard.get(ward) ?? 0) + s);
    }
  }
  return { months, cats, byCat, monthSales, monthMarket, byProduct, byWard };
}
