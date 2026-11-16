"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Minus, Plus, Sparkles, UserPlus, ListChecks, CreditCard, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, Field, Input, NativeSelect, Textarea } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ImageField } from "@/components/citizen/image-field";
import { useData, RuleError, NID_RE, MOBILE_RE, type RegisterInput } from "@/store/data";
import { useAuth, can } from "@/store/auth";
import { bn, en } from "@/lib/bn";
import { cn } from "@/lib/utils";

const STEPS = ["তথ্য যাচাই", "ছবি ও পরিচয়পত্র সংরক্ষণ", "রেশন কার্ড নম্বর তৈরি"];

const empty: RegisterInput = { nameBn: "", nameEn: "", nationalId: "", mobile: "", wardId: "", mohalla: "", holding: "", address: "", familySize: 4 };

export default function RegisterPage() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const wards = useData((s) => s.wards);
  const register = useData((s) => s.registerCitizen);
  const [f, setF] = useState<RegisterInput>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput, string>>>({});
  const [stage, setStage] = useState<number>(-1); // -1 idle, 0..2 running, 3 done
  const [progress, setProgress] = useState(0);
  const allowed = can(user?.role, "citizen.register");

  const set = <K extends keyof RegisterInput>(k: K, v: RegisterInput[K]) => {
    setF((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!f.nameBn.trim()) e.nameBn = "নাম বাংলায় লিখুন";
    if (!f.nameEn.trim()) e.nameEn = "নাম ইংরেজিতে লিখুন";
    if (!NID_RE.test(f.nationalId)) e.nationalId = "১০, ১৩ বা ১৭ ডিজিটের নম্বর দিন";
    if (!MOBILE_RE.test(f.mobile)) e.mobile = "০১ দিয়ে শুরু ১১ ডিজিটের নম্বর দিন";
    if (!f.wardId) e.wardId = "ওয়ার্ড বেছে নিন";
    if (!f.mohalla.trim()) e.mohalla = "মহল্লার নাম লিখুন";
    if (!f.address.trim()) e.address = "ঠিকানা লিখুন";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!user || !validate()) {
      toast.error("লাল চিহ্নিত ঘরগুলো ঠিক করুন");
      return;
    }
    // pre-check duplicates before showing the loading screen
    const dupe = useData.getState().citizens.find((c) => c.nationalId === f.nationalId || c.mobile === f.mobile);
    if (dupe) {
      const isNid = dupe.nationalId === f.nationalId;
      setErrors((e) => ({ ...e, [isNid ? "nationalId" : "mobile"]: `${dupe.nameBn}-এর নামে ইতিমধ্যে নিবন্ধিত` }));
      toast.error(isNid ? "এই পরিচয়পত্র নম্বর আগেই নিবন্ধিত" : "এই মোবাইল নম্বর আগেই নিবন্ধিত");
      return;
    }
    setStage(0);
    setProgress(8);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
    const tick = (to: number, ms: number) => new Promise<void>((r) => { setTimeout(() => { setProgress(to); r(); }, ms); });
    await tick(34, 650);
    setStage(1);
    await tick(70, 800);
    setStage(2);
    await tick(92, 650);
    try {
      const c = register(f, { id: user.id, name: user.name }, true);
      setProgress(100);
      setStage(3);
      await new Promise((r) => setTimeout(r, 500));
      router.push(`/admin?new=${c.id}`);
    } catch (e) {
      setStage(-1);
      setProgress(0);
      toast.error(e instanceof RuleError ? e.message : "নিবন্ধন করা যায়নি");
    }
  };

  if (!allowed) {
    return (
      <>
        <PageHeader title="নতুন নাগরিক নিবন্ধন" />
        <Card className="p-8 text-center text-[14px] text-ink-3">আপনার অ্যাকাউন্টে নাগরিক নিবন্ধনের অনুমতি নেই।</Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="নতুন নাগরিক নিবন্ধন" subtitle="পৌরসভা অফিস থেকে সরাসরি নিবন্ধন — অনুমোদন স্বয়ংক্রিয়" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="relative overflow-hidden p-6 md:p-7">
          <form onSubmit={submit} noValidate className={cn("flex flex-col gap-8", stage >= 0 && "hidden")} aria-hidden={stage >= 0}>
            <section>
              <SectionTitle n={1} title="ব্যক্তিগত তথ্য" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="নাম (বাংলায়)" required error={errors.nameBn}>
                  <Input value={f.nameBn} onChange={(e) => set("nameBn", e.target.value)} placeholder="জাতীয় পরিচয়পত্র অনুযায়ী" />
                </Field>
                <Field label="নাম (ইংরেজিতে)" required error={errors.nameEn}>
                  <Input value={f.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="As on NID" className="num" />
                </Field>
                <Field label="জাতীয় পরিচয়পত্র / জন্মনিবন্ধন নম্বর" required error={errors.nationalId} hint="১০, ১৩ বা ১৭ ডিজিট">
                  <Input inputMode="numeric" value={bn(f.nationalId)} onChange={(e) => set("nationalId", en(e.target.value).replace(/\D/g, "").slice(0, 17))} placeholder="১৯৮৫XXXXXXXXX" className="num" />
                </Field>
                <Field label="মোবাইল নম্বর" required error={errors.mobile}>
                  <div className="flex gap-2">
                    <span className="ctl flex h-[42px] items-center bg-sunken px-3 text-[14px] font-medium text-ink-2">+৮৮</span>
                    <Input inputMode="tel" value={bn(f.mobile)} onChange={(e) => set("mobile", en(e.target.value).replace(/\D/g, "").slice(0, 11))} placeholder="০১৭XXXXXXXX" className="num" />
                  </div>
                </Field>
                <Field label="পরিবারের সদস্য সংখ্যা" required>
                  <div className="ctl flex h-[42px] items-center justify-between px-1.5">
                    <button type="button" onClick={() => set("familySize", Math.max(1, f.familySize - 1))} className="grid h-8 w-8 place-items-center rounded-lg text-ink-2 hover:bg-sunken" aria-label="কমান"><Minus className="h-4 w-4" /></button>
                    <span className="num text-[16px] font-bold">{bn(f.familySize)} জন</span>
                    <button type="button" onClick={() => set("familySize", Math.min(20, f.familySize + 1))} className="grid h-8 w-8 place-items-center rounded-lg text-ink-2 hover:bg-sunken" aria-label="বাড়ান"><Plus className="h-4 w-4" /></button>
                  </div>
                </Field>
              </div>
            </section>

            <section>
              <SectionTitle n={2} title="ঠিকানা" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="ওয়ার্ড" required error={errors.wardId}>
                  <NativeSelect value={f.wardId} onChange={(e) => set("wardId", e.target.value)}>
                    <option value="">বেছে নিন</option>
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="মহল্লা / পাড়া" required error={errors.mohalla}>
                  <Input value={f.mohalla} onChange={(e) => set("mohalla", e.target.value)} placeholder="যেমন: বাজার পাড়া" />
                </Field>
                <Field label="বাড়ি / হোল্ডিং নম্বর">
                  <Input value={f.holding} onChange={(e) => set("holding", e.target.value)} placeholder="যেমন: ১২/এ" className="num" />
                </Field>
                <Field label="বিস্তারিত ঠিকানা" required error={errors.address} className="md:col-span-2">
                  <Textarea value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="রাস্তা, ল্যান্ডমার্ক" className="min-h-20" />
                </Field>
              </div>
            </section>

            <section>
              <SectionTitle n={3} title="ছবি ও পরিচয়পত্র" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[150px_1fr_1fr]">
                <ImageField label="নাগরিকের ছবি" hint="সামনে থেকে স্পষ্ট" value={f.photoUrl} onChange={(v) => set("photoUrl", v)} aspect="portrait" capture="user" />
                <ImageField label="পরিচয়পত্র (সামনের পাশ)" hint="পুরো কার্ড ফ্রেমে" value={f.idFrontUrl} onChange={(v) => set("idFrontUrl", v)} />
                <ImageField label="পরিচয়পত্র (পেছনের পাশ)" hint="ঠিকানা পড়া যায় এমন" value={f.idBackUrl} onChange={(v) => set("idBackUrl", v)} />
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-5">
              <Button type="button" variant="ghost" onClick={() => { setF(empty); setErrors({}); }}>সব মুছুন</Button>
              <Button type="submit" size="lg"><UserPlus className="h-4.5 w-4.5" strokeWidth={1.8} /> নিবন্ধন সম্পন্ন করুন</Button>
            </div>
          </form>

          {stage >= 0 && (
            <div className="flex min-h-[520px] flex-col items-center justify-center gap-6 p-8 animate-[fade-in_300ms_var(--ease-out)]" role="status" aria-live="polite">
              <div className="relative grid h-20 w-20 place-items-center">
                <div className={cn("absolute inset-0 rounded-full border-[3px] border-line-strong border-t-copper", stage < 3 ? "animate-spin" : "border-sage-2")} />
                {stage >= 3 ? <Check className="h-8 w-8 text-sage" strokeWidth={2.2} /> : <Sparkles className="h-7 w-7 text-copper" strokeWidth={1.8} />}
              </div>
              <div className="text-center">
                <div className="text-[20px] font-bold text-ink">{stage >= 3 ? "নিবন্ধন সম্পন্ন" : "নিবন্ধন হচ্ছে…"}</div>
                <div className="mt-1 text-[13.5px] text-ink-3">{f.nameBn}</div>
              </div>
              <div className="w-full max-w-[380px]">
                <div className="h-2 overflow-hidden rounded-full bg-sunken">
                  <div className="h-full rounded-full grad-copper transition-[width] duration-500 ease-[var(--ease-out)]" style={{ width: `${progress}%` }} />
                </div>
                <ul className="mt-5 flex flex-col gap-3">
                  {STEPS.map((s, i) => {
                    const done = stage > i;
                    const active = stage === i;
                    return (
                      <li key={s} className={cn("flex items-center gap-3 text-[14px] transition-colors", done ? "text-ink" : active ? "text-ink" : "text-ink-4")}>
                        <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[12px] transition-all duration-300", done ? "border-sage bg-sage text-white" : active ? "border-copper text-copper" : "border-line-strong")}>
                          {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : active ? <span className="h-2 w-2 animate-pulse rounded-full bg-copper" /> : bn(i + 1)}
                        </span>
                        {s}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </Card>

        <Card hairline className="h-fit p-5">
          <h3 className="text-[16px] font-semibold text-ink">নিবন্ধনের পর যা হবে</h3>
          <ul className="mt-4 flex flex-col gap-4">
            {[
              { Icon: ListChecks, t: "তালিকায় সাথে সাথে যুক্ত", d: "অফিস থেকে নিবন্ধন হলে আলাদা অনুমোদন লাগে না।" },
              { Icon: CreditCard, t: "রেশন কার্ড নম্বর স্বয়ংক্রিয়", d: "RC-০০০০০১ ধাঁচে ক্রমিক নম্বর তৈরি হবে; কাউকে টাইপ করতে হবে না।" },
              { Icon: ShoppingBag, t: "পণ্যের আবেদন করতে পারবেন", d: "নাগরিক অ্যাপে মোবাইল নম্বর দিয়ে ঢুকে মাসিক সীমার মধ্যে আবেদন করা যাবে।" },
            ].map(({ Icon, t, d }) => (
              <li key={t} className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-petrol-soft text-petrol"><Icon className="h-4.5 w-4.5" strokeWidth={1.8} /></span>
                <span>
                  <span className="block text-[14px] font-semibold text-ink">{t}</span>
                  <span className="block text-[13px] leading-relaxed text-ink-3">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function SectionTitle({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="num grid h-7 w-7 place-items-center rounded-lg grad-copper text-[12.5px] font-bold text-white">{bn(n)}</span>
      <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
      <span className="divider ml-2 flex-1" />
    </div>
  );
}
