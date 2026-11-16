"use client";
import { cn } from "@/lib/utils";

/** Placeholder wheat-ear mark for Kaliakair Pourashava, with a slow sheen animation. */
export function LogoMark({ size = 40, className, animated = true }: { size?: number; className?: string; animated?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={cn("shrink-0", className)} role="img" aria-label="কালিয়াকৈর পৌরসভা লোগো">
      <defs>
        <linearGradient id="lg-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--copper-2)" />
          <stop offset="55%" stopColor="var(--copper)" />
          <stop offset="100%" stopColor="var(--petrol)" />
        </linearGradient>
        <linearGradient id="lg-sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="50%" stopColor="white" stopOpacity="0.55" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
          {animated && <animateTransform attributeName="gradientTransform" type="translate" from="-1 0" to="2 0" dur="4.5s" repeatCount="indefinite" />}
        </linearGradient>
        <clipPath id="lg-clip">
          <circle cx="32" cy="32" r="29" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="29" fill="url(#lg-ring)" />
      <circle cx="32" cy="32" r="29" fill="url(#lg-sheen)" clipPath="url(#lg-clip)" opacity="0.5" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      <g stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M32 50V22" />
        <path d="M32 46c-6 0-10-3-10-8 5 0 9 3 10 8z" fill="#fff" stroke="none" opacity=".95" />
        <path d="M32 46c6 0 10-3 10-8-5 0-9 3-10 8z" fill="#fff" stroke="none" opacity=".95" />
        <path d="M32 38c-6 0-10-3-10-8 5 0 9 3 10 8z" fill="#fff" stroke="none" opacity=".85" />
        <path d="M32 38c6 0 10-3 10-8-5 0-9 3-10 8z" fill="#fff" stroke="none" opacity=".85" />
        <path d="M32 30c-5 0-8-3-8-7 4 0 7 3 8 7z" fill="#fff" stroke="none" opacity=".75" />
        <path d="M32 30c5 0 8-3 8-7-4 0-7 3-8 7z" fill="#fff" stroke="none" opacity=".75" />
        <path d="M32 22c-2-3-1-6 0-8 1 2 2 5 0 8z" fill="#fff" stroke="none" />
      </g>
      <path d="M20 52q12 6 24 0" stroke="rgba(255,255,255,.7)" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
