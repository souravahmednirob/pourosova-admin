import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/* Hand-drawn product illustrations (no stock photos, no emoji). 64×64 artboard. */

const ART: Record<string, { bg: string; draw: React.ReactNode }> = {
  rice: {
    bg: "from-[#f4ecd8] to-[#e6dcc2] dark:from-[#3a3426] dark:to-[#2a261c]",
    draw: (
      <>
        <ellipse cx="32" cy="52" rx="16" ry="3" fill="#000" opacity=".08" />
        <path d="M11 32h42a21 19 0 0 1-42 0z" fill="#1f4d58" />
        <path d="M11 32h42" stroke="#163a43" strokeWidth="2" />
        <path d="M13 32c1-10 10-15 19-15s18 5 19 15z" fill="#fbf7ec" />
        {[[22, 26, -30], [28, 22, 10], [35, 24, -15], [41, 27, 25], [31, 28, 40], [25, 30, 0], [38, 30, -40], [44, 31, 10], [19, 31, 30]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx="2.4" ry="1.1" fill="#e2d6b8" transform={`rotate(${r} ${x} ${y})`} />
        ))}
        <path d="M18 40c4 4 9 6 14 6" stroke="#c97e52" strokeWidth="2" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  flour: {
    bg: "from-[#f3e8cd] to-[#e8d7b0] dark:from-[#3b3220] dark:to-[#2b2518]",
    draw: (
      <>
        <ellipse cx="32" cy="55" rx="15" ry="3" fill="#000" opacity=".08" />
        <path d="M20 18c-4 8-6 18-5 30 1 5 4 7 17 7s16-2 17-7c1-12-1-22-5-30z" fill="#fbf4e2" stroke="#d9c69a" strokeWidth="1.5" />
        <path d="M21 18c3-3 19-3 22 0l-2 3c-5-2-13-2-18 0z" fill="#c2922c" />
        <path d="M25 14l3 4M39 14l-3 4" stroke="#8a6212" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 46V31" stroke="#c2922c" strokeWidth="1.8" strokeLinecap="round" />
        {[33, 37, 41].map((y) => (
          <g key={y}>
            <ellipse cx="29.5" cy={y} rx="1.6" ry="3" fill="#c2922c" transform={`rotate(-35 29.5 ${y})`} />
            <ellipse cx="34.5" cy={y} rx="1.6" ry="3" fill="#c2922c" transform={`rotate(35 34.5 ${y})`} />
          </g>
        ))}
      </>
    ),
  },
  lentil: {
    bg: "from-[#f6dfcf] to-[#ecc8ad] dark:from-[#3d2a1f] dark:to-[#2c1f17]",
    draw: (
      <>
        <ellipse cx="32" cy="52" rx="16" ry="3" fill="#000" opacity=".08" />
        <path d="M11 33h42a21 18 0 0 1-42 0z" fill="#a65c33" />
        <path d="M13 33c2-9 10-13 19-13s17 4 19 13z" fill="#e08a4a" />
        {[[20, 30], [25, 26], [31, 24], [37, 25], [43, 29], [28, 30], [35, 29], [40, 32], [23, 32], [46, 32], [32, 32]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.9" fill="#f2a66c" stroke="#c96f34" strokeWidth=".6" />
        ))}
        <path d="M17 41c4 4 9 6 15 6" stroke="#f1e2d6" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".8" />
      </>
    ),
  },
  chickpea: {
    bg: "from-[#efe6d2] to-[#e1d3b4] dark:from-[#38311f] dark:to-[#28231a]",
    draw: (
      <>
        <ellipse cx="32" cy="52" rx="16" ry="3" fill="#000" opacity=".08" />
        <path d="M11 33h42a21 18 0 0 1-42 0z" fill="#3f7050" />
        <path d="M13 33c2-9 10-14 19-14s17 5 19 14z" fill="#d9b779" />
        {[[19, 31], [24, 27], [30, 24], [36, 24], [42, 27], [46, 31], [27, 31], [33, 29], [39, 31]].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="3" fill="#e8c98c" stroke="#b48c4c" strokeWidth=".7" />
            <path d={`M${x - 1} ${y - 2}q1 1 0 2`} stroke="#b48c4c" strokeWidth=".6" fill="none" />
          </g>
        ))}
      </>
    ),
  },
  oil: {
    bg: "from-[#f6ecc9] to-[#ecd998] dark:from-[#3a331b] dark:to-[#2a2515]",
    draw: (
      <>
        <ellipse cx="32" cy="56" rx="12" ry="2.5" fill="#000" opacity=".08" />
        <rect x="28" y="7" width="8" height="5" rx="1.5" fill="#a6463a" />
        <path d="M27 12h10v5c6 3 9 8 9 14v19a5 5 0 0 1-5 5H23a5 5 0 0 1-5-5V31c0-6 3-11 9-14z" fill="#fff8e0" fillOpacity=".7" stroke="#d6b75a" strokeWidth="1.5" />
        <path d="M19 33h26v17a4 4 0 0 1-4 4H23a4 4 0 0 1-4-4z" fill="#e6b93a" />
        <path d="M19 33c6 2 20 2 26 0" stroke="#f4d36c" strokeWidth="2" fill="none" />
        <rect x="22" y="38" width="20" height="10" rx="2" fill="#fffaf0" />
        <path d="M32 40.5c-2 2.5-2.5 3.8-2.5 4.6a2.5 2.5 0 0 0 5 0c0-.8-.5-2.1-2.5-4.6z" fill="#e6b93a" />
        <path d="M23 20c-2 3-2 8-2 10" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".8" />
      </>
    ),
  },
  sugar: {
    bg: "from-[#e8eef0] to-[#d3dfe3] dark:from-[#1f2a2e] dark:to-[#172024]",
    draw: (
      <>
        <ellipse cx="32" cy="53" rx="18" ry="3" fill="#000" opacity=".08" />
        {[[14, 34], [32, 34], [23, 18]].map(([x, y], i) => (
          <g key={i}>
            <path d={`M${x} ${y + 5}l9-5 9 5-9 5z`} fill="#ffffff" />
            <path d={`M${x} ${y + 5}v10l9 5v-10z`} fill="#e3eaec" />
            <path d={`M${x + 18} ${y + 5}v10l-9 5v-10z`} fill="#c9d6da" />
            <circle cx={x + 6} cy={y + 12} r=".7" fill="#b5c4c9" />
            <circle cx={x + 13} cy={y + 14} r=".7" fill="#a7b8be" />
          </g>
        ))}
      </>
    ),
  },
  salt: {
    bg: "from-[#e5ebe7] to-[#cfdcd3] dark:from-[#1f2b24] dark:to-[#18211c]",
    draw: (
      <>
        <ellipse cx="32" cy="56" rx="12" ry="2.5" fill="#000" opacity=".08" />
        <path d="M22 18h20l3 33a4 4 0 0 1-4 4H23a4 4 0 0 1-4-4z" fill="#ffffff" fillOpacity=".85" stroke="#b9c9bf" strokeWidth="1.5" />
        <path d="M21 34h22l2 17a4 4 0 0 1-4 4H23a4 4 0 0 1-4-4z" fill="#f4f7f5" />
        <path d="M22 10h20a2 2 0 0 1 2 2v6H20v-6a2 2 0 0 1 2-2z" fill="#3f7050" />
        {[26, 32, 38].map((x) => <circle key={x} cx={x} cy="14" r="1.2" fill="#dce9de" />)}
        <path d="M24 24v20" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  onion: {
    bg: "from-[#f1dde2] to-[#e3c3cc] dark:from-[#3a2329] dark:to-[#2a1a1f]",
    draw: (
      <>
        <ellipse cx="32" cy="55" rx="14" ry="3" fill="#000" opacity=".08" />
        <path d="M32 8c1 4 0 7-1 9" stroke="#5c9a6e" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M33 9c3 2 4 5 3 8" stroke="#3f7050" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M32 17c-12 4-18 13-18 21 0 9 8 15 18 15s18-6 18-15c0-8-6-17-18-21z" fill="#a8445f" />
        <path d="M32 18c-6 5-9 13-9 20s3 13 9 15" stroke="#c96a83" strokeWidth="1.6" fill="none" />
        <path d="M32 18c6 5 9 13 9 20s-3 13-9 15" stroke="#8e3550" strokeWidth="1.6" fill="none" />
        <path d="M21 32c-2 4-2 9 0 12" stroke="#e7a1b3" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M27 53l-1 3M32 53v3M37 53l1 3" stroke="#d9b7a0" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  bag: {
    bg: "from-[#e8e4dc] to-[#d6d0c4] dark:from-[#2a2824] dark:to-[#1f1d1a]",
    draw: (
      <>
        <path d="M18 22h28l-3 32H21z" fill="#a65c33" />
        <path d="M24 22v-4a8 8 0 0 1 16 0v4" stroke="#7e4323" strokeWidth="2.5" fill="none" />
      </>
    ),
  },
};

export function artKey(p: Pick<Product, "name" | "category">) {
  const n = p.name;
  if (n.includes("চাল")) return "rice";
  if (n.includes("আটা") || n.includes("ময়দা")) return "flour";
  if (n.includes("ছোলা")) return "chickpea";
  if (n.includes("ডাল")) return "lentil";
  if (n.includes("তেল")) return "oil";
  if (n.includes("চিনি")) return "sugar";
  if (n.includes("লবণ")) return "salt";
  if (n.includes("পেঁয়াজ")) return "onion";
  return "bag";
}

export function ProductArt({ product, className, size = 64, framed = true }: { product: Pick<Product, "name" | "category">; className?: string; size?: number; framed?: boolean }) {
  const a = ART[artKey(product)];
  const svg = (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className="drop-shadow-[0_6px_10px_rgba(0,0,0,.08)]">
      {a.draw}
    </svg>
  );
  if (!framed) return svg;
  return <div className={cn("grid place-items-center bg-gradient-to-br", a.bg, className)}>{svg}</div>;
}
