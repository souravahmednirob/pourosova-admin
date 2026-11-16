import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, actions, back, className }: { title: string; subtitle?: string; actions?: React.ReactNode; back?: { href: string; label: string }; className?: string }) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-end justify-between gap-3 md:mb-6", className)}>
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-ink-3 transition-colors hover:text-copper-deep dark:hover:text-copper">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.8} /> {back.label}
          </Link>
        )}
        <h1 className="text-[26px] font-bold leading-tight text-ink md:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[14px] text-ink-3">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
