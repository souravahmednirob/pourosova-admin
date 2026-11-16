"use client";
import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw, ShieldCheck, Moon, Sun, Database } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle, Field, Input, Modal, Pill } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useData } from "@/store/data";
import { useAuth, can } from "@/store/auth";
import { useUI } from "@/store/ui";
import { ROLE_LABEL } from "@/lib/types";
import { bn, fmtDateTime } from "@/lib/bn";

export default function SettingsPage() {
  const user = useAuth((s) => s.user);
  const settings = useData((s) => s.settings);
  const users = useData((s) => s.users);
  const audit = useData((s) => s.audit);
  const resetSeed = useData((s) => s.resetSeed);
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const [confirmReset, setConfirmReset] = useState(false);
  const [deadline, setDeadline] = useState(String(settings.pickupDeadlineDays));
  const [timeout, setTimeoutMin] = useState(String(settings.sessionTimeoutMin));
  const [lowPct, setLowPct] = useState(String(settings.lowStockPct));
  const canEdit = can(user?.role, "settings.edit");

  const save = () => {
    const d = Number(deadline), t = Number(timeout), l = Number(lowPct);
    if (!(d >= 1 && d <= 14) || !(t >= 5 && t <= 240) || !(l >= 5 && l <= 60)) {
      toast.error("মান সঠিক সীমার মধ্যে দিন");
      return;
    }
    useData.setState({ settings: { ...settings, pickupDeadlineDays: d, sessionTimeoutMin: t, lowStockPct: l } });
    toast.success("সেটিংস সংরক্ষিত হয়েছে");
  };

  return (
    <>
      <PageHeader title="সেটিংস" subtitle="সিস্টেম, থিম ও অ্যাকাউন্ট" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <CardTitle>থিম</CardTitle>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["light", "dark"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTheme(t)} className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-[14px] font-semibold transition-all ${theme === t ? "border-copper bg-copper-soft text-copper-deep dark:text-copper" : "border-line-strong text-ink-2 hover:bg-sunken"}`}>
                {t === "light" ? <Sun className="h-4.5 w-4.5" strokeWidth={1.8} /> : <Moon className="h-4.5 w-4.5" strokeWidth={1.8} />}
                {t === "light" ? "লাইট" : "ডার্ক"}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-ink-3">সাইডবার ও ড্রয়ারের প্রস্থ, থিম—সবই এই ব্রাউজারে মনে রাখা হয়।</p>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <CardTitle right={canEdit ? <Button size="sm" onClick={save}>সংরক্ষণ</Button> : <Pill tone="neutral">শুধু দেখা</Pill>}>সিস্টেম নিয়ম</CardTitle>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="সংগ্রহের সময়সীমা (দিন)" hint="অনুমোদনের পর কত দিনের মধ্যে সংগ্রহ করতে হবে">
              <Input type="number" min={1} max={14} value={deadline} onChange={(e) => setDeadline(e.target.value)} disabled={!canEdit} className="num" />
            </Field>
            <Field label="কম মজুত সীমা (%)" hint="ধারণক্ষমতার এই শতাংশের নিচে গেলে সতর্কতা">
              <Input type="number" min={5} max={60} value={lowPct} onChange={(e) => setLowPct(e.target.value)} disabled={!canEdit} className="num" />
            </Field>
            <Field label="সেশন টাইমআউট (মিনিট)" hint="নিষ্ক্রিয় থাকলে স্বয়ংক্রিয় লগ আউট">
              <Input type="number" min={5} max={240} value={timeout} onChange={(e) => setTimeoutMin(e.target.value)} disabled={!canEdit} className="num" />
            </Field>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[12.5px] text-ink-3">
            <ShieldCheck className="h-4 w-4" strokeWidth={1.8} /> মাসিক সীমা গণনা: ক্যালেন্ডার মাস · রেশন কার্ড নম্বর ও পিকআপ কোড সার্ভারে তৈরি হয়
          </div>
        </Card>

        {can(user?.role, "users.manage") && (
          <Card className="p-5 lg:col-span-2">
            <CardTitle>স্টাফ অ্যাকাউন্ট</CardTitle>
            <div className="table-wrap mt-3">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="text-left">
                    <th className="label-caps pb-2 font-semibold">নাম</th>
                    <th className="label-caps pb-2 font-semibold">ইমেইল</th>
                    <th className="label-caps pb-2 font-semibold">রোল</th>
                    <th className="label-caps pb-2 font-semibold">অবস্থা</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-line">
                      <td className="py-2.5 font-medium text-ink">{u.name}</td>
                      <td className="num py-2.5 text-ink-2">{u.email}</td>
                      <td className="py-2.5 text-ink-2">{ROLE_LABEL[u.role]}</td>
                      <td className="py-2.5"><Pill tone={u.active ? "sage" : "neutral"} dot>{u.active ? "সক্রিয়" : "বন্ধ"}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {can(user?.role, "audit.view") && (
          <Card className="p-5">
            <CardTitle>অডিট লগ</CardTitle>
            <ul className="mt-3 max-h-[340px] overflow-y-auto">
              {[...audit].reverse().slice(0, 40).map((a) => (
                <li key={a.id} className="border-b border-line py-2 last:border-0">
                  <div className="text-[13px] font-medium text-ink">{a.action}</div>
                  <div className="text-[12px] text-ink-3">{a.actorName} · {fmtDateTime(a.at)}</div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="p-5 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-sunken text-ink-3"><Database className="h-5 w-5" strokeWidth={1.8} /></div>
              <div>
                <div className="text-[15px] font-semibold text-ink">নমুনা ডেটা</div>
                <div className="text-[13px] text-ink-3">{bn(useData.getState().citizens.length)} নাগরিক · {bn(useData.getState().orders.length)} অর্ডার · সব তথ্য কাল্পনিক, এই ব্রাউজারে সংরক্ষিত</div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}><RotateCcw className="h-4 w-4" strokeWidth={1.8} /> নমুনা ডেটা রিসেট</Button>
          </div>
        </Card>
      </div>

      <Modal open={confirmReset} onOpenChange={setConfirmReset} title="নমুনা ডেটা রিসেট করবেন?" description="এই ব্রাউজারে করা সব পরিবর্তন মুছে প্রথম অবস্থায় ফিরে যাবে।">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>না</Button>
          <Button variant="danger" onClick={() => { resetSeed(); setConfirmReset(false); toast.success("নমুনা ডেটা রিসেট হয়েছে"); }}>হ্যাঁ, রিসেট</Button>
        </div>
      </Modal>
    </>
  );
}
