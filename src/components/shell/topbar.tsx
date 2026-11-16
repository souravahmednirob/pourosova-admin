"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import { Bell, LogOut, Moon, PanelLeftClose, PanelLeftOpen, Search, Sun, UserRound, Check, Settings as SettingsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { bn, fmtDateTime } from "@/lib/bn";
import { useUI } from "@/store/ui";
import { useAuth } from "@/store/auth";
import { useData } from "@/store/data";
import { ROLE_LABEL } from "@/lib/types";
import { Tip } from "@/components/ui/primitives";
import { useCommandPalette } from "./command-palette";

const iconBtn = "grid h-10 w-10 place-items-center rounded-[12px] border border-transparent text-ink-2 transition-[background-color,border-color,color,transform] duration-200 ease-[var(--ease-out)] hover:border-line-strong hover:bg-surface-solid hover:text-ink active:scale-95";

export function Topbar() {
  const router = useRouter();
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const setCollapsed = useUI((s) => s.setSidebarCollapsed);
  const theme = useUI((s) => s.theme);
  const toggleTheme = useUI((s) => s.toggleTheme);
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const allNotifications = useData((s) => s.notifications);
  const notifications = useMemo(() => allNotifications.filter((n) => n.target === "STAFF"), [allNotifications]);
  const markRead = useData((s) => s.markNotificationRead);
  const markAll = useData((s) => s.markAllRead);
  const openPalette = useCommandPalette((s) => s.setOpen);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="glass-strong sticky top-0 z-20 flex h-[var(--topbar-h)] items-center gap-3 rounded-none border-x-0 border-t-0 px-4">
      <Tip content={collapsed ? "মেনু খুলুন" : "মেনু ছোট করুন"} side="bottom">
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("kp-sidebar-touched", "1");
            setCollapsed(!collapsed);
          }}
          className={cn(iconBtn, "border-line-strong bg-surface-solid")}
          aria-label={collapsed ? "মেনু খুলুন" : "মেনু ছোট করুন"}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" strokeWidth={1.8} /> : <PanelLeftClose className="h-5 w-5" strokeWidth={1.8} />}
        </button>
      </Tip>

      <button
        type="button"
        onClick={() => openPalette(true)}
        className="ctl group hidden h-10 w-full max-w-[460px] items-center gap-2.5 text-left text-ink-3 hover:text-ink-2 sm:flex"
        aria-label="খুঁজুন বা কমান্ড প্যালেট খুলুন"
      >
        <Search className="h-4.5 w-4.5 shrink-0" strokeWidth={1.8} />
        <span className="flex-1 truncate text-[13.5px]">নাগরিক, অর্ডার বা পেজ খুঁজুন…</span>
        <span className="hidden items-center gap-1 sm:flex">
          <kbd className="kbd">Ctrl</kbd>
          <kbd className="kbd">K</kbd>
        </span>
      </button>

      <button type="button" onClick={() => openPalette(true)} className={cn(iconBtn, "sm:hidden")} aria-label="খুঁজুন">
        <Search className="h-5 w-5" strokeWidth={1.8} />
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Tip content={theme === "dark" ? "লাইট মোড" : "ডার্ক মোড"} side="bottom">
          <button type="button" onClick={toggleTheme} className={iconBtn} aria-label="থিম বদলান">
            <span className="relative block h-5 w-5">
              <Sun className={cn("absolute inset-0 h-5 w-5 transition-[transform,opacity] duration-300 ease-[var(--ease-spring)]", theme === "dark" ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100")} strokeWidth={1.8} />
              <Moon className={cn("absolute inset-0 h-5 w-5 transition-[transform,opacity] duration-300 ease-[var(--ease-spring)]", theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0")} strokeWidth={1.8} />
            </span>
          </button>
        </Tip>

        <Popover.Root>
          <Tip content="বিজ্ঞপ্তি" side="bottom">
            <Popover.Trigger asChild>
              <button type="button" className={cn(iconBtn, "relative")} aria-label={`বিজ্ঞপ্তি, ${bn(unread)}টি নতুন`}>
                <Bell className="h-5 w-5" strokeWidth={1.8} />
                {unread > 0 && <span className="live-dot absolute right-2 top-2" />}
              </button>
            </Popover.Trigger>
          </Tip>
          <Popover.Portal>
            <Popover.Content align="end" sideOffset={10} className="glass-strong z-[60] w-[360px] rounded-[18px] p-2 outline-none data-[state=open]:animate-[page-in_220ms_var(--ease-out)]">
              <div className="flex items-center justify-between px-2.5 py-2">
                <div className="text-[14px] font-semibold text-ink">বিজ্ঞপ্তি</div>
                {unread > 0 && (
                  <button type="button" onClick={markAll} className="text-[12.5px] font-medium text-copper-deep hover:underline dark:text-copper">
                    সব পড়া হয়েছে
                  </button>
                )}
              </div>
              <div className="max-h-[380px] overflow-y-auto">
                {notifications.length === 0 && <div className="px-3 py-8 text-center text-[13px] text-ink-3">কোনো বিজ্ঞপ্তি নেই</div>}
                {notifications.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markRead(n.id);
                      if (n.link) router.push(n.link);
                    }}
                    className={cn("flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-sunken", !n.read && "bg-copper-soft/40")}
                  >
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-ink-4/40" : "bg-copper")} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink">{n.text}</span>
                      <span className="block text-[12px] text-ink-3">{fmtDateTime(n.at)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className="ml-1 flex h-10 items-center gap-2.5 rounded-[12px] border border-transparent pl-1 pr-2.5 transition-colors hover:border-line-strong hover:bg-surface-solid" aria-label="প্রোফাইল মেনু">
              <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-petrol-soft text-[13px] font-bold text-petrol">{user?.name?.slice(0, 1)}</span>
              <span className="hidden min-w-0 text-left leading-tight md:block">
                <span className="block max-w-[150px] truncate text-[13px] font-semibold text-ink">{user?.name}</span>
                <span className="block text-[11.5px] text-ink-3">{user ? ROLE_LABEL[user.role] : ""}</span>
              </span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={10} className="glass-strong z-[60] w-[240px] rounded-[16px] p-1.5 outline-none data-[state=open]:animate-[page-in_220ms_var(--ease-out)]">
              <div className="px-3 py-2.5">
                <div className="text-[13.5px] font-semibold text-ink">{user?.name}</div>
                <div className="truncate text-[12px] text-ink-3">{user?.email}</div>
              </div>
              <DropdownMenu.Separator className="divider my-1" />
              <DropdownMenu.Item onSelect={() => router.push("/admin/settings")} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] text-ink-2 outline-none data-[highlighted]:bg-sunken data-[highlighted]:text-ink">
                <SettingsIcon className="h-4 w-4" strokeWidth={1.8} /> সেটিংস
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => router.push("/admin/settings")} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] text-ink-2 outline-none data-[highlighted]:bg-sunken data-[highlighted]:text-ink">
                <UserRound className="h-4 w-4" strokeWidth={1.8} /> আমার প্রোফাইল
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={toggleTheme} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] text-ink-2 outline-none data-[highlighted]:bg-sunken data-[highlighted]:text-ink">
                {theme === "dark" ? <Sun className="h-4 w-4" strokeWidth={1.8} /> : <Moon className="h-4 w-4" strokeWidth={1.8} />} {theme === "dark" ? "লাইট মোড" : "ডার্ক মোড"}
                <Check className="ml-auto h-3.5 w-3.5 opacity-0" />
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="divider my-1" />
              <DropdownMenu.Item
                onSelect={() => {
                  logout();
                  router.replace("/admin/login");
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] text-brick outline-none data-[highlighted]:bg-brick-soft"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.8} /> লগ আউট
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
