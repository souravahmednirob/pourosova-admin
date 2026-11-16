"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { bn } from "@/lib/bn";
import { useUI, SIDEBAR_MIN, SIDEBAR_MAX, RAIL, SNAP_BELOW, SIDEBAR_DEFAULT } from "@/store/ui";
import { useAuth, can } from "@/store/auth";
import { useData } from "@/store/data";
import { NAV, isActive } from "./nav";
import { LogoMark } from "./logo";
import { Tip } from "@/components/ui/primitives";
import { ROLE_LABEL } from "@/lib/types";

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const width = useUI((s) => s.sidebarWidth);
  const setCollapsed = useUI((s) => s.setSidebarCollapsed);
  const setWidth = useUI((s) => s.setSidebarWidth);
  const user = useAuth((s) => s.user);
  const pendingCitizens = useData((s) => s.citizens.filter((c) => c.status === "PENDING").length);
  const pendingOrders = useData((s) => s.orders.filter((o) => o.status === "PENDING").length);

  const [dragging, setDragging] = useState(false);
  const liveWidth = useRef(width);
  const asideRef = useRef<HTMLElement>(null);

  // Start as rail on phones
  useEffect(() => {
    if (window.innerWidth < 768 && !localStorage.getItem("kp-sidebar-touched")) setCollapsed(true);
  }, [setCollapsed]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      const el = asideRef.current;
      const startCollapsed = collapsed;
      const move = (ev: PointerEvent) => {
        const w = ev.clientX;
        if (!el) return;
        if (w < SNAP_BELOW) {
          el.style.width = `${RAIL}px`;
          liveWidth.current = RAIL;
        } else {
          const cl = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, w));
          el.style.width = `${cl}px`;
          liveWidth.current = cl;
        }
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setDragging(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        localStorage.setItem("kp-sidebar-touched", "1");
        if (liveWidth.current === RAIL) {
          setCollapsed(true);
        } else {
          if (startCollapsed) setCollapsed(false);
          setWidth(liveWidth.current);
        }
        if (el) el.style.width = "";
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [collapsed, setCollapsed, setWidth],
  );

  const badgeCount = (b?: "pendingCitizens" | "pendingOrders") => (b === "pendingCitizens" ? pendingCitizens : b === "pendingOrders" ? pendingOrders : 0);

  return (
    <aside
      ref={asideRef}
      className={cn("glass-strong relative z-30 flex h-full shrink-0 flex-col border-y-0 border-l-0 rounded-none", !dragging && "transition-[width] duration-300 ease-[var(--ease-out)]")}
      style={{ width: collapsed ? RAIL : width }}
      aria-label="প্রধান মেনু"
    >
      {/* Brand */}
      <div className={cn("flex items-center gap-3 px-4", collapsed ? "h-[var(--topbar-h)] justify-center px-0" : "h-[var(--topbar-h)]")}>
        <LogoMark size={collapsed ? 36 : 40} />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[15px] font-bold text-ink">কালিয়াকৈর পৌরসভা</div>
            <div className="truncate text-[12px] font-medium text-copper-deep dark:text-copper">নাগরিক রেশন সেবা</div>
          </div>
        )}
      </div>
      <div className="divider mx-3" />

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
        <ul className="flex flex-col gap-1">
          {NAV.filter((n) => can(user?.role, n.perm)).map((item) => {
            const active = isActive(pathname, item.href);
            const count = badgeCount(item.badge);
            const Icon = item.icon;
            const link = (
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-11 items-center gap-3 rounded-[14px] px-3 text-[14px] font-medium transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out)]",
                  collapsed && "justify-center px-0",
                  active ? "grad-copper text-white shadow-[0_8px_20px_-8px_var(--glow),0_0_0_1px_rgba(255,255,255,.12)_inset]" : "text-ink-2 hover:bg-sunken hover:text-ink",
                )}
              >
                <Icon className={cn("h-[20px] w-[20px] shrink-0", active ? "text-white" : "text-ink-3 group-hover:text-ink")} strokeWidth={1.8} />
                {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                {!collapsed && count > 0 && (
                  <span className={cn("num inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-1.5 text-[11.5px] font-semibold", active ? "bg-white/20 text-white" : "bg-brick-soft text-brick")}>{bn(count)}</span>
                )}
                {collapsed && count > 0 && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brick-2 ring-2 ring-[var(--surface-solid)]" aria-label={`${bn(count)}টি অপেক্ষমাণ`} />}
              </Link>
            );
            return (
              <li key={item.href}>
                {item.divider && <div className="divider my-2 mx-1" />}
                {collapsed ? (
                  <Tip content={count > 0 ? `${item.label} · ${bn(count)}` : item.label}>{link}</Tip>
                ) : (
                  link
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User foot */}
      <div className="divider mx-3" />
      <div className={cn("flex items-center gap-3 p-3", collapsed && "justify-center")}>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-petrol-soft text-[13px] font-bold text-petrol">{user?.name?.slice(0, 1) ?? "—"}</div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] font-semibold text-ink">{user?.name}</div>
            <div className="truncate text-[12px] text-ink-3">{user ? ROLE_LABEL[user.role] : ""}</div>
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="সাইডবারের প্রস্থ বদলান"
        title="টেনে প্রস্থ বদলান · ডাবল-ক্লিকে খোলা/বন্ধ"
        onPointerDown={onPointerDown}
        onDoubleClick={() => {
          localStorage.setItem("kp-sidebar-touched", "1");
          if (collapsed) {
            setCollapsed(false);
            if (width < SIDEBAR_MIN) setWidth(SIDEBAR_DEFAULT);
          } else setCollapsed(true);
        }}
        className={cn("group absolute -right-1.5 top-0 z-40 h-full w-3 cursor-col-resize touch-none", "after:absolute after:left-1/2 after:top-0 after:h-full after:w-px after:-translate-x-1/2 after:bg-transparent after:transition-colors hover:after:bg-copper", dragging && "after:bg-copper")}
      />
    </aside>
  );
}
