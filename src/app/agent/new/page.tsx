"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Minus, Plus, Smartphone, ChevronDown } from "lucide-react";
import { AgentFrame, AgentHeader, bigInput } from "@/components/agent/agent-frame";
import { ImageField } from "@/components/citizen/image-field";
import { useAgent } from "@/store/agent";
import { useData, RuleError, NID_RE, MOBILE_RE, type RegisterInput } from "@/store/data";
import { bn, en, WARD_NAME } from "@/lib/bn";
import { cn } from "@/lib/utils";

const STEP_TITLES = ["ব্যক্তিগত তথ্য", "ঠিকানা", "ডকুমেন্ট", "রিভিউ ও জমা"];
const NEXT_LABEL = ["পরবর্তী ধাপ: ঠিকানা", "পরবর্তী ধাপ: ডকুমেন্ট", "পরবর্তী ধাপ: রিভিউ"];

const blank: RegisterInput = { nameBn: "", nameEn: "", nationalId: "", mobile: "", wardId: "", mohalla: "", holding: "", address: "", familySize: 4 };
type Errors = Partial<Record<keyof RegisterInput | "confirm", string>>;

function Label({ text, error, children }: { text: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[14px] font-semibold text-ink-2">
      {text}
      {children}
      {error && <span className="text-[13px] font-medium text-brick">{error}</span>}
    </label>
  );
}

function Wizard() {
  const router = useRouter();
  const submit = useAgent((s) => s.submit);
  const wards = useData((s) => s.wards);
  const [step, setStep] = useState(0); // 0..3 form, 4 success
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [f, setF] = useState<RegisterInput>(blank);
  const [errors, setErrors] = useState<Errors>({});
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ applicationNo: string | null } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof RegisterInput>(k: K, v: RegisterInput[K]) => {
    setF((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const go = (to: number) => {
    setDir(to < step ? "back" : "fwd");
    setStep(to);
    topRef.current?.scrollIntoView({ block: "start" });
    window.scrollTo({ top: 0 });
  };

  const check = (s: number): boolean => {
    const e: Errors = {};
    if (s === 0) {
      if (!f.photoUrl) e.photoUrl = "নাগরিকের ছবি তুলুন";
      if (!f.nameBn.trim()) e.nameBn = "নাম লিখুন";
      if (!NID_RE.test(f.nationalId)) e.nationalId = "১০, ১৩ বা ১৭ ডিজিটের নম্বর দিন";
      else {
        const d = useData.getState().citizens.find((c) => c.nationalId === f.nationalId);
        if (d) e.nationalId = "এই নম্বরে আগেই নিবন্ধন হয়েছে";
      }
      if (!MOBILE_RE.test(f.mobile)) e.mobile = "০১ দিয়ে শুরু ১১ ডিজিটের নম্বর দিন";
      else if (useData.getState().citizens.some((c) => c.mobile === f.mobile)) e.mobile = "এই মোবাইল নম্বরে আগেই নিবন্ধন হয়েছে";
    }
    if (s === 1) {
      if (!f.wardId) e.wardId = "ওয়ার্ড বেছে নিন";
      if (!f.mohalla.trim()) e.mohalla = "মহল্লার নাম লিখুন";
      if (!f.address.trim()) e.address = "ঠিকানা লিখুন";
    }
    if (s === 2) {
      if (!f.idFrontUrl) e.idFrontUrl = "সামনের পাশের ছবি তুলুন";
      if (!f.idBackUrl) e.idBackUrl = "পেছনের পাশের ছবি তুলুন";
    }
    if (s === 3 && !confirm) e.confirm = "নিশ্চিত করতে টিক দিন";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (check(step)) go(step + 1);
  };

  const finish = async () => {
    if (!check(3)) return;
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      const r = submit(f);
      setResult({ applicationNo: r.applicationNo });
      go(4);
    } catch (e) {
      toast.error(e instanceof RuleError ? e.message : "জমা দেওয়া যায়নি, আবার চেষ্টা করুন");
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setF(blank);
    setConfirm(false);
    setErrors({});
    setResult(null);
    go(0);
    setDir("fwd");
  };

  const ward = wards.find((w) => w.id === f.wardId);

  /* ── success screen: no back button ── */
  if (step === 4 && result) {
    return (
      <div key="done" className="slide-fwd flex flex-1 flex-col">
        <AgentHeader compact />
        <div className="flex flex-1 flex-col items-center gap-4 px-6 py-10 text-center">
          <div className={cn("grid h-22 w-22 place-items-center rounded-full", result.applicationNo ? "bg-sage-soft text-sage" : "bg-ochre-soft text-ochre")}>
            {result.applicationNo ? <Check className="h-11 w-11" strokeWidth={2.2} /> : <Smartphone className="h-10 w-10" strokeWidth={1.8} />}
          </div>
          <h1 className="text-[24px] font-bold text-ink">{result.applicationNo ? "নিবন্ধন জমা হয়েছে" : "নিবন্ধন ফোনে জমা আছে"}</h1>
          <p className="text-[15px] leading-relaxed text-ink-3">
            {result.applicationNo ? "পৌরসভার অনুমোদন পেলে নাগরিক রেশন কার্ড পাবেন।" : "এখন ইন্টারনেট নেই। নেট এলে নিজে থেকে পাঠানো হবে, তখন আবেদন নম্বর পাবেন।"}
          </p>
          <div className="glass w-full rounded-[18px] px-4 py-1.5 text-left">
            {[
              { l: "আবেদন নং", v: result.applicationNo ? bn(result.applicationNo) : "পাঠানোর পর পাবেন", mono: !!result.applicationNo },
              { l: "নাগরিক", v: f.nameBn },
              { l: "অবস্থা", v: result.applicationNo ? "অনুমোদনের অপেক্ষায়" : "ফোনে জমা", tone: "text-ochre" },
            ].map((r, i) => (
              <div key={r.l} className={cn("flex justify-between gap-3 py-3 text-[14px]", i < 2 && "border-b border-line")}>
                <span className="text-ink-3">{r.l}</span>
                <span className={cn("text-right font-semibold text-ink", r.mono && "num", r.tone)}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-line bg-surface-solid px-5 pb-6 pt-4">
          <button type="button" onClick={restart} className="grad-copper h-[54px] rounded-[14px] text-[16px] font-bold text-white shadow-[0_10px_24px_-10px_var(--glow)]">নতুন নিবন্ধন করুন</button>
          <Link href="/agent" className="py-2 text-center text-[14px] font-medium text-ink-3 hover:text-ink">আমার নিবন্ধন তালিকা</Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="flex flex-1 flex-col">
      {/* no back button on the first screen */}
      <AgentHeader eyebrow="ফিল্ড এজেন্ট" title="নতুন নাগরিক নিবন্ধন" subtitle="সঠিক তথ্য দিয়ে সুবিধাভোগীকে তালিকাভুক্ত করুন" onBack={step > 0 ? () => go(step - 1) : undefined}>
        <div className="flex gap-1.5" aria-hidden>
          {STEP_TITLES.map((_, i) => (
            <div key={i} className="h-[5px] flex-1 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-[#e8ab86] transition-[width] duration-700 ease-[var(--ease-out)]" style={{ width: i <= step ? "100%" : "0%" }} />
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex justify-between text-[13px] text-[#cfdde0]">
          <span className="font-semibold text-white">ধাপ {bn(step + 1)}: {STEP_TITLES[step]}</span>
          <span className="num">{bn(step + 1)} / {bn(4)}</span>
        </div>
      </AgentHeader>

      <div key={step} className={cn("flex flex-1 flex-col gap-5 px-5 py-6", dir === "fwd" ? "slide-fwd" : "slide-back")}>
        {step === 0 && (
          <>
            <div className="glass flex items-center gap-4 rounded-[18px] p-3.5">
              <div className="w-[92px] shrink-0">
                <ImageField label="" value={f.photoUrl} onChange={(v) => set("photoUrl", v)} aspect="portrait" capture="user" compact />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-ink">নাগরিকের ছবি</div>
                <div className="text-[13px] text-ink-3">সামনে থেকে স্পষ্ট ছবি তুলুন</div>
                {errors.photoUrl && <div className="mt-1 text-[13px] font-medium text-brick">{errors.photoUrl}</div>}
              </div>
            </div>
            <Label text="পূর্ণ নাম" error={errors.nameBn}>
              <input value={f.nameBn} onChange={(e) => set("nameBn", e.target.value)} placeholder="জাতীয় পরিচয়পত্র অনুযায়ী নাম" className={bigInput} />
            </Label>
            <Label text="জাতীয় পরিচয়পত্র / জন্মনিবন্ধন নম্বর" error={errors.nationalId}>
              <input inputMode="numeric" value={bn(f.nationalId)} onChange={(e) => set("nationalId", en(e.target.value).replace(/\D/g, "").slice(0, 17))} placeholder="১০ বা ১৭ ডিজিটের নম্বর" className={cn(bigInput, "num")} />
            </Label>
            <Label text="মোবাইল নম্বর" error={errors.mobile}>
              <div className="flex gap-2">
                <span className="flex h-[52px] items-center rounded-[14px] border border-line-strong bg-sunken px-3.5 text-[16px] font-medium text-ink-2">+৮৮</span>
                <input inputMode="tel" value={bn(f.mobile)} onChange={(e) => set("mobile", en(e.target.value).replace(/\D/g, "").slice(0, 11))} placeholder="০১৭XXXXXXXX" className={cn(bigInput, "num min-w-0 flex-1")} />
              </div>
            </Label>
            <div className="glass flex items-center justify-between rounded-[16px] py-2.5 pl-4 pr-3">
              <span className="text-[14px] font-semibold text-ink-2">পরিবারের সদস্য সংখ্যা</span>
              <div className="flex items-center gap-3.5">
                <button type="button" onClick={() => set("familySize", Math.max(1, f.familySize - 1))} aria-label="কমান" className="grid h-11 w-11 place-items-center rounded-[12px] border border-line-strong bg-surface-solid text-ink"><Minus className="h-5 w-5" /></button>
                <span className="num min-w-6 text-center text-[20px] font-bold text-ink">{bn(f.familySize)}</span>
                <button type="button" onClick={() => set("familySize", Math.min(20, f.familySize + 1))} aria-label="বাড়ান" className="grad-copper grid h-11 w-11 place-items-center rounded-[12px] text-white"><Plus className="h-5 w-5" /></button>
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <Label text="ওয়ার্ড" error={errors.wardId}>
              <div className="relative">
                <select value={f.wardId} onChange={(e) => set("wardId", e.target.value)} className={cn(bigInput, "appearance-none pr-12")}>
                  <option value="">বেছে নিন</option>
                  {wards.map((w) => <option key={w.id} value={w.id}>{WARD_NAME(w.number)}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" />
              </div>
            </Label>
            <Label text="মহল্লা / পাড়া" error={errors.mohalla}>
              <input value={f.mohalla} onChange={(e) => set("mohalla", e.target.value)} placeholder="মহল্লার নাম" className={bigInput} />
            </Label>
            <Label text="বাড়ি / হোল্ডিং নম্বর">
              <input value={f.holding} onChange={(e) => set("holding", e.target.value)} placeholder="বাড়ির নম্বর" className={bigInput} />
            </Label>
            <Label text="বিস্তারিত ঠিকানা" error={errors.address}>
              <input value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="রাস্তা, ল্যান্ডমার্ক" className={bigInput} />
            </Label>
          </>
        )}

        {step === 2 && (
          <>
            {([["idFrontUrl", "পরিচয়পত্র (সামনের পাশ)"], ["idBackUrl", "পরিচয়পত্র (পেছনের পাশ)"]] as const).map(([k, l]) => (
              <div key={k} className="glass rounded-[18px] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-ink">{l}</span>
                  {f[k] && <span className="text-[12.5px] font-semibold text-sage">ছবি তোলা হয়েছে</span>}
                </div>
                <ImageField label="" value={f[k]} onChange={(v) => set(k, v)} hint="পুরো কার্ড ফ্রেমে রাখুন" />
                {errors[k] && <div className="mt-1.5 text-[13px] font-medium text-brick">{errors[k]}</div>}
              </div>
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <div className="glass rounded-[18px] px-4 py-1.5">
              {[
                ["নাম", f.nameBn],
                ["পরিচয়পত্র নম্বর", bn(f.nationalId)],
                ["মোবাইল", bn(f.mobile)],
                ["ওয়ার্ড / মহল্লা", `${ward ? WARD_NAME(ward.number) : ""}, ${f.mohalla}`],
                ["সদস্য সংখ্যা", `${bn(f.familySize)} জন`],
                ["ডকুমেন্ট", `${bn([f.photoUrl, f.idFrontUrl, f.idBackUrl].filter(Boolean).length)}টি ছবি সংযুক্ত`],
              ].map(([l, v], i, arr) => (
                <div key={l} className={cn("flex justify-between gap-3 py-3 text-[14px]", i < arr.length - 1 && "border-b border-line")}>
                  <span className="text-ink-3">{l}</span>
                  <span className="text-right font-semibold text-ink">{v}</span>
                </div>
              ))}
            </div>
            <div className="rounded-[14px] bg-petrol-soft px-4 py-3.5 text-[14px] leading-relaxed text-petrol">পৌরসভা অনুমোদন দিলে নাগরিক রেশন কার্ড পাবেন।</div>
            <label className="flex items-start gap-3 text-[14px] leading-relaxed text-ink">
              <input type="checkbox" checked={confirm} onChange={(e) => { setConfirm(e.target.checked); setErrors((x) => ({ ...x, confirm: undefined })); }} className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--copper)]" />
              আমি নিশ্চিত করছি যে নাগরিকের দেওয়া তথ্য যাচাই করেছি।
            </label>
            {errors.confirm && <div className="-mt-3 text-[13px] font-medium text-brick">{errors.confirm}</div>}
          </>
        )}
      </div>

      <div className="text-center text-[12px] text-ink-3">কালিয়াকৈর পৌরসভা, গাজীপুর</div>
      <div className="mt-3 flex gap-2.5 border-t border-line bg-surface-solid px-5 pb-6 pt-4">
        {step === 3 ? (
          <>
            <button type="button" onClick={() => go(2)} className="h-[54px] rounded-[14px] border border-line-strong px-5 text-[15px] font-semibold text-ink">পেছনে</button>
            <button type="button" onClick={finish} disabled={busy} className="grad-copper flex h-[54px] flex-1 items-center justify-center gap-2 rounded-[14px] text-[16px] font-bold text-white shadow-[0_10px_24px_-10px_var(--glow)] disabled:opacity-70">
              {busy && <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              নিবন্ধন জমা দিন
            </button>
          </>
        ) : (
          <button type="button" onClick={next} className="grad-copper h-[54px] flex-1 rounded-[14px] text-[16px] font-bold text-white shadow-[0_10px_24px_-10px_var(--glow)] transition-transform active:scale-[0.98]">{NEXT_LABEL[step]}</button>
        )}
      </div>
      {step === 0 && (
        <button type="button" onClick={() => router.push("/agent")} className="bg-surface-solid pb-5 text-center text-[13.5px] text-ink-3 hover:text-ink">বাতিল</button>
      )}
    </div>
  );
}

export default function AgentNewPage() {
  return (
    <AgentFrame>
      <Wizard />
    </AgentFrame>
  );
}
