"use client";
import { Suspense, use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, Banknote, Check, Maximize2, Navigation, ScanLine, X } from "lucide-react";
import { CitizenFrame } from "@/components/citizen-app/frame";
import { ProductArt } from "@/components/citizen-app/product-art";
import { Stagger, useCountdown } from "@/components/citizen-app/ui";
import { LiveQR, DeadlineRing, SlideToConfirm, FullscreenTicket } from "@/components/citizen-app/pickup";
import { haptic } from "@/components/citizen-app/product-sheet";
import { useMe } from "@/components/citizen-app/hooks";
import { Pill } from "@/components/ui/primitives";
import { useData, RuleError } from "@/store/data";
import { ORDER_STATUS_LABEL, UNIT_LABEL } from "@/lib/types";
import { orderTotals, orderTone } from "@/lib/orders";
import { bn, en, taka, fmtDateTime } from "@/lib/bn";
import { cn } from "@/lib/utils";

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (o: { formats: string[] }) => Detector;

function CodeBoxes({ value, onChange, invalid, focusKey }: { value: string; onChange: (v: string) => void; invalid?: boolean; focusKey?: number }) {
  const ref = useRef<HTMLInputElement>(null);
  // after a wrong attempt, put the cursor back so the citizen can retype straight away
  useEffect(() => {
    if (focusKey) ref.current?.focus();
  }, [focusKey]);
  return (
    <div className="relative" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        autoFocus
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="৬ সংখ্যার কোড"
        value={value}
        onChange={(e) => onChange(en(e.target.value).replace(/\D/g, "").slice(0, 6))}
        className="absolute inset-0 h-full w-full opacity-0"
      />
      <div className="grid grid-cols-6 gap-2" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn("num grid h-14 place-items-center rounded-[14px] border-2 bg-surface-solid text-[24px] font-bold text-ink transition-colors", invalid ? "border-brick" : i === value.length ? "border-copper" : value[i] ? "border-line-strong" : "border-line")}>
            {value[i] ? bn(value[i]) : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfirmSheet({ open, onOpenChange, orderId }: { open: boolean; onOpenChange: (o: boolean) => void; orderId: string }) {
  const confirm = useData((s) => s.confirmCollection);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canScan = typeof window !== "undefined" && "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia;

  const stopScan = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };
  useEffect(() => () => stopScan(), []);

  const submit = async (value: string, via: "APP_CODE" | "APP_QR") => {
    setError(null);
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      confirm(orderId, value, via);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof RuleError ? e.message : "নিশ্চিত করা যায়নি");
      setCode("");
      setAttempt((n) => n + 1);
    } finally {
      setBusy(false);
    }
  };

  const startScan = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setScanning(true);
      requestAnimationFrame(async () => {
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play();
        const Ctor = (window as unknown as { BarcodeDetector: DetectorCtor }).BarcodeDetector;
        const det = new Ctor({ formats: ["qr_code"] });
        const loop = async () => {
          if (!streamRef.current) return;
          const hits = await det.detect(v).catch(() => []);
          const m = hits[0]?.rawValue.match(/^KPR:[^:]+:(\d{6})$/);
          if (m) {
            stopScan();
            submit(m[1], "APP_QR");
            return;
          }
          requestAnimationFrame(loop);
        };
        loop();
      });
    } catch {
      setError("ক্যামেরা চালু করা যায়নি। কোড লিখে দিন।");
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!o) stopScan(); onOpenChange(o); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[rgba(10,17,20,0.4)] backdrop-blur-[2px] data-[state=open]:animate-[fade-in_200ms_var(--ease-out)]" />
        <DialogPrimitive.Content className="glass-strong fixed bottom-0 left-1/2 z-[71] w-full max-w-[430px] -translate-x-1/2 rounded-b-none rounded-t-[28px] p-5 pb-[max(20px,env(safe-area-inset-bottom))] outline-none data-[state=open]:animate-[sheet-up_420ms_var(--ease-spring)]">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line-strong" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogPrimitive.Title className="text-[20px] font-bold text-ink">সংগ্রহ নিশ্চিত করুন</DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-[14px] leading-relaxed text-ink-3">পণ্য হাতে পেয়েছেন? বিতরণ কেন্দ্রে দেখানো ৬ সংখ্যার কোড লিখুন বা QR স্ক্যান করুন।</DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close aria-label="বন্ধ" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-3 hover:bg-sunken"><X className="h-5 w-5" /></DialogPrimitive.Close>
          </div>

          {scanning ? (
            <div className="relative mt-4 overflow-hidden rounded-[18px] bg-black">
              <video ref={videoRef} playsInline muted className="aspect-square w-full object-cover" />
              <div className="pointer-events-none absolute inset-10 rounded-2xl border-2 border-white/80" />
              <button type="button" onClick={stopScan} className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-[14px] font-semibold text-ink">কোড লিখে দেব</button>
            </div>
          ) : (
            <div className="mt-5">
              <CodeBoxes value={code} onChange={(v) => { setCode(v); setError(null); }} invalid={!!error} focusKey={attempt} />
            </div>
          )}
          {error && <div role="alert" className="mt-3 rounded-xl bg-brick-soft px-4 py-3 text-[14px] font-medium text-brick">{error}</div>}
          {!scanning && (
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" onClick={() => submit(code, "APP_CODE")} disabled={code.length !== 6 || busy} className="grad-copper flex h-[56px] items-center justify-center gap-2 rounded-full text-[16px] font-bold text-white shadow-[0_14px_30px_-14px_var(--glow)] disabled:opacity-50">
                {busy && <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                হ্যাঁ, পণ্য পেয়েছি
              </button>
              {canScan && (
                <button type="button" onClick={startScan} className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-line-strong text-[15px] font-semibold text-ink">
                  <ScanLine className="h-5 w-5" strokeWidth={1.8} /> QR স্ক্যান করুন
                </button>
              )}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function OrderDetail({ id }: { id: string }) {
  const params = useSearchParams();
  const { orders, citizen } = useMe();
  const products = useData((s) => s.products);
  const points = useData((s) => s.points);
  const [sheet, setSheet] = useState(false);
  const [full, setFull] = useState(false);
  const [got, setGot] = useState<Set<string>>(new Set());
  const o = orders.find((x) => x.id === id);
  const [justCollected, setJustCollected] = useState(false);
  const prevStatus = useRef(o?.status);
  const cd = useCountdown(o?.pickupDeadline);

  useEffect(() => {
    if (prevStatus.current === "AWAITING_PICKUP" && o?.status === "COLLECTED") queueMicrotask(() => setJustCollected(true));
    prevStatus.current = o?.status;
  }, [o?.status]);

  if (!o) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="text-[16px] font-semibold text-ink-2">অর্ডারটি পাওয়া যায়নি</div>
        <Link href="/citizen/orders" className="font-semibold text-copper-deep dark:text-copper">অর্ডারে ফিরে যান</Link>
      </div>
    );
  }
  const t = orderTotals(o);
  const point = points.find((p) => p.id === o.pickupPointId);
  const isNew = params.get("new") === "1" && o.status === "PENDING";
  const steps = [
    { label: "আবেদন জমা", at: o.appliedAt, state: "done" as const },
    o.status === "CANCELLED"
      ? { label: "বাতিল হয়েছে", at: o.cancelledAt, state: "bad" as const, note: o.rejectReason }
      : { label: o.approvedAt ? "অনুমোদিত" : "পৌরসভা দেখছে", at: o.approvedAt, state: o.approvedAt ? ("done" as const) : ("now" as const) },
    { label: o.collectedAt ? "সংগ্রহ সম্পন্ন" : "পণ্য সংগ্রহ", at: o.collectedAt, state: o.collectedAt ? ("done" as const) : o.status === "AWAITING_PICKUP" ? ("now" as const) : ("off" as const) },
  ];

  return (
    <div className="flex flex-col gap-4 px-5 pb-6 pt-6">
      <Stagger i={0} className="flex items-center gap-3">
        <Link href="/citizen/orders" aria-label="অর্ডারে ফিরে যান" className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface-solid text-ink transition-colors hover:bg-sunken"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="min-w-0 flex-1">
          <div className="num text-[18px] font-bold leading-tight text-ink">{bn(o.orderNo)}</div>
          <div className="text-[12.5px] text-ink-3">{fmtDateTime(o.appliedAt)}</div>
        </div>
        <Pill tone={orderTone[o.status]} dot>{ORDER_STATUS_LABEL[o.status]}</Pill>
      </Stagger>

      {isNew && (
        <Stagger i={1} className="relative overflow-hidden rounded-[24px] bg-sage-soft p-5 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sage text-white animate-[modal-pop_600ms_var(--ease-spring)] dark:text-[#0a1114]"><Check className="h-7 w-7" strokeWidth={3} /></div>
          <div className="mt-3 text-[18px] font-bold text-ink">আবেদন পাঠানো হয়েছে</div>
          <div className="mt-1 text-[13.5px] text-ink-2">পৌরসভা অনুমোদন দিলে এখানে সংগ্রহের টিকিট আসবে।</div>
        </Stagger>
      )}

      {/* pickup mode: ticket → show at counter → tick items → slide to confirm */}
      {o.status === "AWAITING_PICKUP" && (
        <>
          <Stagger i={1} className="relative overflow-hidden rounded-[30px] bg-[#0b171b] text-white shadow-[0_30px_60px_-28px_rgba(11,23,27,.9)]">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(90%_60%_at_100%_0%,rgba(201,126,82,.42),transparent_60%),radial-gradient(80%_60%_at_0%_100%,rgba(47,107,120,.55),transparent_60%)]" />
            <div aria-hidden className="absolute inset-0 opacity-[.06] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:22px_22px]" />
            <div className="relative px-5 pb-6 pt-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.22em] text-white/60"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8cc39a]" /> সংগ্রহ মোড</span>
                <button type="button" onClick={() => setFull(true)} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-semibold ring-1 ring-white/15 transition-colors hover:bg-white/15"><Maximize2 className="h-3.5 w-3.5" /> বড় করে দেখান</button>
              </div>
              <div className="mt-6"><LiveQR value={`KPR:${o.orderNo}:${o.pickupCode}`} /></div>
              <div className="mt-5 text-center text-[12px] text-white/55">কাউন্টারে QR দেখান বা কোডটি বলুন</div>
              <div className="num mt-1.5 flex justify-center gap-1.5">
                {(o.pickupCode ?? "").split("").map((d, i) => (
                  <span key={i} className={cn("grid h-12 w-10 place-items-center rounded-xl bg-white/[.08] text-[26px] font-bold ring-1 ring-white/15 backdrop-blur", i === 2 && "mr-2")}>{bn(d)}</span>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between gap-3 rounded-[20px] bg-white/[.06] p-3 ring-1 ring-white/10">
                <DeadlineRing start={o.approvedAt!} end={o.pickupDeadline!}>
                  <div className={cn("text-[15px] font-bold", cd.urgent && "text-[#ffb3a7]")}>{cd.text}</div>
                  <div className="text-[12px] text-white/55">শেষ সময় {fmtDateTime(o.pickupDeadline!)}</div>
                </DeadlineRing>
              </div>
            </div>
          </Stagger>

          {/* step 1 — where */}
          <Stagger i={2} className="rounded-[26px] border border-line bg-surface-solid p-4">
            <div className="flex items-start gap-3">
              <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#121a1c] text-[14px] font-bold text-white dark:bg-[#ece7de] dark:text-[#121a1c]">১</span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold text-ink">{point?.name}</div>
                <div className="text-[13px] text-ink-3">{point?.address} · {point?.openHours}</div>
                <div className="mt-3 flex gap-2">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${point?.name}, ${point?.address}`)}`} target="_blank" rel="noreferrer" className="flex h-10 items-center gap-1.5 rounded-full bg-sunken px-4 text-[13.5px] font-semibold text-ink transition-colors hover:bg-[var(--line-strong)]"><Navigation className="h-4 w-4" strokeWidth={1.8} /> পথ দেখুন</a>
                  <span className="flex h-10 items-center gap-1.5 rounded-full bg-copper-soft px-4 text-[13.5px] font-semibold text-copper-deep dark:text-copper"><Banknote className="h-4 w-4" strokeWidth={1.8} /> নগদ <span className="num">{taka(t.total)}</span></span>
                </div>
              </div>
            </div>
          </Stagger>

          {/* step 2 — tick items as you receive them */}
          <Stagger i={3} className="rounded-[26px] border border-line bg-surface-solid p-4">
            <div className="flex items-start gap-3">
              <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#121a1c] text-[14px] font-bold text-white dark:bg-[#ece7de] dark:text-[#121a1c]">২</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-[15px] font-bold text-ink">পণ্য বুঝে নিন</div>
                  <div className="num text-[12.5px] text-ink-3">{bn(got.size)}/{bn(o.items.length)} মিলেছে</div>
                </div>
                <div className="text-[13px] text-ink-3">হাতে পেলে প্রতিটায় টিক দিন</div>
                <ul className="mt-3 flex flex-col gap-2">
                  {o.items.map((it) => {
                    const p = products.find((x) => x.id === it.productId);
                    const on = got.has(it.productId);
                    return (
                      <li key={it.productId}>
                        <button type="button" aria-pressed={on} onClick={() => { haptic(); setGot((g) => { const n = new Set(g); if (n.has(it.productId)) n.delete(it.productId); else n.add(it.productId); return n; }); }} className={cn("flex w-full items-center gap-3 rounded-[18px] border-2 p-2 pr-3 text-left transition-all duration-300", on ? "border-sage-2 bg-sage-soft" : "border-transparent bg-sunken")}>
                          {p && <ProductArt product={p} size={30} className="h-11 w-11 shrink-0 rounded-[13px]" />}
                          <span className="min-w-0 flex-1">
                            <span className={cn("block truncate text-[14.5px] font-semibold", on ? "text-sage" : "text-ink")}>{p?.name}</span>
                            <span className="num block text-[12.5px] text-ink-3">{bn(it.quantity)} {p ? UNIT_LABEL[p.unit] : ""}</span>
                          </span>
                          <span className={cn("grid h-7 w-7 place-items-center rounded-full border-2 transition-all duration-300 ease-[var(--ease-spring)]", on ? "scale-110 border-sage bg-sage text-white" : "border-line-strong")}>{on && <Check className="h-4 w-4" strokeWidth={3} />}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </Stagger>

          {/* step 3 — confirm */}
          <Stagger i={4}>
            <SlideToConfirm label="টেনে নিশ্চিত করুন, পণ্য পেয়েছি" hint="আগে সব পণ্যে টিক দিন" disabled={got.size < o.items.length} onDone={() => setSheet(true)} />
            <p className="mt-2 text-center text-[12.5px] text-ink-3">{got.size < o.items.length ? "সব পণ্য হাতে পেলে টিক দিয়ে নিশ্চিত করুন" : "এরপর কাউন্টারের কোডটি দিন"}</p>
          </Stagger>

          <FullscreenTicket open={full} onOpenChange={setFull} qr={`KPR:${o.orderNo}:${o.pickupCode}`} code={o.pickupCode ?? ""} orderNo={o.orderNo} name={citizen.nameBn} />
        </>
      )}

      {o.status === "COLLECTED" && (
        <Stagger i={1} className={cn("relative overflow-hidden rounded-[24px] bg-sage-soft p-5", justCollected && "animate-[modal-pop_600ms_var(--ease-spring)]")}>
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-sage text-white dark:text-[#0a1114]"><Check className="h-7 w-7" strokeWidth={3} /></span>
            <div>
              <div className="text-[18px] font-bold text-ink">{justCollected ? "ধন্যবাদ! সংগ্রহ সম্পন্ন" : "সংগ্রহ সম্পন্ন"}</div>
              <div className="text-[13px] text-ink-2">{point?.name} · {fmtDateTime(o.collectedAt!)}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-solid/70 px-4 py-3">
            <span className="text-[13.5px] text-ink-2">এই অর্ডারে সাশ্রয়</span>
            <span className="num text-[20px] font-bold text-sage">{taka(t.saving)}</span>
          </div>
        </Stagger>
      )}

      {/* timeline */}
      <Stagger i={2} className="rounded-[24px] border border-line bg-surface-solid p-5">
        <h2 className="mb-4 text-[15px] font-bold text-ink">অগ্রগতি</h2>
        <ol className="relative">
          {steps.map((s, i) => (
            <li key={i} className="relative flex gap-3.5 pb-5 last:pb-0">
              {i < steps.length - 1 && <span aria-hidden className={cn("absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5 rounded-full", steps[i + 1].state === "off" ? "bg-line-strong" : steps[i + 1].state === "bad" ? "bg-brick-2" : "bg-sage-2")} />}
              <span className={cn("relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2", s.state === "done" && "border-sage bg-sage text-white", s.state === "bad" && "border-brick bg-brick text-white", s.state === "now" && "border-copper bg-surface-solid", s.state === "off" && "border-line-strong bg-surface-solid")}>
                {s.state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : s.state === "bad" ? <X className="h-3.5 w-3.5" strokeWidth={3} /> : s.state === "now" ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-copper" /> : null}
              </span>
              <div className="pt-0.5">
                <div className={cn("text-[14.5px] font-semibold", s.state === "off" ? "text-ink-4" : s.state === "bad" ? "text-brick" : "text-ink")}>{s.label}</div>
                <div className="text-[12.5px] text-ink-3">{s.at ? fmtDateTime(s.at) : s.state === "now" ? "চলছে" : "অপেক্ষায়"}</div>
                {"note" in s && s.note && <div className="mt-1.5 rounded-xl bg-brick-soft px-3 py-2 text-[13px] text-brick">{s.note}</div>}
              </div>
            </li>
          ))}
        </ol>
      </Stagger>

      {/* items */}
      <Stagger i={3} className="rounded-[24px] border border-line bg-surface-solid p-4">
        <h2 className="mb-2 px-1 text-[15px] font-bold text-ink">পণ্য</h2>
        <ul className="flex flex-col gap-1.5">
          {o.items.map((it) => {
            const p = products.find((x) => x.id === it.productId);
            return (
              <li key={it.productId} className="flex items-center gap-3 rounded-2xl p-1.5">
                {p && <ProductArt product={p} size={34} className="h-12 w-12 shrink-0 rounded-[14px]" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold text-ink">{p?.name}</span>
                  <span className="num block text-[12.5px] text-ink-3">{bn(it.quantity)} {p ? UNIT_LABEL[p.unit] : ""} × {taka(it.unitPriceSnapshot)}</span>
                </span>
                <span className="num text-[15px] font-bold text-ink">{taka(it.quantity * it.unitPriceSnapshot)}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex flex-col gap-1.5 border-t border-dashed border-line-strong px-1 pt-3 text-[14px]">
          <div className="flex justify-between text-ink-3"><span>বাজারে কিনলে</span><s className="num">{taka(t.market)}</s></div>
          <div className="flex items-center justify-between"><span className="font-semibold text-ink">মোট</span><span className="flex items-center gap-2"><span className="num rounded-full bg-sage-soft px-2 py-0.5 text-[12px] font-bold text-sage">সাশ্রয় {taka(t.saving)}</span><span className="num text-[19px] font-bold text-ink">{taka(t.total)}</span></span></div>
        </div>
      </Stagger>

      <ConfirmSheet open={sheet} onOpenChange={setSheet} orderId={o.id} />
    </div>
  );
}

export default function CitizenOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <CitizenFrame>
      <Suspense>
        <OrderDetail id={id} />
      </Suspense>
    </CitizenFrame>
  );
}
