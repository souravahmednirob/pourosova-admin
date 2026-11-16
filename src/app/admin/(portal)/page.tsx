"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Users, BadgeCheck, Hourglass, XCircle, UserPlus, ClipboardCheck, PackageCheck, ShieldX, ShoppingBag, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, Pill } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { DataGrid, type GridColumn } from "@/components/grid/data-grid";
import { CitizenDrawer, statusTone } from "@/components/citizen/citizen-drawer";
import { RegistrationsChart } from "@/components/citizen/registrations-chart";
import { useData } from "@/store/data";
import { useAuth, can } from "@/store/auth";
import { CITIZEN_STATUS_LABEL, type Citizen } from "@/lib/types";
import { bn, fmtDateTime, WARD_NAME } from "@/lib/bn";

function activityIcon(action: string) {
  if (action.includes("নিবন্ধন অনুমোদন")) return { Icon: ClipboardCheck, cls: "bg-sage-soft text-sage" };
  if (action.includes("নিবন্ধন")) return { Icon: UserPlus, cls: "bg-petrol-soft text-petrol" };
  if (action.includes("সংগ্রহ")) return { Icon: PackageCheck, cls: "bg-sage-soft text-sage" };
  if (action.includes("বাতিল")) return { Icon: ShieldX, cls: "bg-brick-soft text-brick" };
  if (action.includes("অর্ডার")) return { Icon: ShoppingBag, cls: "bg-copper-soft text-copper-deep dark:text-copper" };
  return { Icon: Sparkles, cls: "bg-sunken text-ink-2" };
}

function DashboardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const user = useAuth((s) => s.user);
  const citizens = useData((s) => s.citizens);
  const wards = useData((s) => s.wards);
  const audit = useData((s) => s.audit);
  const [open, setOpen] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);

  // deep links: ?citizen=<id> opens the drawer, ?new=<id> highlights the new row + toast
  useEffect(() => {
    const c = params.get("citizen");
    const n = params.get("new");
    if (c) queueMicrotask(() => setOpen(c));
    if (n) {
      queueMicrotask(() => setHighlight(n));
      const cz = useData.getState().citizens.find((x) => x.id === n);
      if (cz?.rationCardNo) toast.success(`${cz.nameBn} নিবন্ধিত হয়েছেন`, { description: `রেশন কার্ড নম্বর ${bn(cz.rationCardNo)}`, duration: 7000 });
    }
    if (c || n) router.replace("/admin");
  }, [params, router]);

  const total = citizens.length;
  const approved = citizens.filter((c) => c.status === "APPROVED").length;
  const pending = citizens.filter((c) => c.status === "PENDING").length;
  const rejected = citizens.filter((c) => c.status === "REJECTED").length;
  const wardNo = useCallback((id: string) => wards.find((w) => w.id === id)?.number ?? 0, [wards]);

  const columns = useMemo<GridColumn<Citizen>[]>(
    () => [
      {
        key: "name",
        label: "নাগরিক",
        value: (c) => c.nameBn,
        minWidth: 200,
        render: (c) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-ink">{c.nameBn}</div>
            <div className="num truncate text-[12px] text-ink-3">{c.nameEn}</div>
          </div>
        ),
      },
      { key: "ward", label: "ওয়ার্ড", value: (c) => wardNo(c.wardId), render: (c) => WARD_NAME(wardNo(c.wardId)), filter: "select", width: 110 },
      { key: "mobile", label: "মোবাইল", value: (c) => c.mobile, render: (c) => <span className="num">{bn(c.mobile)}</span>, groupable: false, width: 140 },
      { key: "card", label: "কার্ড নম্বর", value: (c) => c.rationCardNo ?? "", render: (c) => (c.rationCardNo ? <span className="num font-medium">{bn(c.rationCardNo)}</span> : <span className="text-ink-4">—</span>), groupable: false, width: 130 },
      { key: "status", label: "অবস্থা", value: (c) => CITIZEN_STATUS_LABEL[c.status], render: (c) => <Pill tone={statusTone[c.status]} dot>{CITIZEN_STATUS_LABEL[c.status]}</Pill>, filter: "select", width: 130 },
      { key: "agent", label: "ফিল্ড এজেন্ট", value: (c) => c.registeredByName, filter: "select", minWidth: 150 },
      { key: "registered", label: "নিবন্ধনের তারিখ ও সময়", value: (c) => c.registeredAt, render: (c) => <span className="tabular whitespace-nowrap text-ink-2">{fmtDateTime(c.registeredAt)}</span>, groupable: false, filterable: false, minWidth: 190 },
      { key: "family", label: "সদস্য", value: (c) => c.familySize, render: (c) => <span className="num">{bn(c.familySize)}</span>, align: "right", width: 90 },
      { key: "nid", label: "পরিচয়পত্র নম্বর", value: (c) => c.nationalId, render: (c) => <span className="num">{bn(c.nationalId)}</span>, groupable: false, hiddenByDefault: true, minWidth: 160 },
      { key: "mohalla", label: "মহল্লা", value: (c) => c.mohalla, hiddenByDefault: true, filter: "select" },
    ],
    [wardNo],
  );

  const recent = useMemo(() => [...audit].reverse().slice(0, 8), [audit]);

  return (
    <>
      <PageHeader title="ড্যাশবোর্ড" subtitle={pending > 0 ? `${bn(pending)}টি নিবন্ধন অনুমোদনের অপেক্ষায়` : "সব নিবন্ধন যাচাই করা হয়েছে"} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="মোট নাগরিক" value={total} icon={Users} tone="petrol" />
        <KpiCard label="অনুমোদিত" value={approved} icon={BadgeCheck} tone="sage" />
        <KpiCard label="অপেক্ষমাণ" value={pending} icon={Hourglass} tone="ochre" />
        <KpiCard label="বাতিল" value={rejected} icon={XCircle} tone="brick" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <RegistrationsChart />
        </Card>
        <Card className="p-5">
          <h3 className="text-[17px] font-semibold text-ink">সাম্প্রতিক কাজ</h3>
          <ul className="mt-3 flex flex-col">
            {recent.map((a) => {
              const { Icon, cls } = activityIcon(a.action);
              return (
                <li key={a.id} className="flex items-start gap-3 border-b border-line py-2.5 last:border-0">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ${cls}`}>
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-medium text-ink">{a.action}</span>
                    <span className="block text-[12px] text-ink-3">
                      {a.actorName} · {fmtDateTime(a.at)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-[18px] font-semibold text-ink">সকল নাগরিক</h2>
          <span className="text-[13px] text-ink-3">সারিতে ক্লিক করলে বিস্তারিত খুলবে</span>
        </div>
        <DataGrid<Citizen>
          rows={citizens}
          columns={columns}
          rowKey={(c) => c.id}
          onRowClick={(c) => setOpen(c.id)}
          defaultSort={{ key: "registered", dir: "desc" }}
          exportFileName="citizens"
          storageKey="citizens"
          highlightKey={highlight}
          quickSearch={(c, q) => c.nameBn.includes(q) || c.nameEn.toLowerCase().includes(q.toLowerCase()) || c.mobile.includes(q) || (c.rationCardNo ?? "").toLowerCase().includes(q.toLowerCase())}
          primaryAction={
            can(user?.role, "citizen.register") ? (
              <Button onClick={() => router.push("/admin/register")}>
                <UserPlus className="h-4 w-4" strokeWidth={1.8} /> নতুন নাগরিক নিবন্ধন
              </Button>
            ) : null
          }
        />
      </div>

      <CitizenDrawer citizenId={open} onClose={() => setOpen(null)} />
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}
