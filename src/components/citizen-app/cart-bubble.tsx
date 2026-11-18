"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCitizen } from "@/store/citizen";
import { useData } from "@/store/data";
import { bn, taka } from "@/lib/bn";
import { cn } from "@/lib/utils";

const EVENT = "kp-cart-fly";

/** Call when something is added: a small dot flies from `from` into the bubble. */
export function flyToCart(from: Element | null) {
  if (!from) return;
  const r = from.getBoundingClientRect();
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }));
}

/** Messenger-style floating cart bubble. Appears when the cart has something, pops on every change. */
export function CartBubble() {
  const cart = useCitizen((s) => s.cart);
  const products = useData((s) => s.products);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = Object.entries(cart).reduce((s, [id, q]) => s + q * (products.find((p) => p.id === id)?.municipalPrice ?? 0), 0);
  const bubbleRef = useRef<HTMLAnchorElement>(null);
  const [dots, setDots] = useState<{ id: number; x: number; y: number; tx: number; ty: number; go: boolean }[]>([]);
  const [pop, setPop] = useState(0);
  const prev = useRef(count);

  useEffect(() => {
    if (count !== prev.current) queueMicrotask(() => setPop((p) => p + 1));
    prev.current = count;
  }, [count]);

  useEffect(() => {
    const on = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      const id = Date.now() + Math.random();
      const r = bubbleRef.current?.getBoundingClientRect();
      const tx = r ? r.left + r.width / 2 : window.innerWidth - 50;
      const ty = r ? r.top + r.height / 2 : window.innerHeight - 140;
      setDots((d) => [...d, { id, x, y, tx, ty, go: false }]);
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
            style={{ left: t.x - 8, top: t.y - 8, opacity: d.go ? 0.2 : 1, transform: d.go ? "scale(.5)" : "scale(1)", transition: "left .6s cubic-bezier(.5,-0.4,.7,1), top .6s cubic-bezier(.2,.6,.4,1), transform .6s, opacity .6s" }}
          />
        );
      })}
      <Link
        ref={bubbleRef}
        href="/citizen/cart"
        aria-label={`কার্ট: ${bn(count)}টি, মোট ${taka(total)}`}
        className={cn(
          "fixed bottom-[104px] right-4 z-40 transition-[opacity,transform] duration-500 ease-[var(--ease-spring)] sm:absolute",
          count > 0 ? "scale-100 opacity-100" : "pointer-events-none scale-50 opacity-0",
        )}
      >
        <span key={pop} className="relative grid h-[62px] w-[62px] place-items-center rounded-full grad-copper text-white shadow-[0_14px_30px_-10px_var(--glow),0_0_0_4px_var(--canvas)] animate-[bubble-pop_480ms_var(--ease-spring)]">
          <span aria-hidden className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,.45),transparent_55%)]" />
          <ShoppingCart className="relative h-[26px] w-[26px]" strokeWidth={2} />
          <span className="num absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-[#121a1c] px-1.5 text-[12px] font-bold text-white ring-[3px] ring-[var(--canvas)] dark:bg-[#ece7de] dark:text-[#121a1c]">{bn(count)}</span>
        </span>
      </Link>
    </>
  );
}
