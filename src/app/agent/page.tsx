"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { LogOut, Plus, Smartphone, RefreshCw, Search } from "lucide-react";
import { AgentFrame, AgentHeader, useOnline } from "@/components/agent/agent-frame";
import { Pill } from "@/components/ui/primitives";
import { useAgent } from "@/store/agent";
import { useData } from "@/store/data";
import { CITIZEN_STATUS_LABEL } from "@/lib/types";
import { statusTone } from "@/components/citizen/citizen-drawer";
import { bn, fmtDateTime } from "@/lib/bn";
import { cn } from "@/lib/utils";

type Tab = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

function AgentHome() {
  const agent = useAgent((s) => s.agent)!;
  const queue = useAgent((s) => s.queue);
  const sync = useAgent((s) => s.sync);
  const logout = useAgent((s) => s.logout);
  const citizens = useData((s) => s.citizens);
  const online = useOnline();
  const [tab, setTab] = useState<Tab>("ALL");
  const [q, setQ] = useState("");

  // send anything kept on the phone as soon as the connection is back
  useEffect(() => {
    if (!online || queue.length === 0) return;
    const r = sync();
    if (r.sent) toast.success(`ফোনে জমা থাকা ${bn(r.sent)}টি নিবন্ধন পাঠানো হয়েছে`);
    if (r.failed) toast.error(`${bn(r.failed)}টি নিবন্ধন পাঠানো যায়নি — নিচে কারণ দেখুন`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  // the agent sees only their own submissions
  const mine = useMemo(() => citizens.filter((c) => c.registeredBy === agent.id).sort((a, b) => b.registeredAt.localeCompare(a.registeredAt)), [citizens, agent.id]);
  const counts = useMemo(() => ({ ALL: mine.length, PENDING: mine.filter((c) => c.status === "PENDING").length, APPROVED: mine.filter((c) => c.status === "APPROVED").length, REJECTED: mine.filter((c) => c.status === "REJECTED").length }), [mine]);
  const list = mine.filter((c) => (tab === "ALL" || c.status === tab) && (!q || c.nameBn.includes(q) || (c.applicationNo ?? "").includes(q)));

  return (
    <>
      <AgentHeader eyebrow="ফিল্ড এজেন্ট" title={agent.name} subtitle="আপনার জমা দেওয়া নিবন্ধন">
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: "মোট", v: counts.ALL },
            { l: "অপেক্ষায়", v: counts.PENDING },
            { l: "অনুমোদিত", v: counts.APPROVED },
          ].map((x) => (
            <div key={x.l} className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/15">
              <div className="text-[12px] text-[#cfdde0]">{x.l}</div>
              <div className="num text-[22px] font-bold text-white">{bn(x.v)}</div>
            </div>
          ))}
        </div>
      </AgentHeader>

      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        <Link href="/agent/new" className="grad-copper flex h-[56px] items-center justify-center gap-2 rounded-[16px] text-[16px] font-bold text-white shadow-[0_10px_24px_-10px_var(--glow)] transition-transform active:scale-[0.98]">
          <Plus className="h-5 w-5" strokeWidth={2} /> নতুন নিবন্ধন করুন
        </Link>

        {queue.length > 0 && (
          <div className="rounded-2xl border border-ochre/30 bg-ochre-soft p-4">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-ochre">
              <Smartphone className="h-4.5 w-4.5" strokeWidth={1.8} /> ফোনে জমা আছে: {bn(queue.length)}টি
            </div>
            <p className="mt-1 text-[13px] text-ink-2">{online ? "এখনই পাঠানো যাবে।" : "ইন্টারনেট এলে নিজে থেকে পাঠানো হবে।"}</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {queue.map((qq) => (
                <li key={qq.localId} className="rounded-xl bg-surface-solid px-3 py-2 text-[13px]">
                  <div className="font-medium text-ink">{qq.input.nameBn}</div>
                  <div className="text-[12px] text-ink-3">{fmtDateTime(qq.createdAt)}</div>
                  {qq.error && <div className="mt-0.5 text-[12px] text-brick">{qq.error}</div>}
                </li>
              ))}
            </ul>
            {online && (
              <button type="button" onClick={() => { const r = sync(); toast(r.sent ? `${bn(r.sent)}টি পাঠানো হয়েছে` : "পাঠানো যায়নি"); }} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-ochre/40 text-[14px] font-semibold text-ochre">
                <RefreshCw className="h-4 w-4" strokeWidth={1.8} /> এখনই পাঠান
              </button>
            )}
          </div>
        )}

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cn("flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13.5px] font-medium transition-colors", tab === t ? "border-copper bg-copper-soft text-copper-deep dark:text-copper" : "border-line-strong text-ink-2")}>
              {t === "ALL" ? "সব" : CITIZEN_STATUS_LABEL[t]} <span className="num text-[12px] opacity-70">{bn(counts[t])}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-4" strokeWidth={1.8} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম বা আবেদন নং" className="h-12 w-full rounded-[14px] border border-line-strong bg-surface-solid pl-11 pr-4 text-[15px] outline-none focus:border-copper" />
        </div>

        <ul className="flex flex-col gap-2.5">
          {list.length === 0 && <li className="py-10 text-center text-[14px] text-ink-3">এখানে কোনো নিবন্ধন নেই</li>}
          {list.map((c) => (
            <li key={c.id} className="glass rounded-[18px] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[15.5px] font-semibold text-ink">{c.nameBn}</div>
                  <div className="num text-[12.5px] text-ink-3">{c.applicationNo ? bn(c.applicationNo) : "—"}</div>
                </div>
                <Pill tone={statusTone[c.status]} dot>{c.status === "PENDING" ? "অনুমোদনের অপেক্ষায়" : CITIZEN_STATUS_LABEL[c.status]}</Pill>
              </div>
              <div className="mt-2 text-[12.5px] text-ink-3">জমা: {fmtDateTime(c.registeredAt)}</div>
              {c.status === "APPROVED" && c.rationCardNo && <div className="mt-1 text-[13px] text-sage">রেশন কার্ড নম্বর <b className="num">{bn(c.rationCardNo)}</b></div>}
              {c.status === "REJECTED" && c.rejectReason && <div className="mt-1 text-[13px] text-brick">কারণ: {c.rejectReason}</div>}
            </li>
          ))}
        </ul>

        <button type="button" onClick={logout} className="mx-auto mt-2 flex items-center gap-2 py-3 text-[14px] text-ink-3 hover:text-brick">
          <LogOut className="h-4 w-4" strokeWidth={1.8} /> বের হন
        </button>
      </div>
    </>
  );
}

export default function AgentHomePage() {
  return (
    <AgentFrame>
      <AgentHome />
    </AgentFrame>
  );
}
