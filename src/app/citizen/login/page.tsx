"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Delete, Info } from "lucide-react";
import { CitizenFrame } from "@/components/citizen-app/frame";
import { LogoMark } from "@/components/shell/logo";
import { useCitizen, type LookupResult } from "@/store/citizen";
import { useData, MOBILE_RE } from "@/store/data";
import { bn, en } from "@/lib/bn";
import { cn } from "@/lib/utils";

type Stage = "mobile" | "pin" | "card" | "newpin" | "confirmpin";

/** Banking-app style PIN pad: dots + 3×4 keys (✓ submits once 4+ digits). */
function PinPad({ value, onChange, onSubmit, busy, shake, min = 4, max = 6 }: { value: string; onChange: (v: string) => void; onSubmit: () => void; busy?: boolean; shake?: number; min?: number; max?: number }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (busy) return;
      const d = en(e.key);
      if (/^\d$/.test(d) && value.length < max) onChange(value + d);
      else if (e.key === "Backspace") onChange(value.slice(0, -1));
      else if (e.key === "Enter" && value.length >= min) onSubmit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [value, onChange, onSubmit, busy, min, max]);

  const key = "grid h-[62px] place-items-center rounded-full text-[26px] font-semibold text-ink transition-[background-color,transform] duration-150 active:scale-90 active:bg-[var(--line-strong)] hover:bg-sunken disabled:opacity-30";
  return (
    <div className="flex flex-col items-center">
      <div key={shake} className={cn("flex h-8 items-center gap-3.5", shake ? "animate-[shake_420ms_ease-in-out]" : "")} aria-live="polite" aria-label={`${bn(value.length)}টি সংখ্যা দেওয়া হয়েছে`}>
        {Array.from({ length: Math.max(min, Math.min(max, value.length + (value.length < max ? 1 : 0))) }).map((_, i) => (
          <span key={i} className={cn("rounded-full transition-all duration-300 ease-[var(--ease-spring)]", i < value.length ? "h-4 w-4 bg-[#121a1c] dark:bg-[#ece7de]" : "h-3 w-3 border-2 border-line-strong")} />
        ))}
      </div>
      <div className="mt-8 grid w-full max-w-[300px] grid-cols-3 gap-x-6 gap-y-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} type="button" disabled={busy || value.length >= max} onClick={() => onChange(value + n)} className={cn(key, "num")}>{bn(n)}</button>
        ))}
        <button type="button" onClick={onSubmit} disabled={busy || value.length < min} aria-label="নিশ্চিত" className={cn("grid h-[62px] place-items-center rounded-full transition-all duration-300 active:scale-90", value.length >= min ? "grad-copper text-white shadow-[0_10px_24px_-10px_var(--glow)]" : "text-ink-4")}>
          {busy ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Check className="h-7 w-7" strokeWidth={2.6} />}
        </button>
        <button type="button" disabled={busy || value.length >= max} onClick={() => onChange(value + "0")} className={cn(key, "num")}>{bn(0)}</button>
        <button type="button" disabled={busy || !value} onClick={() => onChange(value.slice(0, -1))} aria-label="মুছুন" className={key}><Delete className="h-6 w-6" strokeWidth={1.8} /></button>
      </div>
    </div>
  );
}

function LoginInner() {
  const router = useRouter();
  const citizenId = useCitizen((s) => s.citizenId);
  const lookup = useCitizen((s) => s.lookup);
  const login = useCitizen((s) => s.login);
  const activate = useCitizen((s) => s.activate);
  const citizens = useData((s) => s.citizens);
  const orders = useData((s) => s.orders);
  const [stage, setStage] = useState<Stage>("mobile");
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [card, setCard] = useState("");
  const [info, setInfo] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (citizenId) router.replace("/citizen");
  }, [citizenId, router]);

  const demo = useMemo(() => {
    const withPickup = orders.filter((o) => o.status === "AWAITING_PICKUP").map((o) => citizens.find((c) => c.id === o.citizenId)).find((c) => c?.pinHash);
    const fresh = citizens.find((c) => c.status === "APPROVED" && !c.pinHash);
    return { ready: withPickup ?? citizens.find((c) => c.pinHash), fresh };
  }, [citizens, orders]);

  const fail = (msg: string) => {
    setError(msg);
    setShake((n) => n + 1);
  };

  const next = () => {
    setError(null);
    if (!MOBILE_RE.test(mobile)) return fail("০১ দিয়ে শুরু ১১ সংখ্যার মোবাইল নম্বর দিন");
    const r = lookup(mobile);
    setInfo(r);
    if (r.kind === "READY") setStage("pin");
    else if (r.kind === "NEEDS_ACTIVATION") setStage("card");
  };

  const doLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      await login(mobile, pin);
      router.replace("/citizen");
    } catch (e) {
      fail(e instanceof Error ? e.message : "প্রবেশ করা যায়নি");
      setPin("");
      setBusy(false);
    }
  };

  const doActivate = async () => {
    setError(null);
    if (pin !== newPin) {
      fail("দুইবার দেওয়া পিন মেলেনি, আবার ঠিক করুন");
      setPin("");
      setNewPin("");
      setStage("newpin");
      return;
    }
    setBusy(true);
    try {
      await activate(mobile, card, newPin);
      router.replace("/citizen");
    } catch (e) {
      fail(e instanceof Error ? e.message : "চালু করা যায়নি");
      setBusy(false);
      setPin("");
      setNewPin("");
      setStage(e instanceof Error && e.message.includes("কার্ড") ? "card" : "newpin");
    }
  };

  const back = () => {
    setError(null);
    setPin("");
    if (stage === "confirmpin") { setStage("newpin"); setNewPin(""); return; }
    if (stage === "newpin") { setStage("card"); return; }
    setStage("mobile");
    setInfo(null);
    setCard("");
    setNewPin("");
  };

  const name = info && "name" in info ? info.name.replace(/^(মোছাঃ|মোঃ)\s*/, "") : "";

  if (stage === "mobile") {
    return (
      <div className="flex flex-1 flex-col">
        {/* hero */}
        <div className="relative overflow-hidden px-6 pb-8 pt-10">
          <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(201,126,82,.35),transparent_65%)] blur-2xl" />
          <div aria-hidden className="absolute -left-20 top-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(47,107,120,.3),transparent_65%)] blur-2xl" />
          <div className="relative animate-[rise_700ms_var(--ease-out)_both]">
            <div className="w-fit rounded-[22px] bg-surface-solid p-2 shadow-[var(--shadow-md)]"><LogoMark size={52} /></div>
            <h1 className="mt-7 text-[34px] font-bold leading-[1.15] tracking-tight text-ink">আপনার রেশন,<br /><span className="grad-text">আপনার হাতে</span></h1>
            <p className="mt-3 max-w-[300px] text-[15px] leading-relaxed text-ink-3">কালিয়াকৈর পৌরসভার ন্যায্যমূল্যের পণ্য এখন মোবাইলে আবেদন করুন।</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 px-6 pb-6 animate-[rise_700ms_var(--ease-out)_120ms_both]">
          <label className="text-[13.5px] font-semibold text-ink-2" htmlFor="mobile">মোবাইল নম্বর</label>
          <div key={shake} className={cn("-mt-2 flex h-[60px] items-center gap-3 rounded-full border-2 bg-surface-solid px-5 transition-colors focus-within:border-copper", error ? "border-brick animate-[shake_420ms_ease-in-out]" : "border-line")}>
            <span className="num text-[17px] font-semibold text-ink-3">+৮৮</span>
            <span className="h-6 w-px bg-line-strong" />
            <input id="mobile" inputMode="tel" autoFocus value={bn(mobile)} onChange={(e) => { setMobile(en(e.target.value).replace(/\D/g, "").slice(0, 11)); setInfo(null); setError(null); }} onKeyDown={(e) => e.key === "Enter" && next()} placeholder="০১৭XXXXXXXX" className="num h-full min-w-0 flex-1 bg-transparent text-[19px] font-semibold tracking-wide text-ink outline-none placeholder:font-normal placeholder:text-ink-4 focus-visible:outline-none" />
          </div>
          {error && <div role="alert" className="text-[13.5px] font-medium text-brick">{error}</div>}
          {info && info.kind !== "READY" && info.kind !== "NEEDS_ACTIVATION" && (
            <div className={cn("flex items-start gap-3 rounded-[20px] px-4 py-3.5 text-[14px] leading-relaxed animate-[rise_400ms_var(--ease-out)]", info.kind === "PENDING" ? "bg-ochre-soft text-ochre" : info.kind === "REJECTED" ? "bg-brick-soft text-brick" : "bg-sunken text-ink-2")}>
              <Info className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.8} />
              <span>
                {info.kind === "PENDING" && <><b>{info.name}</b>, আপনার নিবন্ধন পৌরসভা যাচাই করছে। অনুমোদন হলে প্রবেশ করতে পারবেন।</>}
                {info.kind === "REJECTED" && <><b>{info.name}</b>, আপনার নিবন্ধন গ্রহণ করা যায়নি।{info.reason && <> কারণ: {info.reason}।</>} পৌরসভা অফিসে যোগাযোগ করুন।</>}
                {info.kind === "NOT_FOUND" && <>এই নম্বরে কোনো নিবন্ধন পাওয়া যায়নি। ওয়ার্ডের ফিল্ড এজেন্ট বা পৌরসভা অফিসে যোগাযোগ করুন।</>}
              </span>
            </div>
          )}
          <button type="button" onClick={next} disabled={mobile.length < 11} className="flex h-[60px] items-center justify-between rounded-full bg-[#121a1c] pl-6 pr-2 text-[16.5px] font-bold text-white shadow-[0_18px_36px_-16px_rgba(18,26,28,.7)] transition-[transform,opacity] active:scale-[0.985] disabled:opacity-40 dark:bg-[#ece7de] dark:text-[#121a1c]">
            এগিয়ে যান
            <span className="grad-copper grid h-11 w-11 place-items-center rounded-full text-white"><ArrowRight className="h-5 w-5" strokeWidth={2.4} /></span>
          </button>
          <div className="mt-auto rounded-[20px] border border-dashed border-line-strong p-3.5 text-[12.5px] leading-relaxed text-ink-3">
            <div className="font-semibold text-ink-2">ডেমো</div>
            {demo.ready && <button type="button" onClick={() => setMobile(demo.ready!.mobile)} className="num block text-left hover:text-ink">পিন দিয়ে: {bn(demo.ready.mobile)} · পিন ১২৩৪</button>}
            {demo.fresh && <button type="button" onClick={() => setMobile(demo.fresh!.mobile)} className="num block text-left hover:text-ink">প্রথমবার: {bn(demo.fresh.mobile)} · কার্ড {bn(demo.fresh.rationCardNo ?? "")}</button>}
          </div>
        </div>
      </div>
    );
  }

  const titles: Record<Exclude<Stage, "mobile">, { t: string; s: string }> = {
    pin: { t: `স্বাগতম, ${name}`, s: "আপনার পিন দিন" },
    card: { t: "প্রথমবার চালু করুন", s: "আপনার রেশন কার্ডের নম্বর দিন" },
    newpin: { t: "নিজের পিন ঠিক করুন", s: "৪ থেকে ৬ সংখ্যা, যা শুধু আপনি জানবেন" },
    confirmpin: { t: "পিন আবার দিন", s: "নিশ্চিত হতে একই পিন আবার দিন" },
  };
  const step = { card: 1, newpin: 2, confirmpin: 3 } as Record<string, number>;

  return (
    <div className="flex flex-1 flex-col px-6 pb-8 pt-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={back} aria-label="পেছনে" className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface-solid text-ink hover:bg-sunken"><ArrowLeft className="h-5 w-5" /></button>
        {step[stage] && (
          <div className="flex gap-1.5" aria-label={`ধাপ ${bn(step[stage])} / ৩`}>
            {[1, 2, 3].map((i) => <span key={i} className={cn("h-1.5 rounded-full transition-all duration-500", i <= step[stage] ? "w-6 bg-copper" : "w-1.5 bg-line-strong")} />)}
          </div>
        )}
        <span className="num text-[13px] text-ink-3">{bn(mobile)}</span>
      </div>

      <div key={stage} className="mt-10 flex flex-1 flex-col animate-[rise_520ms_var(--ease-out)_both]">
        <h1 className="text-center text-[26px] font-bold leading-tight tracking-tight text-ink">{titles[stage].t}</h1>
        <p className="mt-2 text-center text-[14.5px] text-ink-3">{titles[stage].s}</p>

        <div className="mt-10 flex flex-1 flex-col">
          {stage === "card" ? (
            <div className="flex flex-col gap-4">
              <div key={shake} className={cn("mx-auto flex h-[68px] w-full items-center justify-center gap-2 rounded-[22px] border-2 bg-surface-solid px-4 focus-within:border-copper", error ? "border-brick animate-[shake_420ms_ease-in-out]" : "border-line")}>
                <span className="num text-[22px] font-bold text-ink-4">RC-</span>
                <input inputMode="numeric" autoFocus value={bn(card)} onChange={(e) => { setCard(en(e.target.value).replace(/\D/g, "").slice(0, 6)); setError(null); }} onKeyDown={(e) => e.key === "Enter" && card && setStage("newpin")} placeholder="০০০০১২" className="num w-[150px] bg-transparent text-[26px] font-bold tracking-[0.12em] text-ink outline-none placeholder:text-ink-4 focus-visible:outline-none" />
              </div>
              <p className="text-center text-[13px] text-ink-3">নম্বরটি অনুমোদনের বার্তায় বা পৌরসভার কার্ডে আছে</p>
              {error && <div role="alert" className="text-center text-[14px] font-medium text-brick">{error}</div>}
              <button type="button" disabled={!card} onClick={() => { setError(null); setStage("newpin"); }} className="mt-auto flex h-[60px] items-center justify-center gap-2 rounded-full bg-[#121a1c] text-[16.5px] font-bold text-white disabled:opacity-40 dark:bg-[#ece7de] dark:text-[#121a1c]">এগিয়ে যান <ArrowRight className="h-5 w-5" /></button>
            </div>
          ) : (
            <>
              <PinPad
                value={stage === "confirmpin" ? pin : stage === "newpin" ? newPin : pin}
                onChange={(v) => { setError(null); if (stage === "newpin") setNewPin(v); else setPin(v); }}
                onSubmit={() => {
                  if (stage === "pin") doLogin();
                  else if (stage === "newpin") {
                    if (/^(\d)\1+$/.test(newPin) || "0123456789".includes(newPin)) { fail("সহজে আন্দাজ করা যায় এমন পিন দেবেন না"); setNewPin(""); return; }
                    setStage("confirmpin");
                  } else doActivate();
                }}
                busy={busy}
                shake={shake}
              />
              <div className="mt-5 min-h-[22px] text-center text-[14px] font-medium text-brick" role="alert">{error}</div>
              {stage === "pin" && <p className="mt-auto text-center text-[13px] text-ink-3">পিন ভুলে গেলে পৌরসভা অফিসে যোগাযোগ করুন</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CitizenLoginPage() {
  return (
    <CitizenFrame requireAuth={false} tabs={false}>
      <LoginInner />
    </CitizenFrame>
  );
}
