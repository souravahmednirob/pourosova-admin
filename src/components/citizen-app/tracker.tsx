import { Check, X } from "lucide-react";
import type { Order } from "@/lib/types";
import { fmtDate } from "@/lib/bn";
import { cn } from "@/lib/utils";

/** আবেদন → অনুমোদন → সংগ্রহ */
export function CitizenTracker({ o }: { o: Order }) {
  const cancelled = o.status === "CANCELLED";
  const steps = [
    { label: "আবেদন", at: o.appliedAt, state: "done" },
    { label: cancelled ? "বাতিল" : "অনুমোদন", at: cancelled ? o.cancelledAt : o.approvedAt, state: cancelled ? "bad" : o.approvedAt ? "done" : "now" },
    { label: "সংগ্রহ", at: o.collectedAt, state: o.collectedAt ? "done" : cancelled ? "off" : o.status === "AWAITING_PICKUP" ? "now" : "off" },
  ] as const;
  const reached = (i: number) => steps[i].state !== "off";
  return (
    <ol className="relative grid grid-cols-3">
      {/* connecting rails between the dots */}
      {[0, 1].map((i) => (
        <span key={i} aria-hidden className={cn("absolute top-[15px] h-0.5 rounded-full", reached(i + 1) ? (steps[i + 1].state === "bad" ? "bg-brick-2" : "bg-sage-2") : "bg-line-strong")} style={{ left: `${(i * 100) / 3 + 100 / 6 + 6}%`, width: `${100 / 3 - 12}%` }} />
      ))}
      {steps.map((s, i) => (
        <li key={i} className="relative flex flex-col items-center gap-1 text-center">
          <span
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full border-2 bg-[var(--surface-solid)]",
              s.state === "done" && "border-sage bg-sage text-white",
              s.state === "bad" && "border-brick bg-brick text-white",
              s.state === "now" && "border-copper text-copper-deep",
              s.state === "off" && "border-line-strong text-ink-4",
            )}
          >
            {s.state === "done" ? <Check className="h-4 w-4" strokeWidth={3} /> : s.state === "bad" ? <X className="h-4 w-4" strokeWidth={3} /> : s.state === "now" ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-copper" /> : null}
          </span>
          <span className={cn("text-[13px] font-semibold", s.state === "off" ? "text-ink-4" : s.state === "bad" ? "text-brick" : "text-ink")}>{s.label}</span>
          <span className="text-[11.5px] text-ink-3">{s.at ? fmtDate(s.at) : s.state === "now" ? "চলছে" : " "}</span>
        </li>
      ))}
    </ol>
  );
}
