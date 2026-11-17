"use client";
import { Suspense, use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CheckCircle2, ChevronLeft, Clock, MapPin, PartyPopper, ScanLine, X, PackageCheck } from "lucide-react";
import { CitizenFrame } from "@/components/citizen-app/frame";
import { CitizenTracker } from "@/components/citizen-app/tracker";
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
              <button type="button" onClick={() => submit(code, "APP_CODE")} disabled={code.length !== 6 || busy} className="grad-copper flex h-[54px] items-center justify-center gap-2 rounded-[16px] text-[16px] font-bold text-white disabled:opacity-50">
                {busy && <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                হ্যাঁ, পণ্য পেয়েছি
              </button>
              {canScan && (
                <button type="button" onClick={startScan} className="flex h-[50px] items-center justify-center gap-2 rounded-[16px] border border-line-strong text-[15px] font-semibold text-ink">
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
  const { orders } = useMe();
  const products = useData((s) => s.products);
  const points = useData((s) => s.points);
  const [sheet, setSheet] = useState(false);
  const o = orders.find((x) => x.id === id);
  const [justCollected, setJustCollected] = useState(false);
  const prevStatus = useRef(o?.status);

  useEffect(() => {
    if (prevStatus.current === "AWAITING_PICKUP" && o?.status === "COLLECTED") queueMicrotask(() => setJustCollected(true));
    prevStatus.current = o?.status;
  }, [o?.status]);

  if (!o) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="text-[16px] font-semibold text-ink-2">অর্ডারটি পাওয়া যায়নি</div>
        <Link href="/citizen/orders" className="font-semibold text-copper-deep dark:text-copper">আমার অর্ডারে ফিরে যান</Link>
      </div>
    );
  }
  const t = orderTotals(o);
  const point = points.find((p) => p.id === o.pickupPointId);
  const isNew = params.get("new") === "1" && o.status === "PENDING";

  return (
    <div className="page-enter flex flex-col gap-4 px-5 pb-6 pt-5">
      <div className="flex items-center gap-3">
        <Link href="/citizen/orders" aria-label="আমার অর্ডারে ফিরে যান" className="grid h-11 w-11 place-items-center rounded-[14px] border border-line-strong text-ink"><ChevronLeft className="h-5 w-5" /></Link>
        <div className="min-w-0 flex-1">
          <div className="num text-[18px] font-bold text-ink">{bn(o.orderNo)}</div>
          <div className="text-[12.5px] text-ink-3">{fmtDateTime(o.appliedAt)}</div>
        </div>
        <Pill tone={orderTone[o.status]} dot>{ORDER_STATUS_LABEL[o.status]}</Pill>
      </div>

      {isNew && (
        <div className="flex items-start gap-3 rounded-[20px] bg-sage-soft p-4 text-sage animate-[page-in_400ms_var(--ease-out)]">
          <PartyPopper className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.8} />
          <div>
            <div className="text-[16px] font-bold">আবেদন পাঠানো হয়েছে</div>
            <div className="text-[13.5px] text-ink-2">পৌরসভা অনুমোদন দিলে এখানে সংগ্রহের কোড আসবে।</div>
          </div>
        </div>
      )}

      <section className="glass rounded-[22px] p-4">
        <CitizenTracker o={o} />
        {o.status === "CANCELLED" && o.rejectReason && <div className="mt-4 rounded-xl bg-brick-soft px-3.5 py-2.5 text-[13.5px] text-brick">বাতিলের কারণ: {o.rejectReason}</div>}
        {o.status === "PENDING" && <div className="mt-4 rounded-xl bg-ochre-soft px-3.5 py-2.5 text-[13.5px] text-ochre">পৌরসভা আপনার আবেদন দেখছে।</div>}
      </section>

      {/* pickup */}
      {o.status === "AWAITING_PICKUP" && (
        <section className="hairline glass-strong rounded-[24px] p-5 text-center">
          <div className="text-[15px] font-bold text-ink">পণ্য নেওয়ার সময় এটি দেখান</div>
          <div className="mx-auto mt-4 w-fit rounded-[18px] bg-white p-3 shadow-sm">
            <QRCodeSVG value={`KPR:${o.orderNo}:${o.pickupCode}`} size={168} level="M" fgColor="#121a1c" />
          </div>
          <div className="mt-4 text-[12.5px] text-ink-3">সংগ্রহের কোড</div>
          <div className="num text-[38px] font-bold tracking-[0.2em] text-ink">{bn(o.pickupCode ?? "")}</div>
          <div className="mt-3 flex flex-col gap-1.5 rounded-2xl bg-sunken p-3.5 text-left text-[13.5px]">
            <div className="flex items-start gap-2 text-ink"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-copper" strokeWidth={1.8} /><span><b>{point?.name}</b><br /><span className="text-ink-3">{point?.address} · {point?.openHours}</span></span></div>
            <div className="flex items-center gap-2 text-ink"><Clock className="h-4 w-4 shrink-0 text-copper" strokeWidth={1.8} /> শেষ সময়: <b>{fmtDateTime(o.pickupDeadline!)}</b></div>
          </div>
          <div className="mt-2 text-[13px] text-ink-3">সাথে আনুন: <b className="num text-ink">{taka(t.total)}</b> (নগদ)</div>
          <button type="button" onClick={() => setSheet(true)} className="grad-copper mt-4 flex h-[56px] w-full items-center justify-center gap-2 rounded-[16px] text-[16px] font-bold text-white shadow-[0_12px_28px_-10px_var(--glow)]">
            <PackageCheck className="h-5 w-5" strokeWidth={1.8} /> সংগ্রহ নিশ্চিত করুন
          </button>
          <p className="mt-2 text-[12.5px] text-ink-3">পণ্য হাতে পাওয়ার পরই চাপুন।</p>
        </section>
      )}

      {o.status === "COLLECTED" && (
        <section className={cn("flex items-start gap-3 rounded-[22px] bg-sage-soft p-4 text-sage", justCollected && "animate-[modal-pop_500ms_var(--ease-spring)]")}>
          <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0" strokeWidth={1.8} />
          <div>
            <div className="text-[16px] font-bold">{justCollected ? "ধন্যবাদ! সংগ্রহ সম্পন্ন" : "সংগ্রহ সম্পন্ন"}</div>
            <div className="text-[13.5px] text-ink-2">{point?.name} · {fmtDateTime(o.collectedAt!)}</div>
            <div className="mt-1 text-[13.5px] text-ink-2">এই অর্ডারে আপনার সাশ্রয় <b className="num text-sage">{taka(t.saving)}</b></div>
          </div>
        </section>
      )}

      <section className="glass rounded-[22px] p-4">
        <h2 className="mb-1 text-[15px] font-semibold text-ink">পণ্য</h2>
        <ul className="divide-y divide-line">
          {o.items.map((it) => {
            const p = products.find((x) => x.id === it.productId);
            return (
              <li key={it.productId} className="flex justify-between gap-3 py-2.5 text-[14.5px]">
                <span className="text-ink">{p?.name} <span className="num text-ink-3">× {bn(it.quantity)} {p ? UNIT_LABEL[p.unit] : ""}</span></span>
                <span className="num font-semibold text-ink">{taka(it.quantity * it.unitPriceSnapshot)}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex flex-col gap-1.5 border-t border-line pt-3 text-[14px]">
          <div className="flex justify-between text-ink-3"><span>বাজারে কিনলে</span><span className="num line-through">{taka(t.market)}</span></div>
          <div className="flex justify-between font-semibold text-ink"><span>মোট</span><span className="num text-[18px] font-bold">{taka(t.total)}</span></div>
          <div className="flex justify-between"><span className="text-ink-2">সাশ্রয়</span><span className="num rounded-full bg-sage-soft px-2.5 py-0.5 text-[13px] font-bold text-sage">{taka(t.saving)}</span></div>
        </div>
      </section>

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
