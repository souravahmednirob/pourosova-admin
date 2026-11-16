"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  "relative inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none rounded-[var(--radius-ctl)] transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-200 ease-[var(--ease-out)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.985]";

const variants: Record<Variant, string> = {
  primary: "grad-copper text-white shadow-[0_1px_0_rgba(255,255,255,.18)_inset,0_6px_16px_-6px_var(--glow)] hover:shadow-[0_1px_0_rgba(255,255,255,.2)_inset,0_10px_28px_-8px_var(--glow),0_0_24px_-6px_var(--glow)] hover:-translate-y-px",
  secondary: "bg-surface-solid text-ink border border-line-strong hover:border-ink-4 hover:bg-surface-strong shadow-sm",
  outline: "bg-transparent text-ink border border-line-strong hover:bg-sunken",
  ghost: "bg-transparent text-ink-2 hover:bg-sunken hover:text-ink",
  danger: "bg-brick text-white hover:brightness-110 shadow-sm",
  success: "bg-sage text-white hover:brightness-110 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-10.5 px-4.5 text-[14px]",
  lg: "h-12 px-6 text-[15px]",
  icon: "h-10 w-10 p-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) {
  return (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />}
      {children}
    </button>
  );
});
