import type { Order, OrderStatus, Product } from "./types";
import type { Tone } from "@/components/ui/primitives";

export function orderTotals(o: Order) {
  let total = 0;
  let market = 0;
  for (const it of o.items) {
    total += it.quantity * it.unitPriceSnapshot;
    market += it.quantity * it.marketPriceSnapshot;
  }
  return { total, market, saving: market - total };
}

export const orderTone: Record<OrderStatus, Tone> = {
  PENDING: "ochre",
  AWAITING_PICKUP: "petrol",
  COLLECTED: "sage",
  CANCELLED: "brick",
};

export function stockState(p: Product, lowPct = 25): "OK" | "LOW" | "OUT" {
  if (p.stock <= 0) return "OUT";
  if (p.stock / p.capacity < lowPct / 100) return "LOW";
  return "OK";
}

export const STOCK_LABEL = { OK: "পর্যাপ্ত", LOW: "কম মজুত", OUT: "মজুত শেষ" } as const;
export const stockTone: Record<"OK" | "LOW" | "OUT", Tone> = { OK: "sage", LOW: "ochre", OUT: "brick" };

export function savingPct(p: { marketPrice: number; municipalPrice: number }) {
  return Math.round(((p.marketPrice - p.municipalPrice) / p.marketPrice) * 100);
}

export const CATEGORY_TONE = {
  RICE_FLOUR: "ochre",
  LENTIL: "copper",
  OIL_SPICE: "petrol",
  GROCERY: "neutral",
  VEG: "sage",
} as const;
