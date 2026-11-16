"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Role, User } from "@/lib/types";
import { useData } from "./data";

export type Permission =
  | "citizen.view"
  | "citizen.register"
  | "citizen.approve"
  | "order.view"
  | "order.approve"
  | "product.view"
  | "product.edit"
  | "product.price"
  | "report.view"
  | "report.export"
  | "settings.view"
  | "settings.edit"
  | "audit.view"
  | "users.manage";

const ALL: Permission[] = ["citizen.view", "citizen.register", "citizen.approve", "order.view", "order.approve", "product.view", "product.edit", "product.price", "report.view", "report.export", "settings.view", "settings.edit", "audit.view", "users.manage"];

export const ROLE_PERMS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ALL,
  ADMIN: ["citizen.view", "citizen.register", "citizen.approve", "order.view", "order.approve", "product.view", "product.edit", "product.price", "report.view", "report.export", "settings.view", "audit.view"],
  DIST_OFFICER: ["order.view", "product.view", "citizen.view"],
  REPORT_VIEWER: ["report.view", "report.export", "citizen.view"],
  FIELD_AGENT: ["citizen.register"],
  CITIZEN: [],
};

export function can(role: Role | undefined, p: Permission) {
  return !!role && ROLE_PERMS[role].includes(p);
}

interface AuthState {
  user: Omit<User, "password"> | null;
  lastActivity: number;
  login: (email: string, password: string) => Promise<Omit<User, "password">>;
  logout: () => void;
  touch: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      lastActivity: Date.now(),
      login: async (email, password) => {
        await new Promise((r) => setTimeout(r, 900));
        const u = useData.getState().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!u || u.password !== password) throw new Error("ইমেইল বা পাসওয়ার্ড সঠিক নয়");
        if (!u.active) throw new Error("এই অ্যাকাউন্ট বন্ধ আছে");
        if (u.role === "FIELD_AGENT" || u.role === "CITIZEN") throw new Error("এই অ্যাকাউন্ট দিয়ে ওয়েব পোর্টালে প্রবেশ করা যায় না");
        const { password: _pw, ...safe } = u;
        void _pw;
        const user = { ...safe, lastLogin: new Date().toISOString() };
        set({ user, lastActivity: Date.now() });
        return user;
      },
      logout: () => set({ user: null }),
      touch: () => set({ lastActivity: Date.now() }),
    }),
    { name: "kp-ration-auth", storage: createJSONStorage(() => localStorage) },
  ),
);
