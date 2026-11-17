"use client";
import { useEffect, useState } from "react";
import { bn } from "@/lib/bn";
import { cn } from "@/lib/utils";

/** "২ দিন ৩ ঘণ্টা বাকি" — ticks every minute. */
export function useCountdown(until?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  if (!until) return { text: "", ms: 0, urgent: false };
  const ms = new Date(until).getTime() - now;
  if (ms <= 0) return { text: "সময় শেষ", ms: 0, urgent: true };
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const text = d > 0 ? `${bn(d)} দিন ${bn(h)} ঘণ্টা বাকি` : h > 0 ? `${bn(h)} ঘণ্টা ${bn(m)} মিনিট বাকি` : `${bn(m)} মিনিট বাকি`;
  return { text, ms, urgent: ms < 12 * 3_600_000 };
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return "শুভ রাত্রি";
  if (h < 12) return "শুভ সকাল";
  if (h < 16) return "শুভ দুপুর";
  if (h < 19) return "শুভ বিকেল";
  return "শুভ সন্ধ্যা";
}

/** Circular progress ring. value 0..1 */
export function Ring({ value, size = 44, stroke = 5, className, track = "var(--line-strong)", color = "var(--sage-2)", children }: { value: number; size?: number; stroke?: number; className?: string; track?: string; color?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={cn("relative grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} className="transition-[stroke-dashoffset] duration-1000 ease-[var(--ease-out)]" />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
    </div>
  );
}

/** Staggered entrance for lists. */
export function Stagger({ i, children, className }: { i: number; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("animate-[rise_620ms_var(--ease-out)_both]", className)} style={{ animationDelay: `${Math.min(i, 10) * 55}ms` }}>
      {children}
    </div>
  );
}
