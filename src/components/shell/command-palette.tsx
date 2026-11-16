"use client";
import { Command } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { create } from "zustand";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserRound, ClipboardList, CornerDownLeft, Moon, Sun } from "lucide-react";
import { NAV } from "./nav";
import { useAuth, can } from "@/store/auth";
import { useData } from "@/store/data";
import { useUI } from "@/store/ui";
import { bn, en } from "@/lib/bn";
import { CITIZEN_STATUS_LABEL, ORDER_STATUS_LABEL } from "@/lib/types";

interface PaletteState {
  open: boolean;
  setOpen: (o: boolean) => void;
}
export const useCommandPalette = create<PaletteState>((set) => ({ open: false, setOpen: (open) => set({ open }) }));

export function CommandPalette() {
  const open = useCommandPalette((s) => s.open);
  const setOpen = useCommandPalette((s) => s.setOpen);
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const citizens = useData((s) => s.citizens);
  const orders = useData((s) => s.orders);
  const toggleTheme = useUI((s) => s.toggleTheme);
  const theme = useUI((s) => s.theme);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useCommandPalette.getState().open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) setQ("");
  };

  const qn = q.trim();
  const qEn = en(qn).toLowerCase();
  const citizenHits = useMemo(() => {
    if (qn.length < 2) return [];
    return citizens.filter((c) => c.nameBn.includes(qn) || c.nameEn.toLowerCase().includes(qEn) || c.mobile.includes(qEn) || (c.rationCardNo ?? "").toLowerCase().includes(qEn) || c.nationalId.includes(qEn)).slice(0, 6);
  }, [qn, qEn, citizens]);
  const orderHits = useMemo(() => {
    if (qn.length < 2) return [];
    return orders
      .filter((o) => o.orderNo.toLowerCase().includes(qEn))
      .slice(-5)
      .reverse();
  }, [qn, qEn, orders]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[rgba(10,17,20,0.3)] backdrop-blur-[3px] data-[state=open]:animate-[fade-in_180ms_var(--ease-out)]" />
        <DialogPrimitive.Content className="glass-strong fixed left-1/2 top-[14vh] z-[71] w-[min(92vw,640px)] -translate-x-1/2 overflow-hidden rounded-[22px] p-0 outline-none data-[state=open]:animate-[page-in_220ms_var(--ease-out)]">
          <DialogPrimitive.Title className="sr-only">কমান্ড প্যালেট</DialogPrimitive.Title>
          <Command label="কমান্ড প্যালেট" shouldFilter={false} loop>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-5 w-5 text-ink-3" strokeWidth={1.8} />
              <Command.Input value={q} onValueChange={setQ} placeholder="পেজে যান, নাগরিক বা অর্ডার খুঁজুন…" className="h-14 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-4 focus-visible:outline-none" />
              <kbd className="kbd">Esc</kbd>
            </div>
            <Command.List className="max-h-[420px] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-8 text-center text-[13.5px] text-ink-3">কিছু পাওয়া যায়নি</Command.Empty>

              {citizenHits.length > 0 && (
                <Command.Group heading="নাগরিক" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-petrol">
                  {citizenHits.map((c) => (
                    <Command.Item key={c.id} value={`c-${c.id}`} onSelect={() => go(`/admin?citizen=${c.id}`)} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-ink-2 data-[selected=true]:bg-copper-soft data-[selected=true]:text-ink">
                      <UserRound className="h-4.5 w-4.5 shrink-0 text-ink-3" strokeWidth={1.8} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{c.nameBn}</span>
                        <span className="num block text-[12px] text-ink-3">{c.rationCardNo ? bn(c.rationCardNo) : CITIZEN_STATUS_LABEL[c.status]} · {bn(c.mobile)}</span>
                      </span>
                      <CornerDownLeft className="h-3.5 w-3.5 opacity-0 data-[selected=true]:opacity-60" />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {orderHits.length > 0 && (
                <Command.Group heading="অর্ডার" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-petrol">
                  {orderHits.map((o) => (
                    <Command.Item key={o.id} value={`o-${o.id}`} onSelect={() => go(`/admin/orders?order=${o.id}`)} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-ink-2 data-[selected=true]:bg-copper-soft data-[selected=true]:text-ink">
                      <ClipboardList className="h-4.5 w-4.5 shrink-0 text-ink-3" strokeWidth={1.8} />
                      <span className="min-w-0 flex-1">
                        <span className="num block font-medium">{bn(o.orderNo)}</span>
                        <span className="block text-[12px] text-ink-3">{ORDER_STATUS_LABEL[o.status]}</span>
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              <Command.Group heading="পেজ" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-petrol">
                {NAV.filter((n) => can(user?.role, n.perm))
                  .filter((n) => !qn || n.label.includes(qn) || (n.keywords ?? "").includes(qEn))
                  .map((n) => (
                    <Command.Item key={n.href} value={`p-${n.href}`} onSelect={() => go(n.href)} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-ink-2 data-[selected=true]:bg-copper-soft data-[selected=true]:text-ink">
                      <n.icon className="h-4.5 w-4.5 shrink-0 text-ink-3" strokeWidth={1.8} />
                      <span className="flex-1">{n.label}</span>
                    </Command.Item>
                  ))}
                <Command.Item value="theme" onSelect={() => { toggleTheme(); setOpen(false); }} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-ink-2 data-[selected=true]:bg-copper-soft data-[selected=true]:text-ink">
                  {theme === "dark" ? <Sun className="h-4.5 w-4.5 shrink-0 text-ink-3" strokeWidth={1.8} /> : <Moon className="h-4.5 w-4.5 shrink-0 text-ink-3" strokeWidth={1.8} />}
                  <span className="flex-1">{theme === "dark" ? "লাইট মোডে যান" : "ডার্ক মোডে যান"}</span>
                </Command.Item>
              </Command.Group>
            </Command.List>
            <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-[12px] text-ink-3">
              <span className="flex items-center gap-1.5"><kbd className="kbd">↑↓</kbd> বেছে নিন</span>
              <span className="flex items-center gap-1.5"><kbd className="kbd">↵</kbd> খুলুন</span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
