"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BadgeCheck, History, XCircle, Phone, MapPin, Users, CreditCard, IdCard as IdIcon, Clock } from "lucide-react";
import { Drawer } from "@/components/shell/drawer";
import { Button } from "@/components/ui/button";
import { Pill, Modal, Field, Textarea, type Tone } from "@/components/ui/primitives";
import { IdCard } from "./id-card";
import { useData, RuleError } from "@/store/data";
import { useAuth, can } from "@/store/auth";
import { CITIZEN_STATUS_LABEL, type CitizenStatus } from "@/lib/types";
import { bn, fmtDateTime, WARD_NAME } from "@/lib/bn";

export const statusTone: Record<CitizenStatus, Tone> = { PENDING: "ochre", APPROVED: "sage", REJECTED: "brick" };

function Row({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.8} />
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-ink-3">{label}</div>
        <div className={mono ? "num text-[14px] font-medium text-ink" : "text-[14px] font-medium text-ink"}>{value}</div>
      </div>
    </div>
  );
}

export function CitizenDrawer({ citizenId, onClose }: { citizenId: string | null; onClose: () => void }) {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const citizen = useData((s) => s.citizens.find((c) => c.id === citizenId));
  const wards = useData((s) => s.wards);
  const approve = useData((s) => s.approveCitizen);
  const reject = useData((s) => s.rejectCitizen);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const canApprove = can(user?.role, "citizen.approve");

  const act = async (kind: "approve" | "reject") => {
    if (!citizen || !user) return;
    setBusy(kind);
    try {
      await new Promise((r) => setTimeout(r, 500));
      if (kind === "approve") {
        const c = approve(citizen.id, { id: user.id, name: user.name });
        toast.success(`${c.nameBn} অনুমোদিত হয়েছে`, { description: `রেশন কার্ড নম্বর ${bn(c.rationCardNo!)}` });
      } else {
        reject(citizen.id, reason, { id: user.id, name: user.name });
        toast(`${citizen.nameBn}-এর নিবন্ধন বাতিল করা হয়েছে`);
        setRejectOpen(false);
        setReason("");
      }
    } catch (e) {
      toast.error(e instanceof RuleError ? e.message : "কাজটি করা যায়নি");
    } finally {
      setBusy(null);
    }
  };

  const ward = citizen ? wards.find((w) => w.id === citizen.wardId) : undefined;

  return (
    <Drawer
      open={!!citizenId}
      onClose={onClose}
      title="নাগরিকের বিবরণ"
      footer={
        citizen && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            {citizen.status === "PENDING" && canApprove ? (
              <>
                <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={!!busy} className="text-brick hover:bg-brick-soft">
                  <XCircle className="h-4 w-4" strokeWidth={1.8} /> বাতিল
                </Button>
                <Button variant="success" onClick={() => act("approve")} loading={busy === "approve"}>
                  <BadgeCheck className="h-4 w-4" strokeWidth={1.8} /> অনুমোদন
                </Button>
              </>
            ) : citizen.status === "APPROVED" ? (
              <Button variant="secondary" className="w-full" onClick={() => router.push(`/admin/orders/citizen/${citizen.id}`)}>
                <History className="h-4 w-4" strokeWidth={1.8} /> পূর্ণ ইতিহাস ও ট্র্যাকিং দেখুন →
              </Button>
            ) : (
              <div className="text-[13px] text-ink-3">এই নিবন্ধনে আর কোনো কাজ বাকি নেই।</div>
            )}
          </div>
        )
      }
    >
      {citizen && (
        <div className="@container flex flex-col gap-5">
          <div>
            <Pill tone={statusTone[citizen.status]} dot>{CITIZEN_STATUS_LABEL[citizen.status]}</Pill>
            <h2 className="mt-2.5 text-[22px] font-bold leading-tight text-ink">{citizen.nameBn}</h2>
            <div className="num text-[13px] text-ink-3">{citizen.nameEn}</div>
            <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-3">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.8} /> জমা দিয়েছেন <span className="font-medium text-ink-2">{citizen.registeredByName}</span> · {fmtDateTime(citizen.registeredAt)}
            </div>
            {citizen.status === "REJECTED" && citizen.rejectReason && <div className="mt-3 rounded-xl bg-brick-soft px-3.5 py-2.5 text-[13px] text-brick">বাতিলের কারণ: {citizen.rejectReason}</div>}
            {citizen.status === "APPROVED" && (
              <div className="hairline mt-3 flex items-center justify-between rounded-2xl bg-sunken px-4 py-3">
                <div>
                  <div className="text-[12px] text-ink-3">রেশন কার্ড নম্বর</div>
                  <div className="num text-[20px] font-bold text-ink">{bn(citizen.rationCardNo!)}</div>
                </div>
                <div className="text-right text-[12px] text-ink-3">
                  অনুমোদন
                  <div className="text-ink-2">{fmtDateTime(citizen.approvedAt!)}</div>
                </div>
              </div>
            )}
          </div>

          <section>
            <div className="label-caps mb-2">পরিচয়পত্র</div>
            <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2">
              {citizen.idFrontUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={citizen.idFrontUrl} alt="পরিচয়পত্র সামনের পাশ" className="aspect-[1.586] w-full rounded-[12px] border border-line-strong object-cover" />
              ) : (
                <IdCard citizen={citizen} side="front" />
              )}
              {citizen.idBackUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={citizen.idBackUrl} alt="পরিচয়পত্র পেছনের পাশ" className="aspect-[1.586] w-full rounded-[12px] border border-line-strong object-cover" />
              ) : (
                <IdCard citizen={citizen} side="back" />
              )}
            </div>
          </section>

          <section>
            <div className="label-caps mb-1">বিস্তারিত</div>
            <div className="divide-y divide-line">
              <Row icon={IdIcon} label="জাতীয় পরিচয়পত্র / জন্মনিবন্ধন নম্বর" value={bn(citizen.nationalId)} mono />
              <Row icon={Phone} label="মোবাইল" value={bn(citizen.mobile)} mono />
              <Row icon={MapPin} label="ঠিকানা" value={`${citizen.holding ? "হোল্ডিং " + bn(citizen.holding) + ", " : ""}${citizen.mohalla}, ${ward ? WARD_NAME(ward.number) : ""} — ${citizen.address}`} />
              <Row icon={Users} label="পরিবারের সদস্য" value={`${bn(citizen.familySize)} জন`} />
              {citizen.status !== "APPROVED" && <Row icon={CreditCard} label="রেশন কার্ড" value={citizen.status === "PENDING" ? "অনুমোদনের পর স্বয়ংক্রিয়ভাবে তৈরি হবে" : "তৈরি হয়নি"} />}
            </div>
          </section>
        </div>
      )}

      <Modal open={rejectOpen} onOpenChange={setRejectOpen} title="নিবন্ধন বাতিল" description="কারণটি নাগরিককে জানানো হবে, তাই সহজ ভাষায় লিখুন।">
        <Field label="বাতিলের কারণ" required>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="যেমন: পরিচয়পত্রের ছবি অস্পষ্ট" autoFocus />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRejectOpen(false)}>ফিরে যান</Button>
          <Button variant="danger" onClick={() => act("reject")} loading={busy === "reject"} disabled={!reason.trim()}>বাতিল নিশ্চিত করুন</Button>
        </div>
      </Modal>
    </Drawer>
  );
}
