"use client";
import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { QRCodeSVG } from "qrcode.react";
import { ChevronsRight, Check, Sun, X } from "lucide-react";
import { bn } from "@/lib/bn";
import { cn } from "@/lib/utils";
import { haptic } from "./product-sheet";

/** QR inside a slowly rotating luminous ring with a scan line sweeping across. */
export function LiveQR({ value, size = 168 }: { value: string; size?: number }) {
  return (
    <div className="relative mx-auto w-fit">
      {/* soft static glow */}
      <div aria-hidden className="absolute -inset-5 rounded-[36px] bg-[conic-gradient(from_200deg,#e8ab86,#7cbccb,#8cc39a,#e8ab86)] opacity-30 blur-2xl" />
      {/* animated gradient border: a spinning conic square clipped by the rounded frame */}
      <div className="relative overflow-hidden rounded-[26px] p-[3px]">
        <div aria-hidden className="absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,#e8ab86_70deg,#7cbccb_150deg,transparent_200deg,#8cc39a_290deg,transparent_360deg)] animate-[spin_4s_linear_infinite] motion-reduce:animate-none" />
        <div className="relative overflow-hidden rounded-[23px] bg-white p-3.5">
          <QRCodeSVG value={value} size={size} level="M" fgColor="#0f1f24" />
          <div aria-hidden className="pointer-events-none absolute inset-x-3 h-10 bg-gradient-to-b from-transparent via-[#7cbccb]/35 to-transparent animate-[scan_2.6s_ease-in-out_infinite] motion-reduce:hidden" />
        </div>
      </div>
    </div>
  );
}

/** Ring that empties as the pickup deadline approaches. */
export function DeadlineRing({ start, end, children }: { start: string; end: string; children: React.ReactNode }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const s = new Date(start).getTime(), e = new Date(end).getTime();
  const left = Math.max(0, Math.min(1, (e - now) / Math.max(1, e - s)));
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3">
      <svg width="64" height="64" className="-rotate-90 shrink-0" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={left < 0.2 ? "#ffb3a7" : "#e8ab86"} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - left)} className="transition-[stroke-dashoffset] duration-1000" />
      </svg>
      <div>{children}</div>
    </div>
  );
}

/** Slide-to-confirm. Keyboard: focus the thumb and press Enter. */
export function SlideToConfirm({ label, onDone, disabled, hint }: { label: string; onDone: () => void; disabled?: boolean; hint?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [drag, setDrag] = useState(false);
  const start = useRef(0);
  const [w, setW] = useState(300);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const max = () => w - 60;

  const finish = () => {
    haptic(20);
    setX(max());
    setTimeout(() => {
      onDone();
      setX(0);
    }, 180);
  };

  return (
    <div ref={track} className={cn("relative h-[64px] select-none overflow-hidden rounded-full bg-[#121a1c] p-1.5 transition-opacity dark:bg-[#ece7de]", disabled && "opacity-60")}>
      <div aria-hidden className="absolute inset-y-1.5 left-1.5 rounded-full bg-gradient-to-r from-[#3f7050] to-[#5c9a6e]" style={{ width: x + 52, transition: drag ? "none" : "width .35s var(--ease-spring)" }} />
      <div className="pointer-events-none absolute inset-0 grid place-items-center pl-12 text-[15.5px] font-bold text-white/90 dark:text-[#121a1c]">
        <span className="bg-[linear-gradient(90deg,rgba(255,255,255,.6)_30%,#fff_50%,rgba(255,255,255,.6)_70%)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[text-shimmer_2.4s_linear_infinite] motion-reduce:animate-none dark:bg-[linear-gradient(90deg,rgba(18,26,28,.6)_30%,#121a1c_50%,rgba(18,26,28,.6)_70%)]">{disabled && hint ? hint : label}</span>
      </div>
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); finish(); } }}
        onPointerDown={(e) => {
          if (disabled) return;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          start.current = e.clientX - x;
          setDrag(true);
        }}
        onPointerMove={(e) => {
          if (!drag) return;
          setX(Math.max(0, Math.min(max(), e.clientX - start.current)));
        }}
        onPointerUp={() => {
          setDrag(false);
          if (x > max() * 0.82) finish();
          else setX(0);
        }}
        className="relative z-10 grid h-[52px] w-[52px] touch-none place-items-center rounded-full bg-white text-[#3f7050] shadow-[0_6px_16px_-6px_rgba(0,0,0,.5)] outline-none focus-visible:ring-4 focus-visible:ring-[#8cc39a]/50"
        style={{ transform: `translateX(${x}px)`, transition: drag ? "none" : "transform .35s var(--ease-spring)" }}
      >
        {x > max() * 0.82 ? <Check className="h-6 w-6" strokeWidth={3} /> : <ChevronsRight className="h-6 w-6" strokeWidth={2.4} />}
      </button>
    </div>
  );
}

/** Full-screen, high-contrast ticket to show at the counter; keeps the screen awake where supported. */
export function FullscreenTicket({ open, onOpenChange, qr, code, orderNo, name }: { open: boolean; onOpenChange: (o: boolean) => void; qr: string; code: string; orderNo: string; name: string }) {
  useEffect(() => {
    if (!open) return;
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, [open]);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-white px-6 text-[#0f1f24] outline-none data-[state=open]:animate-[fade-in_250ms_var(--ease-out)]" onClick={() => onOpenChange(false)}>
          <DialogPrimitive.Title className="text-[15px] font-semibold uppercase tracking-[0.2em] text-[#6b7a7d]">সংগ্রহের টিকিট</DialogPrimitive.Title>
          <DialogPrimitive.Description className="num mt-1 text-[16px] font-semibold">{bn(orderNo)} · {name}</DialogPrimitive.Description>
          <div className="mt-6"><QRCodeSVG value={qr} size={Math.min(300, typeof window !== "undefined" ? window.innerWidth - 80 : 300)} level="M" fgColor="#0f1f24" /></div>
          <div className="num mt-8 flex gap-2">
            {code.split("").map((d, i) => <span key={i} className={cn("grid h-16 w-12 place-items-center rounded-2xl bg-[#f2efe9] text-[36px] font-bold", i === 2 && "mr-3")}>{bn(d)}</span>)}
          </div>
          <div className="mt-8 flex items-center gap-2 text-[13.5px] text-[#6b7a7d]"><Sun className="h-4 w-4" /> স্ক্যানের সুবিধার জন্য স্ক্রিনের আলো বাড়িয়ে দিন</div>
          <button type="button" className="mt-6 flex items-center gap-1.5 rounded-full border border-[#d6d0c4] px-5 py-2.5 text-[14px] font-semibold"><X className="h-4 w-4" /> বন্ধ করুন</button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
