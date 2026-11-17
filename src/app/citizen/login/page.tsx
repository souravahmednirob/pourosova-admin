"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Info, KeyRound, ShieldCheck } from "lucide-react";
import { CitizenFrame } from "@/components/citizen-app/frame";
import { AgentHeader, bigInput } from "@/components/agent/agent-frame";
import { Button } from "@/components/ui/button";
import { useCitizen, type LookupResult } from "@/store/citizen";
import { useData, MOBILE_RE } from "@/store/data";
import { bn, en } from "@/lib/bn";
import { cn } from "@/lib/utils";

type Stage = "mobile" | "pin" | "activate";

function PinInput({ value, onChange, label, autoFocus }: { value: string; onChange: (v: string) => void; label: string; autoFocus?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5 text-[14px] font-semibold text-ink-2">
      {label}
      <input
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(en(e.target.value).replace(/\D/g, "").slice(0, 6))}
        className={cn(bigInput, "num text-center text-[24px] tracking-[0.5em]")}
        placeholder="••••"
      />
    </label>
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
  const [pin2, setPin2] = useState("");
  const [card, setCard] = useState("");
  const [info, setInfo] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (citizenId) router.replace("/citizen");
  }, [citizenId, router]);

  // sample accounts for the demo
  const demo = useMemo(() => {
    const withPickup = orders.filter((o) => o.status === "AWAITING_PICKUP").map((o) => citizens.find((c) => c.id === o.citizenId)).find((c) => c?.pinHash);
    const fresh = citizens.find((c) => c.status === "APPROVED" && !c.pinHash);
    return { ready: withPickup ?? citizens.find((c) => c.pinHash), fresh };
  }, [citizens, orders]);

  const next = () => {
    setError(null);
    if (!MOBILE_RE.test(mobile)) {
      setError("০১ দিয়ে শুরু ১১ সংখ্যার মোবাইল নম্বর দিন");
      return;
    }
    const r = lookup(mobile);
    setInfo(r);
    if (r.kind === "READY") setStage("pin");
    else if (r.kind === "NEEDS_ACTIVATION") setStage("activate");
  };

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(mobile, pin);
      router.replace("/citizen");
    } catch (err) {
      setError(err instanceof Error ? err.message : "প্রবেশ করা যায়নি");
      setPin("");
      setBusy(false);
    }
  };

  const doActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pin !== pin2) {
      setError("দুইবার দেওয়া পিন মেলেনি");
      return;
    }
    setBusy(true);
    try {
      await activate(mobile, en(card), pin);
      router.replace("/citizen");
    } catch (err) {
      setError(err instanceof Error ? err.message : "চালু করা যায়নি");
      setBusy(false);
    }
  };

  const back = () => {
    setStage("mobile");
    setPin("");
    setPin2("");
    setCard("");
    setError(null);
    setInfo(null);
  };

  return (
    <>
      <AgentHeader eyebrow="নাগরিক" title={stage === "activate" ? "অ্যাপ চালু করুন" : "স্বাগতম"} subtitle={stage === "mobile" ? "মোবাইল নম্বর দিয়ে প্রবেশ করুন" : info && "name" in info ? info.name : undefined} onBack={stage !== "mobile" ? back : undefined} />

      <div key={stage} className="slide-fwd flex flex-1 flex-col gap-4 px-5 py-6">
        {stage === "mobile" && (
          <>
            <label className="flex flex-col gap-1.5 text-[14px] font-semibold text-ink-2">
              মোবাইল নম্বর
              <div className="flex gap-2">
                <span className="flex h-[52px] items-center rounded-[14px] border border-line-strong bg-sunken px-3.5 text-[16px] font-medium text-ink-2">+৮৮</span>
                <input inputMode="tel" autoFocus value={bn(mobile)} onChange={(e) => { setMobile(en(e.target.value).replace(/\D/g, "").slice(0, 11)); setInfo(null); setError(null); }} onKeyDown={(e) => e.key === "Enter" && next()} placeholder="০১৭XXXXXXXX" className={cn(bigInput, "num min-w-0 flex-1")} />
              </div>
            </label>
            {info && info.kind !== "READY" && info.kind !== "NEEDS_ACTIVATION" && (
              <div className={cn("flex items-start gap-3 rounded-2xl px-4 py-3.5 text-[14px] leading-relaxed", info.kind === "PENDING" ? "bg-ochre-soft text-ochre" : info.kind === "REJECTED" ? "bg-brick-soft text-brick" : "bg-sunken text-ink-2")}>
                <Info className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.8} />
                <span>
                  {info.kind === "PENDING" && <><b>{info.name}</b>, আপনার নিবন্ধন পৌরসভা যাচাই করছে। অনুমোদন হলে এখানে প্রবেশ করতে পারবেন।</>}
                  {info.kind === "REJECTED" && <><b>{info.name}</b>, আপনার নিবন্ধন গ্রহণ করা যায়নি।{info.reason && <> কারণ: {info.reason}।</>} পৌরসভা অফিসে যোগাযোগ করুন।</>}
                  {info.kind === "NOT_FOUND" && <>এই নম্বরে কোনো নিবন্ধন পাওয়া যায়নি। নিবন্ধনের জন্য ওয়ার্ডের ফিল্ড এজেন্ট বা পৌরসভা অফিসে যোগাযোগ করুন।</>}
                </span>
              </div>
            )}
            {error && <div role="alert" className="rounded-xl bg-brick-soft px-4 py-3 text-[14px] font-medium text-brick">{error}</div>}
            <Button size="lg" onClick={next} className="h-[54px] rounded-[14px] text-[16px]">এগিয়ে যান <ArrowRight className="h-5 w-5" strokeWidth={2} /></Button>
          </>
        )}

        {stage === "pin" && (
          <form onSubmit={doLogin} className="flex flex-col gap-4">
            <div className="num text-[14px] text-ink-3">মোবাইল: {bn(mobile)}</div>
            <PinInput label="আপনার পিন" value={pin} onChange={(v) => { setPin(v); setError(null); }} autoFocus />
            {error && <div role="alert" className="rounded-xl bg-brick-soft px-4 py-3 text-[14px] font-medium text-brick">{error}</div>}
            <Button type="submit" size="lg" loading={busy} disabled={pin.length < 4} className="h-[54px] rounded-[14px] text-[16px]">প্রবেশ করুন</Button>
            <p className="text-center text-[13px] text-ink-3">পিন ভুলে গেলে পৌরসভা অফিসে যোগাযোগ করুন।</p>
          </form>
        )}

        {stage === "activate" && (
          <form onSubmit={doActivate} className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-2xl bg-petrol-soft px-4 py-3.5 text-[14px] leading-relaxed text-petrol">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.8} />
              প্রথমবার ঢুকছেন। রেশন কার্ডের নম্বর দিন আর নিজের একটি পিন ঠিক করুন। পরের বার শুধু পিন লাগবে।
            </div>
            <label className="flex flex-col gap-1.5 text-[14px] font-semibold text-ink-2">
              রেশন কার্ড নম্বর
              <div className="flex gap-2">
                <span className="num flex h-[52px] items-center rounded-[14px] border border-line-strong bg-sunken px-3.5 text-[16px] font-medium text-ink-2">RC-</span>
                <input inputMode="numeric" autoFocus value={bn(card)} onChange={(e) => { setCard(en(e.target.value).replace(/\D/g, "").slice(0, 6)); setError(null); }} placeholder="০০০০১২" className={cn(bigInput, "num min-w-0 flex-1")} />
              </div>
            </label>
            <PinInput label="নতুন পিন (৪–৬ সংখ্যা)" value={pin} onChange={(v) => { setPin(v); setError(null); }} />
            <PinInput label="পিন আবার দিন" value={pin2} onChange={(v) => { setPin2(v); setError(null); }} />
            {error && <div role="alert" className="rounded-xl bg-brick-soft px-4 py-3 text-[14px] font-medium text-brick">{error}</div>}
            <Button type="submit" size="lg" loading={busy} disabled={!card || pin.length < 4 || pin2.length < 4} className="h-[54px] rounded-[14px] text-[16px]"><KeyRound className="h-5 w-5" strokeWidth={1.8} /> চালু করুন</Button>
          </form>
        )}

        {stage === "mobile" && (
          <div className="mt-auto rounded-2xl border border-dashed border-line-strong p-3.5 text-[12.5px] leading-relaxed text-ink-3">
            <div className="font-semibold text-ink-2">ডেমো</div>
            {demo.ready && <button type="button" onClick={() => setMobile(demo.ready!.mobile)} className="num block text-left hover:text-ink">পিন দিয়ে: {bn(demo.ready.mobile)} · পিন ১২৩৪</button>}
            {demo.fresh && <button type="button" onClick={() => setMobile(demo.fresh!.mobile)} className="num block text-left hover:text-ink">প্রথমবার: {bn(demo.fresh.mobile)} · কার্ড {bn(demo.fresh.rationCardNo ?? "")}</button>}
          </div>
        )}
      </div>
    </>
  );
}

export default function CitizenLoginPage() {
  return (
    <CitizenFrame requireAuth={false} tabs={false}>
      <LoginInner />
    </CitizenFrame>
  );
}
