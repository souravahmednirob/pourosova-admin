"use client";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { groupLakh } from "@/lib/bn";
import { useReducedMotion } from "@/store/ui";
import type { Tone } from "./primitives";

const toneBorder: Record<Tone, string> = {
  petrol: "after:bg-petrol",
  copper: "after:bg-copper",
  sage: "after:bg-sage-2",
  ochre: "after:bg-ochre-2",
  brick: "after:bg-brick-2",
  neutral: "after:bg-ink-4",
};
const toneTile: Record<Tone, string> = {
  petrol: "bg-petrol-soft text-petrol",
  copper: "bg-copper-soft text-copper-deep dark:text-copper",
  sage: "bg-sage-soft text-sage",
  ochre: "bg-ochre-soft text-ochre",
  brick: "bg-brick-soft text-brick",
  neutral: "bg-sunken text-ink-2",
};

/** Count-up number on first view; later changes animate from the current value. */
export function useCountUp(target: number, duration = 900) {
  const reduced = useReducedMotion();
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const current = useRef(0);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const run = () => {
      const from = current.current;
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const e = 1 - Math.pow(1 - p, 3);
        const v = Math.round(from + (target - from) * e);
        current.current = v;
        setVal(v);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    if (started.current) {
      run();
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          io.disconnect();
          run();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, duration, reduced]);

  return { ref, val: reduced ? target : val };
}

export function KpiCard({ label, value, icon: Icon, tone = "petrol", prefix = "", suffix = "", sub, decimals = 0, className }: { label: string; value: number; icon: LucideIcon; tone?: Tone; prefix?: string; suffix?: string; sub?: React.ReactNode; decimals?: number; className?: string }) {
  const { ref, val } = useCountUp(value);
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    if (reduced) return;
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 4).toFixed(2)}deg) translateY(-2px)`;
  };
  const onLeave = () => {
    const el = cardRef.current;
    if (el) el.style.transform = "";
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "glass hairline card tilt relative overflow-hidden p-5",
        "after:absolute after:bottom-0 after:left-6 after:right-6 after:h-[3px] after:rounded-t-full after:opacity-90",
        toneBorder[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-ink-3">{label}</div>
          <div ref={ref} className="num mt-1.5 text-[30px] font-bold leading-none text-ink">
            {prefix}
            {groupLakh(val, decimals)}
            {suffix}
          </div>
          {sub && <div className="mt-2 text-[12.5px] text-ink-3">{sub}</div>}
        </div>
        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[14px]", toneTile[tone])}>
          <Icon className="h-5.5 w-5.5" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}
