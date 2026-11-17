"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { buildSeed, SEED_VERSION, type SeedData } from "@/lib/seed";
import { pad, uid } from "@/lib/utils";
import { bn } from "@/lib/bn";
import type { AuditEntry, Citizen, Notification, Order, OrderItem, Product, StockMovement, User } from "@/lib/types";

export class RuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuleError";
  }
}

export const NID_RE = /^(\d{10}|\d{13}|\d{17})$/;
export const MOBILE_RE = /^01[3-9]\d{8}$/;

export interface RegisterInput {
  nameBn: string;
  nameEn: string;
  nationalId: string;
  mobile: string;
  wardId: string;
  mohalla: string;
  holding: string;
  address: string;
  familySize: number;
  photoUrl?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
}

interface Actor {
  id: string;
  name: string;
}

interface DataState extends SeedData {
  seedVersion: number;
  // citizens
  registerCitizen: (input: RegisterInput, by: Actor, autoApprove: boolean) => Citizen;
  approveCitizen: (id: string, by: Actor) => Citizen;
  rejectCitizen: (id: string, reason: string, by: Actor) => Citizen;
  // orders
  createOrder: (citizenId: string, items: { productId: string; quantity: number }[], pickupPointId: string) => Order;
  approveOrder: (id: string, by: Actor) => Order;
  rejectOrder: (id: string, reason: string, by: Actor) => Order;
  confirmCollection: (orderId: string, code: string, via: "APP_CODE" | "APP_QR") => Order;
  expireOrders: () => number;
  // products
  upsertProduct: (p: Partial<Product> & { id?: string }, by: Actor) => Product;
  addStock: (productId: string, qty: number, by: Actor) => Product;
  toggleProduct: (productId: string, by: Actor) => Product;
  // misc
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  resetSeed: () => void;
  // selectors
  monthlyUsage: (citizenId: string, productId: string, ref?: Date) => number;
}

function nowIso() {
  return new Date().toISOString();
}

function audit(actor: Actor, action: string, entity: AuditEntry["entity"], entityId: string, before?: unknown, after?: unknown): AuditEntry {
  return { id: uid("au_"), actor: actor.id, actorName: actor.name, action, entity, entityId, before, after, at: nowIso() };
}

function notif(target: string, type: Notification["type"], text: string, link?: string): Notification {
  return { id: uid("n_"), target, type, text, read: false, at: nowIso(), link };
}

export const useData = create<DataState>()(
  persist(
    (set, get) => ({
      ...buildSeed(),
      seedVersion: SEED_VERSION,

      monthlyUsage: (citizenId, productId, ref = new Date()) => {
        const y = ref.getFullYear();
        const m = ref.getMonth();
        return get()
          .orders.filter((o) => o.citizenId === citizenId && (o.status === "AWAITING_PICKUP" || o.status === "COLLECTED" || o.status === "PENDING"))
          .filter((o) => {
            const d = new Date(o.appliedAt);
            return d.getFullYear() === y && d.getMonth() === m;
          })
          .reduce((sum, o) => sum + (o.items.find((i) => i.productId === productId)?.quantity ?? 0), 0);
      },

      registerCitizen: (input, by, autoApprove) => {
        const s = get();
        if (!input.nameBn.trim()) throw new RuleError("নাম (বাংলায়) দিন");
        if (!NID_RE.test(input.nationalId)) throw new RuleError("পরিচয়পত্র নম্বর ১০, ১৩ বা ১৭ ডিজিটের হতে হবে");
        if (!MOBILE_RE.test(input.mobile)) throw new RuleError("মোবাইল নম্বর সঠিক নয় (০১XXXXXXXXX)");
        const dupNid = s.citizens.find((c) => c.nationalId === input.nationalId);
        if (dupNid) throw new RuleError(`এই পরিচয়পত্র নম্বরে ${dupNid.nameBn} ইতিমধ্যে নিবন্ধিত (${dupNid.rationCardNo ?? "অপেক্ষায়"})`);
        const dupMob = s.citizens.find((c) => c.mobile === input.mobile);
        if (dupMob) throw new RuleError(`এই মোবাইল নম্বর ${dupMob.nameBn}-এর নামে নিবন্ধিত`);
        if (!input.wardId) throw new RuleError("ওয়ার্ড নির্বাচন করুন");
        if (input.familySize < 1 || input.familySize > 20) throw new RuleError("পরিবারের সদস্য সংখ্যা ১–২০ হতে হবে");

        const at = nowIso();
        const c: Citizen = {
          id: uid("c_"),
          ...input,
          status: "PENDING",
          registeredBy: by.id,
          registeredByName: by.name,
          registeredAt: at,
        };
        let counters = s.counters;
        if (autoApprove) {
          counters = { ...counters, rc: counters.rc + 1 };
          c.status = "APPROVED";
          c.rationCardNo = `RC-${pad(counters.rc)}`;
          c.approvedAt = at;
          c.approvedBy = by.id;
          c.registeredBy = "OFFICE";
          c.registeredByName = "পৌরসভা অফিস";
        }
        set({
          citizens: [c, ...s.citizens],
          counters,
          audit: [...s.audit, audit(by, autoApprove ? "নিবন্ধন (অফিস, স্বয়ংক্রিয় অনুমোদন)" : "নিবন্ধন জমা", "citizen", c.id, undefined, { nameBn: c.nameBn, rationCardNo: c.rationCardNo })],
          notifications: autoApprove ? s.notifications : [notif("STAFF", "NEW_REG", `${c.nameBn} — নতুন নিবন্ধন এসেছে`, `/admin?citizen=${c.id}`), ...s.notifications],
        });
        return c;
      },

      approveCitizen: (id, by) => {
        const s = get();
        const c = s.citizens.find((x) => x.id === id);
        if (!c) throw new RuleError("নাগরিক পাওয়া যায়নি");
        if (c.status !== "PENDING") throw new RuleError("শুধু অপেক্ষমাণ নিবন্ধন অনুমোদন করা যায়");
        const counters = { ...s.counters, rc: s.counters.rc + 1 };
        const next: Citizen = { ...c, status: "APPROVED", rationCardNo: `RC-${pad(counters.rc)}`, approvedAt: nowIso(), approvedBy: by.id };
        set({
          citizens: s.citizens.map((x) => (x.id === id ? next : x)),
          counters,
          audit: [...s.audit, audit(by, "নিবন্ধন অনুমোদন", "citizen", id, { status: c.status }, { status: "APPROVED", rationCardNo: next.rationCardNo })],
          notifications: [notif(c.id, "ORDER_APPROVED", `আপনার নিবন্ধন অনুমোদিত হয়েছে। রেশন কার্ড নম্বর ${next.rationCardNo}`), ...s.notifications.filter((n) => n.link !== `/admin?citizen=${id}`)],
        });
        return next;
      },

      rejectCitizen: (id, reason, by) => {
        const s = get();
        const c = s.citizens.find((x) => x.id === id);
        if (!c) throw new RuleError("নাগরিক পাওয়া যায়নি");
        if (c.status !== "PENDING") throw new RuleError("শুধু অপেক্ষমাণ নিবন্ধন বাতিল করা যায়");
        if (!reason.trim()) throw new RuleError("বাতিলের কারণ লিখুন");
        const next: Citizen = { ...c, status: "REJECTED", rejectReason: reason.trim(), approvedAt: nowIso(), approvedBy: by.id };
        set({
          citizens: s.citizens.map((x) => (x.id === id ? next : x)),
          audit: [...s.audit, audit(by, "নিবন্ধন বাতিল", "citizen", id, { status: c.status }, { status: "REJECTED", reason })],
          notifications: [notif(c.id, "ORDER_REJECTED", `আপনার নিবন্ধন গ্রহণ করা যায়নি: ${reason}`), ...s.notifications.filter((n) => n.link !== `/admin?citizen=${id}`)],
        });
        return next;
      },

      createOrder: (citizenId, items, pickupPointId) => {
        const s = get();
        const c = s.citizens.find((x) => x.id === citizenId);
        if (!c || c.status !== "APPROVED") throw new RuleError("অনুমোদিত নাগরিক নন");
        if (!items.length) throw new RuleError("অন্তত একটি পণ্য নির্বাচন করুন");
        const orderItems: OrderItem[] = [];
        for (const it of items) {
          const p = s.products.find((x) => x.id === it.productId);
          if (!p || !p.active) throw new RuleError("পণ্যটি এখন পাওয়া যাচ্ছে না");
          if (it.quantity < 1) continue;
          const used = s.monthlyUsage(citizenId, p.id);
          if (used + it.quantity > p.perFamilyLimit) throw new RuleError(`${p.name}: এই মাসে আর ${bn(Math.max(0, p.perFamilyLimit - used))} ${p.unit === "L" ? "লিটার" : "কেজি"} নেওয়া যাবে`);
          if (p.stock < it.quantity) throw new RuleError(`${p.name}: পর্যাপ্ত মজুত নেই`);
          orderItems.push({ productId: p.id, quantity: it.quantity, unitPriceSnapshot: p.municipalPrice, marketPriceSnapshot: p.marketPrice });
        }
        if (!orderItems.length) throw new RuleError("অন্তত একটি পণ্য নির্বাচন করুন");
        const counters = { ...s.counters, order: s.counters.order + 1 };
        const o: Order = { id: uid("o_"), orderNo: `ORD-${pad(counters.order)}`, citizenId, status: "PENDING", items: orderItems, appliedAt: nowIso(), pickupPointId };
        set({
          orders: [...s.orders, o],
          counters,
          notifications: [notif("STAFF", "NEW_ORDER", `${c.nameBn} — নতুন অর্ডার অনুরোধ`, `/admin/orders?order=${o.id}`), ...s.notifications],
        });
        return o;
      },

      approveOrder: (id, by) => {
        const s = get();
        const o = s.orders.find((x) => x.id === id);
        if (!o) throw new RuleError("অর্ডার পাওয়া যায়নি");
        if (o.status !== "PENDING") return o; // idempotent
        // reserve stock atomically; never negative
        const products = s.products.map((p) => ({ ...p }));
        for (const it of o.items) {
          const p = products.find((x) => x.id === it.productId)!;
          if (p.stock < it.quantity) throw new RuleError(`${p.name}: মজুত অপর্যাপ্ত (আছে ${bn(p.stock)}, দরকার ${bn(it.quantity)})`);
          p.stock -= it.quantity;
        }
        const code = pad(Math.floor(Math.random() * 1_000_000));
        const at = new Date();
        const deadline = new Date(at.getTime() + s.settings.pickupDeadlineDays * 86_400_000);
        const next: Order = { ...o, status: "AWAITING_PICKUP", approvedAt: at.toISOString(), approvedBy: by.id, pickupCode: code, pickupCodeHash: `h_${code}`, pickupDeadline: deadline.toISOString(), wrongTries: 0 };
        const movements: StockMovement[] = o.items.map((it) => ({ id: uid("m_"), productId: it.productId, type: "RESERVE", quantity: it.quantity, orderId: o.id, actor: by.id, at: at.toISOString() }));
        const c = s.citizens.find((x) => x.id === o.citizenId)!;
        const lowNotes = products.filter((p) => p.stock / p.capacity < s.settings.lowStockPct / 100 && s.products.find((x) => x.id === p.id)!.stock / p.capacity >= s.settings.lowStockPct / 100).map((p) => notif("STAFF", "LOW_STOCK", `${p.name} — মজুত কম`, `/admin/products?product=${p.id}`));
        set({
          orders: s.orders.map((x) => (x.id === id ? next : x)),
          products,
          movements: [...s.movements, ...movements],
          audit: [...s.audit, audit(by, "অর্ডার অনুমোদন", "order", id, { status: "PENDING" }, { status: "AWAITING_PICKUP" })],
          notifications: [notif(c.id, "ORDER_APPROVED", `অর্ডার ${o.orderNo} অনুমোদিত। সংগ্রহের শেষ সময় ${deadline.toLocaleDateString("bn-BD")}`), ...lowNotes, ...s.notifications.filter((n) => n.link !== `/admin/orders?order=${id}`)],
        });
        return next;
      },

      rejectOrder: (id, reason, by) => {
        const s = get();
        const o = s.orders.find((x) => x.id === id);
        if (!o) throw new RuleError("অর্ডার পাওয়া যায়নি");
        if (o.status === "COLLECTED") throw new RuleError("সংগৃহীত অর্ডার বাতিল করা যায় না");
        if (o.status === "CANCELLED") return o;
        if (!reason.trim()) throw new RuleError("বাতিলের কারণ লিখুন");
        const at = nowIso();
        let products = s.products;
        const movements: StockMovement[] = [];
        if (o.status === "AWAITING_PICKUP") {
          products = s.products.map((p) => {
            const it = o.items.find((i) => i.productId === p.id);
            return it ? { ...p, stock: p.stock + it.quantity } : p;
          });
          o.items.forEach((it) => movements.push({ id: uid("m_"), productId: it.productId, type: "RELEASE", quantity: it.quantity, orderId: o.id, actor: by.id, at }));
        }
        const next: Order = { ...o, status: "CANCELLED", rejectReason: reason.trim(), cancelledAt: at, approvedBy: o.approvedBy ?? by.id, approvedAt: o.approvedAt ?? at };
        const c = s.citizens.find((x) => x.id === o.citizenId)!;
        set({
          orders: s.orders.map((x) => (x.id === id ? next : x)),
          products,
          movements: [...s.movements, ...movements],
          audit: [...s.audit, audit(by, "অর্ডার বাতিল", "order", id, { status: o.status }, { status: "CANCELLED", reason })],
          notifications: [notif(c.id, "ORDER_REJECTED", `অর্ডার ${o.orderNo} বাতিল হয়েছে: ${reason}`), ...s.notifications.filter((n) => n.link !== `/admin/orders?order=${id}`)],
        });
        return next;
      },

      confirmCollection: (orderId, code, via) => {
        const s = get();
        const o = s.orders.find((x) => x.id === orderId);
        if (!o) throw new RuleError("অর্ডার পাওয়া যায়নি");
        if (o.status === "COLLECTED") return o; // idempotent
        if (o.status !== "AWAITING_PICKUP") throw new RuleError("এই অর্ডার এখন সংগ্রহের জন্য প্রস্তুত নয়");
        if (o.lockedUntil && new Date(o.lockedUntil).getTime() > Date.now()) throw new RuleError("কয়েকবার ভুল কোড দেওয়া হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন");
        if (o.pickupDeadline && new Date(o.pickupDeadline).getTime() < Date.now()) throw new RuleError("সংগ্রহের সময় পার হয়ে গেছে");
        if (`h_${code}` !== o.pickupCodeHash) {
          const tries = (o.wrongTries ?? 0) + 1;
          const locked = tries >= 5;
          set({ orders: s.orders.map((x) => (x.id === orderId ? { ...x, wrongTries: locked ? 0 : tries, lockedUntil: locked ? new Date(Date.now() + 10 * 60_000).toISOString() : x.lockedUntil } : x)) });
          throw new RuleError(locked ? "৫ বার ভুল কোড। ১০ মিনিট পর আবার চেষ্টা করুন" : `কোড মেলেনি (${bn(5 - tries)} বার চেষ্টা বাকি)`);
        }
        const at = nowIso();
        const movements: StockMovement[] = o.items.map((it) => ({ id: uid("m_"), productId: it.productId, type: "SALE", quantity: it.quantity, orderId: o.id, actor: o.citizenId, at }));
        const next: Order = { ...o, status: "COLLECTED", collectedAt: at, collectedVia: via };
        const c = s.citizens.find((x) => x.id === o.citizenId)!;
        set({
          orders: s.orders.map((x) => (x.id === orderId ? next : x)),
          movements: [...s.movements, ...movements],
          audit: [...s.audit, { id: uid("au_"), actor: c.id, actorName: c.nameBn, action: "সংগ্রহ নিশ্চিত (নাগরিক)", entity: "order", entityId: orderId, at }],
          notifications: [notif("STAFF", "COLLECTED", `${c.nameBn} — ${o.orderNo} সংগ্রহ নিশ্চিত করেছেন`, `/admin/orders?order=${orderId}`), notif(c.id, "COLLECTED", `অর্ডার ${o.orderNo} সংগ্রহ সম্পন্ন। ধন্যবাদ!`), ...s.notifications],
        });
        return next;
      },

      expireOrders: () => {
        const s = get();
        const now = Date.now();
        const expired = s.orders.filter((o) => o.status === "AWAITING_PICKUP" && o.pickupDeadline && new Date(o.pickupDeadline).getTime() < now);
        if (!expired.length) return 0;
        const at = nowIso();
        const products = s.products.map((p) => ({ ...p }));
        const movements: StockMovement[] = [];
        for (const o of expired) {
          for (const it of o.items) {
            const p = products.find((x) => x.id === it.productId)!;
            p.stock += it.quantity;
            movements.push({ id: uid("m_"), productId: it.productId, type: "RELEASE", quantity: it.quantity, orderId: o.id, actor: "SYSTEM", at });
          }
        }
        const ids = new Set(expired.map((o) => o.id));
        set({
          orders: s.orders.map((o) => (ids.has(o.id) ? { ...o, status: "CANCELLED", cancelledAt: at, rejectReason: "সময়সীমার মধ্যে সংগ্রহ হয়নি" } : o)),
          products,
          movements: [...s.movements, ...movements],
          audit: [...s.audit, ...expired.map((o) => ({ id: uid("au_"), actor: "SYSTEM", actorName: "সিস্টেম", action: "মেয়াদোত্তীর্ণ অর্ডার বাতিল", entity: "order" as const, entityId: o.id, at }))],
        });
        return expired.length;
      },

      upsertProduct: (p, by) => {
        const s = get();
        const existing = p.id ? s.products.find((x) => x.id === p.id) : undefined;
        const merged: Product = {
          id: existing?.id ?? uid("pr_"),
          name: p.name ?? existing?.name ?? "",
          category: p.category ?? existing?.category ?? "GROCERY",
          unit: p.unit ?? existing?.unit ?? "KG",
          marketPrice: p.marketPrice ?? existing?.marketPrice ?? 0,
          municipalPrice: p.municipalPrice ?? existing?.municipalPrice ?? 0,
          stock: p.stock ?? existing?.stock ?? 0,
          capacity: p.capacity ?? existing?.capacity ?? 0,
          perFamilyLimit: p.perFamilyLimit ?? existing?.perFamilyLimit ?? 1,
          active: p.active ?? existing?.active ?? true,
          createdAt: existing?.createdAt ?? nowIso(),
        };
        if (!merged.name.trim()) throw new RuleError("পণ্যের নাম দিন");
        if (merged.municipalPrice >= merged.marketPrice) throw new RuleError("পৌরসভার দাম বাজার দামের চেয়ে কম হতে হবে");
        if (merged.stock < 0 || merged.capacity <= 0) throw new RuleError("মজুত ও ধারণক্ষমতা সঠিক নয়");
        if (merged.stock > merged.capacity) throw new RuleError("মজুত ধারণক্ষমতার বেশি হতে পারে না");
        const at = nowIso();
        const movements: StockMovement[] = [];
        if (existing && existing.stock !== merged.stock) movements.push({ id: uid("m_"), productId: merged.id, type: "ADJUST", quantity: merged.stock - existing.stock, actor: by.id, at });
        set({
          products: existing ? s.products.map((x) => (x.id === merged.id ? merged : x)) : [...s.products, merged],
          movements: [...s.movements, ...movements],
          audit: [...s.audit, audit(by, existing ? "পণ্য সম্পাদনা" : "নতুন পণ্য", "product", merged.id, existing ? { marketPrice: existing.marketPrice, municipalPrice: existing.municipalPrice, stock: existing.stock } : undefined, { marketPrice: merged.marketPrice, municipalPrice: merged.municipalPrice, stock: merged.stock })],
        });
        return merged;
      },

      addStock: (productId, qty, by) => {
        const s = get();
        const p = s.products.find((x) => x.id === productId);
        if (!p) throw new RuleError("পণ্য পাওয়া যায়নি");
        const stock = Math.min(p.capacity, p.stock + qty);
        const next = { ...p, stock };
        set({
          products: s.products.map((x) => (x.id === productId ? next : x)),
          movements: [...s.movements, { id: uid("m_"), productId, type: "RESTOCK", quantity: stock - p.stock, actor: by.id, at: nowIso() }],
          audit: [...s.audit, audit(by, "মজুত যোগ", "product", productId, { stock: p.stock }, { stock })],
        });
        return next;
      },

      toggleProduct: (productId, by) => {
        const s = get();
        const p = s.products.find((x) => x.id === productId);
        if (!p) throw new RuleError("পণ্য পাওয়া যায়নি");
        const next = { ...p, active: !p.active };
        set({
          products: s.products.map((x) => (x.id === productId ? next : x)),
          audit: [...s.audit, audit(by, next.active ? "পণ্য চালু" : "পণ্য বন্ধ", "product", productId, { active: p.active }, { active: next.active })],
        });
        return next;
      },

      markNotificationRead: (id) => set({ notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }),
      markAllRead: () => set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
      resetSeed: () => set({ ...buildSeed(), seedVersion: SEED_VERSION }),
    }),
    {
      name: "kp-ration-data",
      version: SEED_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        users: s.users,
        wards: s.wards,
        points: s.points,
        products: s.products,
        citizens: s.citizens,
        orders: s.orders,
        movements: s.movements,
        audit: s.audit,
        notifications: s.notifications,
        settings: s.settings,
        counters: s.counters,
        seedVersion: s.seedVersion,
      }),
      migrate: () => ({ ...buildSeed(), seedVersion: SEED_VERSION }) as unknown as DataState,
    },
  ),
);

export type { User };
