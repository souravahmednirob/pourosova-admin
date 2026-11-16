"use client";
import { Users, BadgeCheck, Hourglass, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/primitives";
import { useData } from "@/store/data";
import { bn, fmtDateTime } from "@/lib/bn";

export default function DashboardPage() {
  const citizens = useData((s) => s.citizens);
  const audit = useData((s) => s.audit);
  const total = citizens.length;
  const approved = citizens.filter((c) => c.status === "APPROVED").length;
  const pending = citizens.filter((c) => c.status === "PENDING").length;
  const rejected = citizens.filter((c) => c.status === "REJECTED").length;

  return (
    <>
      <PageHeader title="ড্যাশবোর্ড" subtitle={`${bn(pending)}টি নিবন্ধন অনুমোদনের অপেক্ষায়`} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="মোট নাগরিক" value={total} icon={Users} tone="petrol" />
        <KpiCard label="অনুমোদিত" value={approved} icon={BadgeCheck} tone="sage" />
        <KpiCard label="অপেক্ষমাণ" value={pending} icon={Hourglass} tone="ochre" />
        <KpiCard label="বাতিল" value={rejected} icon={XCircle} tone="brick" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-[17px] font-semibold text-ink">মাসভিত্তিক নতুন নিবন্ধন</h3>
          <div className="mt-4 grid h-[280px] place-items-center rounded-2xl bg-sunken text-[13px] text-ink-3">চার্ট ফেজ ২-এ যুক্ত হবে</div>
        </Card>
        <Card className="p-5">
          <h3 className="text-[17px] font-semibold text-ink">সাম্প্রতিক কাজ</h3>
          <ul className="mt-3 flex flex-col">
            {[...audit].reverse().slice(0, 7).map((a) => (
              <li key={a.id} className="flex items-start gap-3 border-b border-line py-2.5 last:border-0">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium text-ink">{a.action}</span>
                  <span className="block text-[12px] text-ink-3">{a.actorName} · {fmtDateTime(a.at)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
