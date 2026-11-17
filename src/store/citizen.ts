"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useData, RuleError, MOBILE_RE } from "./data";
import { demoHash } from "@/lib/utils";
import { bn } from "@/lib/bn";

export type LookupResult =
  | { kind: "NOT_FOUND" }
  | { kind: "PENDING"; name: string }
  | { kind: "REJECTED"; name: string; reason?: string }
  | { kind: "NEEDS_ACTIVATION"; name: string }
  | { kind: "READY"; name: string };

const MAX_TRIES = 5;
const LOCK_MIN = 10;

interface CitizenState {
  citizenId: string | null;
  cart: Record<string, number>;
  tries: Record<string, { count: number; lockedUntil?: number }>;
  lookup: (mobile: string) => LookupResult;
  activate: (mobile: string, cardNo: string, pin: string) => Promise<void>;
  login: (mobile: string, pin: string) => Promise<void>;
  logout: () => void;
  setQty: (productId: string, qty: number) => void;
  clearCart: () => void;
}

function findByMobile(mobile: string) {
  return useData.getState().citizens.find((c) => c.mobile === mobile);
}

export const useCitizen = create<CitizenState>()(
  persist(
    (set, get) => ({
      citizenId: null,
      cart: {},
      tries: {},

      lookup: (mobile) => {
        const c = findByMobile(mobile);
        if (!c) return { kind: "NOT_FOUND" };
        if (c.status === "PENDING") return { kind: "PENDING", name: c.nameBn };
        if (c.status === "REJECTED") return { kind: "REJECTED", name: c.nameBn, reason: c.rejectReason };
        return c.pinHash ? { kind: "READY", name: c.nameBn } : { kind: "NEEDS_ACTIVATION", name: c.nameBn };
      },

      activate: async (mobile, cardNo, pin) => {
        await new Promise((r) => setTimeout(r, 700));
        const c = findByMobile(mobile);
        if (!c || c.status !== "APPROVED") throw new RuleError("এই নম্বরে কোনো চালু রেশন কার্ড পাওয়া যায়নি");
        const norm = cardNo.trim().toUpperCase().replace(/^RC-?/, "");
        if (`RC-${norm.padStart(6, "0")}` !== c.rationCardNo) throw new RuleError("রেশন কার্ড নম্বর মেলেনি");
        if (!/^\d{4,6}$/.test(pin)) throw new RuleError("পিন ৪ থেকে ৬ সংখ্যার হতে হবে");
        if (/^(\d)\1+$/.test(pin) || "0123456789".includes(pin)) throw new RuleError("সহজে আন্দাজ করা যায় এমন পিন দেবেন না");
        useData.getState().setCitizenPin(c.id, demoHash(pin));
        set({ citizenId: c.id, cart: {} });
      },

      login: async (mobile, pin) => {
        if (!MOBILE_RE.test(mobile)) throw new RuleError("মোবাইল নম্বর সঠিক নয়");
        const t = get().tries[mobile];
        if (t?.lockedUntil && t.lockedUntil > Date.now()) {
          const min = Math.ceil((t.lockedUntil - Date.now()) / 60000);
          throw new RuleError(`কয়েকবার ভুল পিন দেওয়া হয়েছে। ${bn(min)} মিনিট পর আবার চেষ্টা করুন`);
        }
        await new Promise((r) => setTimeout(r, 600));
        const c = findByMobile(mobile);
        if (!c || c.status !== "APPROVED" || c.pinHash !== demoHash(pin)) {
          const count = (t?.count ?? 0) + 1;
          const locked = count >= MAX_TRIES;
          set({ tries: { ...get().tries, [mobile]: locked ? { count: 0, lockedUntil: Date.now() + LOCK_MIN * 60000 } : { count } } });
          throw new RuleError(locked ? `৫ বার ভুল পিন। ${bn(LOCK_MIN)} মিনিট পর আবার চেষ্টা করুন` : `পিন মেলেনি (আর ${bn(MAX_TRIES - count)} বার চেষ্টা করা যাবে)`);
        }
        const rest = { ...get().tries };
        delete rest[mobile];
        set({ citizenId: c.id, tries: rest, cart: {} });
      },

      logout: () => set({ citizenId: null, cart: {} }),

      setQty: (productId, qty) => {
        const cart = { ...get().cart };
        if (qty <= 0) delete cart[productId];
        else cart[productId] = qty;
        set({ cart });
      },
      clearCart: () => set({ cart: {} }),
    }),
    { name: "kp-ration-citizen", storage: createJSONStorage(() => localStorage) },
  ),
);
