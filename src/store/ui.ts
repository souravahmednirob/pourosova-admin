"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState, useSyncExternalStore } from "react";

export const SIDEBAR_MIN = 200;
export const SIDEBAR_MAX = 340;
export const SIDEBAR_DEFAULT = 248;
export const RAIL = 76;
export const SNAP_BELOW = 150;
export const DRAWER_MIN = 360;
export const DRAWER_MAX = 960;
export const DRAWER_DEFAULT = 440;

interface UIState {
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  drawerWidth: number;
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSidebarWidth: (w: number) => void;
  setDrawerWidth: (w: number) => void;
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      theme: "light",
      sidebarCollapsed: false,
      sidebarWidth: SIDEBAR_DEFAULT,
      drawerWidth: DRAWER_DEFAULT,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setSidebarWidth: (w) => set({ sidebarWidth: Math.round(w) }),
      setDrawerWidth: (w) => set({ drawerWidth: Math.round(w) }),
    }),
    { name: "kp-ration-ui", storage: createJSONStorage(() => localStorage) },
  ),
);

/** True once zustand-persist has rehydrated on the client. */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => {
    // Both stores hydrate synchronously from localStorage on mount; a tick is enough.
    const t = requestAnimationFrame(() => setH(true));
    return () => cancelAnimationFrame(t);
  }, []);
  return h;
}

const RM_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeRM(cb: () => void) {
  const mq = window.matchMedia(RM_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeRM,
    () => window.matchMedia(RM_QUERY).matches,
    () => false,
  );
}
