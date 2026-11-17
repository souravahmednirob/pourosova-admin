"use client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { RotateCw } from "lucide-react";
import type { Citizen } from "@/lib/types";
import { bn, taka } from "@/lib/bn";
import { cn } from "@/lib/utils";

/** Wallet-style ration card. Tap to flip: the back carries a QR of the card number for quick identification. */
export function WalletCard({ citizen, wardNo, saved }: { citizen: Citizen; wardNo?: number; saved: number }) {
  const [flipped, setFlipped] = useState(false);
  const rc = citizen.rationCardNo ?? "";
  const [prefix, digits] = rc.split("-");
  return (
    <button type="button" onClick={() => setFlipped((f) => !f)} aria-label={flipped ? "কার্ডের সামনের দিক দেখুন" : "কার্ড উল্টে QR দেখুন"} className={cn("wallet-card block w-full text-left outline-none", flipped && "is-flipped")}>
      <div className="wallet-card__inner relative aspect-[1.62] w-full">
        {/* front */}
        <div className="wallet-card__face absolute inset-0 overflow-hidden rounded-[26px] bg-[#0f1f24] text-white shadow-[0_28px_50px_-22px_rgba(15,31,36,.75),0_0_0_1px_rgba(255,255,255,.06)_inset]">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,rgba(201,126,82,.55)_0%,transparent_55%),radial-gradient(90%_80%_at_0%_100%,rgba(47,107,120,.7)_0%,transparent_60%),radial-gradient(60%_60%_at_60%_60%,rgba(92,154,110,.25)_0%,transparent_70%)]" />
          <div aria-hidden className="absolute inset-0 opacity-[.07] [background-image:repeating-linear-gradient(115deg,#fff_0_1px,transparent_1px_9px)]" />
          <div aria-hidden className="absolute -inset-y-10 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-[card-sheen_6s_ease-in-out_infinite]" />
          {/* wheat watermark */}
          <svg aria-hidden viewBox="0 0 64 64" className="absolute -bottom-6 -right-4 h-40 w-40 opacity-[.08]">
            <path d="M32 60V14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
            {[22, 30, 38, 46].map((y) => (
              <g key={y} fill="#fff">
                <ellipse cx="26" cy={y} rx="3" ry="7" transform={`rotate(-38 26 ${y})`} />
                <ellipse cx="38" cy={y} rx="3" ry="7" transform={`rotate(38 38 ${y})`} />
              </g>
            ))}
          </svg>
          <div className="relative flex h-full flex-col justify-between p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">কালিয়াকৈর পৌরসভা</div>
                <div className="mt-0.5 text-[14px] font-semibold text-[#f0c2a2]">নাগরিক রেশন কার্ড</div>
              </div>
              {/* chip */}
              <div aria-hidden className="h-8 w-11 rounded-md bg-gradient-to-br from-[#f3d6a8] via-[#c9a26a] to-[#8f6c3c] p-[3px] shadow-inner">
                <div className="grid h-full w-full grid-cols-3 gap-[2px] rounded-[4px] opacity-60 [&>span]:rounded-[1px] [&>span]:bg-[#6d522c]">
                  <span /><span /><span /><span /><span /><span />
                </div>
              </div>
            </div>
            <div>
              <div className="num flex items-baseline gap-2 text-[30px] font-bold leading-none tracking-[0.12em]">
                <span className="text-[16px] tracking-normal text-white/55">{prefix}</span>
                {bn(digits ?? "")}
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold">{citizen.nameBn}</div>
                  <div className="text-[12px] text-white/60">{wardNo ? `ওয়ার্ড ${bn(wardNo)}` : ""} · পরিবার {bn(citizen.familySize)} জন</div>
                </div>
                <div className="shrink-0 rounded-2xl bg-white/10 px-3 py-1.5 text-right ring-1 ring-white/15 backdrop-blur-md">
                  <div className="text-[10.5px] text-white/60">মোট সাশ্রয়</div>
                  <div className="num text-[16px] font-bold text-[#f0c2a2]">{taka(saved)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* back */}
        <div className="wallet-card__face wallet-card__back absolute inset-0 overflow-hidden rounded-[26px] bg-[#f6f2ea] text-[#121a1c] shadow-[0_28px_50px_-22px_rgba(15,31,36,.5)] dark:bg-[#e9e3d8]">
          <div className="flex h-full items-center gap-5 p-5">
            <div className="rounded-2xl bg-white p-2.5 shadow-sm">
              <QRCodeSVG value={`KPR-CARD:${rc}`} size={104} level="M" fgColor="#121a1c" />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] text-[#6b7a7d]">কার্ড নম্বর</div>
              <div className="num text-[20px] font-bold">{bn(rc)}</div>
              <div className="mt-2 text-[12.5px] leading-relaxed text-[#3c4a4d]">বিতরণ কেন্দ্রে পরিচয়ের জন্য এটি দেখাতে পারেন।</div>
              <div className="mt-2 flex items-center gap-1 text-[11.5px] text-[#99a5a7]"><RotateCw className="h-3 w-3" /> ট্যাপ করে ফিরে যান</div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
