"use client";
import { useMemo } from "react";
import { useCitizen } from "@/store/citizen";
import { useData } from "@/store/data";
import type { Product } from "@/lib/types";

/** The signed-in citizen (CitizenFrame guarantees one exists on protected pages). */
export function useMe() {
  const id = useCitizen((s) => s.citizenId);
  const citizen = useData((s) => s.citizens.find((c) => c.id === id))!;
  const allOrders = useData((s) => s.orders);
  const orders = useMemo(() => allOrders.filter((o) => o.citizenId === id).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)), [allOrders, id]);
  return { citizen, orders };
}

/** How much of each product the family can still take this calendar month. */
export function useAllowance() {
  const id = useCitizen((s) => s.citizenId)!;
  const products = useData((s) => s.products);
  const orders = useData((s) => s.orders);
  const monthlyUsage = useData((s) => s.monthlyUsage);
  return useMemo(() => {
    void orders; // recompute when orders change
    return products
      .filter((p) => p.active)
      .map((p: Product) => {
        const used = monthlyUsage(id, p.id);
        return { product: p, used, left: Math.max(0, p.perFamilyLimit - used) };
      });
  }, [products, orders, monthlyUsage, id]);
}
