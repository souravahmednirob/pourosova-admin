"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCitizen } from "@/store/citizen";
import { bn } from "@/lib/bn";
import { cn } from "@/lib/utils";

const EVENT = "kp-cart-fly";

/** Call when something is added: a small dot flies from `from` into the header cart button. */
export function flyToCart(from: Element | null) {
  if (!from) return;
  const r = from.getBoundingClientRect();
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }));
}

/** Cart button for page headers (top-right). Shows the count and pops whenever it changes. */
export function CartButton({ className }: { className?: string }) {
  const count = useCitizen((s) => Object.values(s.cart).reduce((a, b) => a + b, 0));
  const [pop, setPop] = useState(0);
  const prev = useRef(count);
  useEffect(() => {
    if (count !== prev.current) queueMicrotask(() => setPop((p) => p + 1));
    prev.current = count;
  }, [count]);

  return (
    <Link
      href="/citizen/cart"
      data-cart-target
      aria-label={count ? `কার্ট, ${bn(count)}টি পণ্য` : "কার্ট খালি"}
      className={cn(
        "relative grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors duration-300",
        count ? "grad-copper text-white shadow-[0_10px_22px_-10px_var(--glow)]" : "border border-line-strong bg-surface-solid text-ink hover:bg-sunken",
        className,
      )}
    >
      <span key={pop} className={cn("grid place-items-center", pop > 0 && "animate-[bubble-pop_480ms_var(--ease-spring)]")}>
        <ShoppingCart className="h-5 w-5" strokeWidth={1.9} />
      </span>
      {count > 0 && (
        <span key={`b${pop}`} className="num absolute -right-1 -top-1 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-[#121a1c] px-1.5 text-[11.5px] font-bold text-white ring-[3px] ring-[var(--canvas)] animate-[modal-pop_360ms_var(--ease-spring)] dark:bg-[#ece7de] dark:text-[#121a1c]">
          {bn(count)}
        </span>
      )}
    </Link>
  );
}

/** Renders the flying dots; mounted once by the citizen frame. */
export function FlyLayer() {
  const [dots, setDots] = useState<{ id: number; x: number; y: number; tx: number; ty: number; go: boolean }[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      const target = document.querySelector("[data-cart-target]")?.getBoundingClientRect();
      if (!target) return;
      const id = Date.now() + Math.random();
      setDots((d) => [...d, { id, x, y, tx: target.left + target.width / 2, ty: target.top + target.height / 2, go: false }]);
      requestAnimationFrame(() => requestAnimationFrame(() => setDots((d) => d.map((dot) => (dot.id === id ? { ...dot, go: true } : dot)))));
      setTimeout(() => setDots((d) => d.filter((dot) => dot.id !== id)), 700);
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return (
    <>
      {dots.map((d) => {
        const t = d.go ? { x: d.tx, y: d.ty } : d;
        return (
          <span
            key={d.id}
            aria-hidden
            className="grad-copper pointer-events-none fixed z-[80] h-4 w-4 rounded-full shadow-[0_0_14px_var(--glow)]"
            style={{ left: t.x - 8, top: t.y - 8, opacity: d.go ? 0.25 : 1, transform: d.go ? "scale(.5)" : "scale(1)", transition: "left .6s cubic-bezier(.3,.7,.4,1), top .6s cubic-bezier(.6,-0.5,.7,1), transform .6s, opacity .6s" }}
          />
        );
      })}
    </>
  );
}
