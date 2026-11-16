"use client";
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────── Card ───────── */
export function Card({ className, hairline, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { hairline?: boolean }) {
  return (
    <div className={cn("glass card", hairline && "hairline", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, right }: { className?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <h3 className="text-[17px] font-semibold text-ink">{children}</h3>
      {right}
    </div>
  );
}

/* ───────── Inputs ───────── */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn("ctl w-full text-[14px] text-ink placeholder:text-ink-4", className)} {...props} />;
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn("ctl h-auto min-h-24 w-full resize-y py-2.5 text-[14px] text-ink placeholder:text-ink-4", className)} {...props} />;
});

export function Field({ label, hint, error, children, className, required }: { label: string; hint?: string; error?: string; children: React.ReactNode; className?: string; required?: boolean }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[13px] font-semibold text-ink-2">
        {label}
        {required && <span className="ml-0.5 text-brick">*</span>}
      </span>
      {children}
      {error ? <span className="text-[12.5px] text-brick">{error}</span> : hint ? <span className="text-[12.5px] text-ink-3">{hint}</span> : null}
    </label>
  );
}

export function NativeSelect({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn("ctl w-full appearance-none pr-9 text-[14px] text-ink", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" strokeWidth={1.8} />
    </div>
  );
}

/* ───────── Pill ───────── */
export type Tone = "petrol" | "copper" | "sage" | "ochre" | "brick" | "neutral";
const toneClass: Record<Tone, string> = {
  petrol: "bg-petrol-soft text-petrol",
  copper: "bg-copper-soft text-copper-deep dark:text-copper",
  sage: "bg-sage-soft text-sage",
  ochre: "bg-ochre-soft text-ochre",
  brick: "bg-brick-soft text-brick",
  neutral: "bg-sunken text-ink-2",
};
export function Pill({ tone = "neutral", className, children, dot }: { tone?: Tone; className?: string; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={cn("pill", toneClass[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

/* ───────── Switch ───────── */
export function Switch({ checked, onCheckedChange, disabled, label }: { checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={label}
      className={cn("relative h-6 w-11 shrink-0 rounded-full border border-line-strong transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-copper/40", checked ? "bg-sage" : "bg-sunken", disabled && "opacity-50")}
    >
      <SwitchPrimitive.Thumb className={cn("block h-4.5 w-4.5 translate-x-0.75 rounded-full bg-white shadow-sm transition-transform duration-200 ease-[var(--ease-spring)] data-[state=checked]:translate-x-5.75")} />
    </SwitchPrimitive.Root>
  );
}

/* ───────── Tooltip ───────── */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={250}>{children}</TooltipPrimitive.Provider>;
}
export function Tip({ content, children, side = "right" }: { content: React.ReactNode; children: React.ReactNode; side?: "top" | "right" | "bottom" | "left" }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content side={side} sideOffset={8} className="z-[80] rounded-lg border border-line bg-surface-solid px-2.5 py-1.5 text-[12.5px] font-medium text-ink shadow-md data-[state=delayed-open]:animate-[page-in_160ms_var(--ease-out)]">
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* ───────── Dialog ───────── */
export function Modal({ open, onOpenChange, title, description, children, className }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[rgba(10,17,20,0.35)] backdrop-blur-[3px] data-[state=open]:animate-[fade-in_200ms_var(--ease-out)]" />
        <DialogPrimitive.Content className={cn("glass-strong card fixed left-1/2 top-1/2 z-[71] w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 p-6 outline-none data-[state=open]:animate-[modal-in_260ms_var(--ease-spring)]", className)}>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-[18px] font-semibold text-ink">{title}</DialogPrimitive.Title>
              {description && <DialogPrimitive.Description className="mt-1 text-[13.5px] text-ink-3">{description}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close className="rounded-lg p-1.5 text-ink-3 hover:bg-sunken hover:text-ink" aria-label="বন্ধ">
              <X className="h-4.5 w-4.5" strokeWidth={1.8} />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ───────── Skeleton ───────── */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer", className)} />;
}

/* ───────── Empty ───────── */
export function Empty({ title, hint, icon }: { title: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      {icon && <div className="mb-1 text-ink-4">{icon}</div>}
      <div className="text-[15px] font-semibold text-ink-2">{title}</div>
      {hint && <div className="text-[13px] text-ink-3">{hint}</div>}
    </div>
  );
}
