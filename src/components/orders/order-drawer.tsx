"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { BadgeCheck, XCircle, History, MapPin, Smartphone, CheckCircle2, Clock, Phone } from "lucide-react";
import { Drawer } from "@/components/shell/drawer";
import { Button } from "@/components/ui/button";
import { Pill, Modal, Field, Textarea } from "@/components/ui/primitives";
import { useData, RuleError } from "@/store/data";
import { useAuth, can } from "@/store/auth";
import { ORDER_STATUS_LABEL, type Order } from "@/lib/types";
import { bn, taka, fmtDateTime, fmtDate, WARD_NAME } from "@/lib/bn";
import { orderTotals, orderTone } from "@/lib/orders";
import { cn } from "@/lib/utils";

export function OrderTimeline({ o, compact }: { o: Order; compact?: boolean }) {
  const steps = [
    { label: "আবেদন জমা", at: o.appliedAt, state: "done" as const },
    o.status === "CANCELLED"
      ? { label: "বাতিল", at: o.cancelledAt ?? o.approvedAt, state: "bad" as const, note: o.rejectReason }
      : { label: "অনুমোদন", at: o.approvedAt, state: o.approvedAt ? ("done" as const) : ("todo" as const) },
    { label: "সংগ্রহ নিশ্চিতকরণ (নাগরিক নিজে)", at: o.collectedAt, state: o.collectedAt ? ("done" as const) : o.status === "CANCELLED" ? ("skip" as const) : ("todo" as const) },
  ];
  if (compact) {
    return (
      <ol className="flex items-center gap-0">
        {steps.map((s, i) => (
          <li key={s.label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1 text-center">
              <span className={cn("grid h-6 w-6 place-items-center rounded-full border text-[11px]", s.state === "done" ? "border-sage bg-sage text-white" : s.state === "bad" ? "border-brick bg-brick text-white" : "border-line-strong text-ink-4")}>{s.state === "done" ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.state === "bad" ? <XCircle className="h-3.5 w-3.5" /> : bn(i + 1)}</span>
              <span className="text-[11.5px] font-medium text-ink-2">{s.label.split(" (")[0]}</span>
              <span className="text-[11px] text-ink-3">{s.at ? fmtDate(s.at) : "\u00a0"}</span>
            </div>
            {i < steps.length - 1 && <span className={cn("mx-2 mb-7 h-px flex-1", steps[i + 1].state === "done" || steps[i + 1].state === "bad" ? "bg-sage-2" : "bg-line-strong")} />}
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ol className="relative ml-2.5 border-l border-line-strong pl-5">
      {steps.map((s) => (
        <li key={s.label} className="relative pb-4 last:pb-0">
          <span className={cn("absolute -left-[27px] top-0.5 grid h-4 w-4 place-items-center rounded-full border-2 ring-4 ring-[var(--surface-solid)]", s.state === "done" ? "border-sage bg-sage" : s.state === "bad" ? "border-brick bg-brick" : "border-line-strong bg-[var(--surface-solid)]")} />
          <div className={cn("text-[14px] font-medium", s.state === "todo" || s.state === "skip" ? "text-ink-4" : s.state === "bad" ? "text-brick" : "text-ink")}>{s.label}</div>
          {s.at ? <div className="text-[12.5px] text-ink-3">{fmtDateTime(s.at)}</div> : <div className="text-[12.5px] text-ink-4">{s.state === "skip" ? "প্রযোজ্য নয়" : "অপেক্ষায়"}</div>}
          {"note" in s && s.note && <div className="mt-1 text-[12.5px] text-brick">{s.note}</div>}
        </li>
      ))}
    </ol>
  );
}

export function OrderDrawer({ orderId, onClose, onOpenOrder }: { orderId: string | null; onClose: () => void; onOpenOrder: (id: string) => void }) {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const orders = useData((s) => s.orders);
  const citizens = useData((s) => s.citizens);
  const products = useData((s) => s.products);
  const wards = useData((s) => s.wards);
  const points = useData((s) => s.points);
  const approve = useData((s) => s.approveOrder);
  const reject = useData((s) => s.rejectOrder);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"approve" | "cancel" | null>(null);
  const canAct = can(user?.role, "order.approve");

  const o = orders.find((x) => x.id === orderId);
  const c = o ? citizens.find((x) => x.id === o.citizenId) : undefined;
  const ward = c ? wards.find((w) => w.id === c.wardId) : undefined;
  const point = o ? points.find((p) => p.id === o.pickupPointId) : undefined;
  const others = useMemo(() => (o ? orders.filter((x) => x.citizenId === o.citizenId && x.id !== o.id).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)) : []), [orders, o]);
  const stats = useMemo(() => {
    if (!o) return { total: 0, collected: 0, last: undefined as string | undefined };
    const mine = orders.filter((x) => x.citizenId === o.citizenId);
    const collected = mine.filter((x) => x.status === "COLLECTED");
    const prev = mine.filter((x) => x.id !== o.id && x.appliedAt < o.appliedAt).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))[0];
    const lastCollected = collected.filter((x) => x.id !== o.id).sort((a, b) => (b.collectedAt ?? "").localeCompare(a.collectedAt ?? ""))[0];
    return { total: mine.length, collected: collected.length, last: prev?.appliedAt, lastCollected: lastCollected?.collectedAt };
  }, [orders, o]);
  const totals = o ? orderTotals(o) : { total: 0, market: 0, saving: 0 };

  const act = async (kind: "approve" | "cancel") => {
    if (!o || !user) return;
    setBusy(kind);
    try {
      await new Promise((r) => setTimeout(r, 500));
      if (kind === "approve") {
        const n = approve(o.id, { id: user.id, name: user.name });
        toast.success(`${bn(n.orderNo)} অনুমোদিত`, { description: `মজুত সংরক্ষিত · সংগ্রহের শেষ সময় ${fmtDateTime(n.pickupDeadline!)}` });
      } else {
        reject(o.id, reason, { id: user.id, name: user.name });
        toast(`${bn(o.orderNo)} বাতিল করা হয়েছে`);
        setCancelOpen(false);
        setReason("");
      }
    } catch (e) {
      toast.error(e instanceof RuleError ? e.message : "কাজটি করা যায়নি");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Drawer
      open={!!orderId}
      onClose={onClose}
      title="অর্ডারের বিবরণ"
      footer={
        o && c && (
          <div className="flex flex-col gap-2">
            {o.status === "PENDING" && canAct && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-brick hover:bg-brick-soft" onClick={() => setCancelOpen(true)} disabled={!!busy}><XCircle className="h-4 w-4" strokeWidth={1.8} /> বাতিল</Button>
                <Button variant="success" className="flex-1" onClick={() => act("approve")} loading={busy === "approve"}><BadgeCheck className="h-4 w-4" strokeWidth={1.8} /> অনুমোদন করুন</Button>
              </div>
            )}
            {o.status === "AWAITING_PICKUP" && canAct && (
              <Button variant="outline" className="text-brick hover:bg-brick-soft" onClick={() => setCancelOpen(true)} disabled={!!busy}><XCircle className="h-4 w-4" strokeWidth={1.8} /> অর্ডার বাতিল (মজুত ছাড়বে)</Button>
            )}
            <Button variant="secondary" onClick={() => router.push(`/admin/orders/citizen/${c.id}`)}><History className="h-4 w-4" strokeWidth={1.8} /> পূর্ণ ইতিহাস ও ট্র্যাকিং দেখুন →</Button>
          </div>
        )
      }
    >
      {o && c && (
        <div className="@container flex flex-col gap-6">
          {/* 1. status */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <Pill tone={orderTone[o.status]} dot>{ORDER_STATUS_LABEL[o.status]}</Pill>
              <span className="text-[12.5px] text-ink-3">আবেদন: {fmtDateTime(o.appliedAt)}</span>
            </div>
            <div className="num mt-2 text-[24px] font-bold text-ink">{bn(o.orderNo)}</div>
          </div>

          {/* 2. citizen */}
          <section className="rounded-2xl bg-sunken p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[16px] font-semibold text-ink">{c.nameBn}</div>
                <div className="num text-[13px] text-ink-3">{c.rationCardNo ? bn(c.rationCardNo) : "—"}</div>
              </div>
              <div className="text-right text-[12.5px] text-ink-3">
                <div>{ward ? WARD_NAME(ward.number) : ""}</div>
                <div className="num flex items-center justify-end gap-1"><Phone className="h-3 w-3" /> {bn(c.mobile)}</div>
              </div>
            </div>
            {/* 3. mini stats */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { l: "মোট অর্ডার", v: bn(stats.total) },
                { l: "সংগ্রহ হয়েছে", v: bn(stats.collected) },
                { l: "আগের অর্ডার", v: stats.last ? fmtDate(stats.last) : "—" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-[var(--surface-solid)] px-3 py-2">
                  <div className="text-[11.5px] text-ink-3">{s.l}</div>
                  <div className="num text-[15px] font-bold text-ink">{s.v}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. timeline */}
          <section>
            <div className="label-caps mb-3">অগ্রগতি</div>
            <OrderTimeline o={o} />
          </section>

          {/* 5. items */}
          <section>
            <div className="label-caps mb-2">পণ্য</div>
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-[12px] text-ink-3">
                  <th className="pb-1.5 text-left font-medium">পণ্য</th>
                  <th className="pb-1.5 text-right font-medium">পরিমাণ</th>
                  <th className="pb-1.5 text-right font-medium">দাম</th>
                </tr>
              </thead>
              <tbody>
                {o.items.map((it) => {
                  const p = products.find((x) => x.id === it.productId);
                  const short = o.status === "PENDING" && p && p.stock < it.quantity;
                  return (
                    <tr key={it.productId} className="border-t border-line">
                      <td className="py-2 text-ink">
                        {p?.name ?? "—"}
                        {short && <span className="ml-2 rounded-md bg-brick-soft px-1.5 py-0.5 text-[11px] font-semibold text-brick">মজুত {p.stock === 0 ? "নেই" : `মাত্র ${bn(p.stock)}`}</span>}
                      </td>
                      <td className="num py-2 text-right text-ink-2">{bn(it.quantity)} {p?.unit === "L" ? "লিটার" : p?.unit === "PC" ? "পিস" : p?.unit === "PKT" ? "প্যাকেট" : "কেজি"}</td>
                      <td className="num py-2 text-right font-medium text-ink">{taka(it.quantity * it.unitPriceSnapshot)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-3 flex flex-col gap-1.5 rounded-2xl border border-line p-3.5 text-[13.5px]">
              <div className="flex justify-between text-ink-3"><span>বাজার মূল্য হলে</span><span className="num line-through">{taka(totals.market)}</span></div>
              <div className="flex justify-between text-ink"><span className="font-medium">পৌরসভার মূল্য</span><span className="num text-[16px] font-bold">{taka(totals.total)}</span></div>
              <div className="flex justify-between"><span className="text-ink-2">নাগরিকের সাশ্রয়</span><Pill tone="sage">{taka(totals.saving)}</Pill></div>
            </div>
          </section>

          {/* 6. collection point */}
          <section className="flex items-start gap-3 text-[13.5px]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.8} />
            <div>
              <div className="font-medium text-ink">{point?.name ?? "বিতরণ কেন্দ্র"}</div>
              <div className="text-ink-3">{point?.address} · {point?.openHours}</div>
              {stats.lastCollected && <div className="mt-1 text-[12.5px] text-ink-3">শেষ সংগ্রহ: {fmtDateTime(stats.lastCollected)}</div>}
            </div>
          </section>

          {/* 7. pickup */}
          {o.status === "AWAITING_PICKUP" && (
            <section className="hairline rounded-2xl bg-sunken p-4">
              <div className="flex flex-col items-center gap-3 @sm:flex-row @sm:items-center">
                <div className="rounded-xl bg-white p-2">
                  <QRCodeSVG value={`KPR:${o.orderNo}:${o.pickupCode}`} size={112} level="M" fgColor="#121a1c" />
                </div>
                <div className="flex-1 text-center @sm:text-left">
                  <div className="text-[12px] text-ink-3">পিকআপ কোড</div>
                  <div className="num text-[32px] font-bold tracking-[0.18em] text-ink">{bn(o.pickupCode ?? "")}</div>
                  <div className="mt-1 flex items-center justify-center gap-1.5 text-[12.5px] text-ink-3 @sm:justify-start"><Clock className="h-3.5 w-3.5" /> শেষ সময় {fmtDateTime(o.pickupDeadline!)}</div>
                </div>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-petrol-soft px-3 py-2.5 text-[12.5px] text-petrol">
                <Smartphone className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
                পণ্য হাতে পাওয়ার পর নাগরিক নিজের অ্যাপ থেকে এই কোড দিয়ে সংগ্রহ নিশ্চিত করবেন। এখান থেকে সংগ্রহ চিহ্নিত করা যায় না।
              </div>
            </section>
          )}
          {o.status === "COLLECTED" && (
            <section className="flex items-start gap-3 rounded-2xl bg-sage-soft p-4 text-[13.5px] text-sage">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.8} />
              <div>
                <div className="font-semibold">নাগরিক নিজে সংগ্রহ নিশ্চিত করেছেন</div>
                <div className="mt-0.5 opacity-90">{point?.name} · {fmtDateTime(o.collectedAt!)} · {o.collectedVia === "APP_QR" ? "QR স্ক্যান" : "কোড দিয়ে"}</div>
              </div>
            </section>
          )}

          {/* 9. other orders */}
          {others.length > 0 && (
            <section>
              <div className="label-caps mb-2">এই নাগরিকের অন্য অর্ডার</div>
              <ul className="divide-y divide-line">
                {others.slice(0, 6).map((x) => {
                  const t = orderTotals(x);
                  return (
                    <li key={x.id}>
                      <button type="button" onClick={() => onOpenOrder(x.id)} className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors hover:text-copper-deep dark:hover:text-copper">
                        <span>
                          <span className="num block text-[13.5px] font-medium">{bn(x.orderNo)}</span>
                          <span className="block text-[12px] text-ink-3">{fmtDate(x.appliedAt)} · {taka(t.total)}</span>
                        </span>
                        <Pill tone={orderTone[x.status]}>{ORDER_STATUS_LABEL[x.status]}</Pill>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}

      <Modal open={cancelOpen} onOpenChange={setCancelOpen} title="অর্ডার বাতিল" description={o?.status === "AWAITING_PICKUP" ? "সংরক্ষিত মজুত আবার ছাড়া হবে। কারণ নাগরিককে জানানো হবে।" : "কারণটি নাগরিককে জানানো হবে।"}>
        <Field label="বাতিলের কারণ" required>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="যেমন: মাসিক সীমা অতিক্রম" autoFocus />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setCancelOpen(false)}>ফিরে যান</Button>
          <Button variant="danger" onClick={() => act("cancel")} loading={busy === "cancel"} disabled={!reason.trim()}>বাতিল নিশ্চিত করুন</Button>
        </div>
      </Modal>
    </Drawer>
  );
}
