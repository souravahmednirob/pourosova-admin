"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useUI, DRAWER_MIN, DRAWER_MAX, DRAWER_DEFAULT } from "@/store/ui";

export function Drawer({ open, onClose, title, children, footer, width: forcedWidth }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; width?: number }) {
  const width = useUI((s) => s.drawerWidth);
  const setWidth = useUI((s) => s.setDrawerWidth);
  const [dragging, setDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const live = useRef(width);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setDragging(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      const el = panelRef.current;
      const move = (ev: PointerEvent) => {
        const w = Math.min(DRAWER_MAX, Math.max(DRAWER_MIN, window.innerWidth - ev.clientX));
        const cl = Math.min(w, window.innerWidth - 24);
        live.current = cl;
        if (el) el.style.width = `${cl}px`;
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setDragging(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setWidth(live.current);
        if (el) el.style.width = "";
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [setWidth],
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[50] bg-[rgba(10,17,20,0.28)] backdrop-blur-[2px] data-[state=open]:animate-[fade-in_220ms_var(--ease-out)]" />
        <DialogPrimitive.Content
          ref={panelRef}
          style={{ width: `min(${forcedWidth ?? width}px, calc(100vw - 24px))` }}
          className={cn("glass-strong hairline fixed bottom-3 right-3 top-3 z-[51] flex flex-col overflow-hidden rounded-[26px] outline-none data-[state=open]:animate-[drawer-in_420ms_var(--ease-spring)]", dragging && "select-none")}
        >
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="ড্রয়ারের প্রস্থ বদলান"
            title="টেনে প্রস্থ বদলান · ডাবল-ক্লিকে রিসেট"
            onPointerDown={onPointerDown}
            onDoubleClick={() => setWidth(DRAWER_DEFAULT)}
            className={cn("absolute left-0 top-0 z-10 h-full w-3 cursor-col-resize touch-none after:absolute after:left-0 after:top-0 after:h-full after:w-[2px] after:bg-transparent after:transition-colors hover:after:bg-copper", dragging && "after:bg-copper")}
          />
          <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
            <DialogPrimitive.Title className="text-[17px] font-semibold text-ink">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close className="grid h-9 w-9 place-items-center rounded-xl text-ink-3 transition-colors hover:bg-sunken hover:text-ink" aria-label="বন্ধ">
              <X className="h-5 w-5" strokeWidth={1.8} />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="border-t border-line px-6 py-4">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
