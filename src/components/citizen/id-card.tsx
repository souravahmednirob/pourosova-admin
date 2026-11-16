"use client";
import type { Citizen } from "@/lib/types";
import { bn } from "@/lib/bn";
import { cn } from "@/lib/utils";

/** Sample-style NID card (front/back). Fictional data, always watermarked "নমুনা". */
export function IdCard({ citizen, side, className }: { citizen: Citizen; side: "front" | "back"; className?: string }) {
  const nidGrouped = bn(citizen.nationalId.replace(/(\d{4})(?=\d)/g, "$1 "));
  return (
    <div className={cn("relative aspect-[1.586] w-full select-none overflow-hidden rounded-[12px] border border-line-strong bg-[linear-gradient(135deg,#f4f6f3,#dfe8e3)] text-[#1b2b2a] shadow-sm dark:bg-[linear-gradient(135deg,#e9ede8,#cfdad4)]", className)}>
      {side === "front" ? (
        <>
          <div className="flex h-[19%] items-center gap-2 bg-[#1f4d58] px-3 text-white">
            <div className="h-5 w-5 shrink-0 rounded-full bg-[#c2922c]" />
            <div className="leading-tight">
              <div className="text-[10px] font-bold">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
              <div className="text-[7px] opacity-85">Government of the People&apos;s Republic of Bangladesh</div>
            </div>
          </div>
          <div className="pt-1 text-center text-[9px] font-semibold text-[#1f4d58]">জাতীয় পরিচয় পত্র / National ID Card</div>
          <div className="flex gap-2.5 px-3 pt-1.5">
            <div className="h-[72px] w-[58px] shrink-0 overflow-hidden rounded border border-[#bfd0c6] bg-[#d3dcd7]">
              {citizen.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={citizen.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <svg viewBox="0 0 64 78" className="h-full w-full" aria-hidden>
                  <rect width="64" height="78" fill="#d3dcd7" />
                  <circle cx="32" cy="30" r="13" fill="#7f8c88" />
                  <path d="M6 78c2-20 14-27 26-27s24 7 26 27z" fill="#7f8c88" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1 leading-[1.45]">
              <div className="text-[10.5px]"><span className="text-[#4a5f5d]">নাম:</span> <b>{citizen.nameBn}</b></div>
              <div className="font-mono text-[8px]">Name: <b>{citizen.nameEn.toUpperCase()}</b></div>
              <div className="text-[9.5px]"><span className="text-[#4a5f5d]">পিতা:</span> <b>{citizen.father ?? "—"}</b></div>
              <div className="text-[9.5px]"><span className="text-[#4a5f5d]">মাতা:</span> <b>{citizen.mother ?? "—"}</b></div>
              <div className="font-mono text-[8.5px]">Date of Birth: <b>{citizen.dob ?? "—"}</b></div>
              <div className="font-mono text-[10.5px] text-[#b3261e]">ID NO: <b>{nidGrouped}</b></div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="px-3 pt-3 text-[10px] leading-[1.5]">
            <div><span className="text-[#4a5f5d]">ঠিকানা:</span> <b>{citizen.mohalla}, কালিয়াকৈর, গাজীপুর</b></div>
            <div><span className="text-[#4a5f5d]">রক্তের গ্রুপ:</span> <b className="font-mono">{citizen.bloodGroup ?? "—"}</b></div>
            <div><span className="text-[#4a5f5d]">জন্মস্থান:</span> <b>গাজীপুর</b></div>
          </div>
          <div className="flex items-end justify-between px-3 pt-2">
            <svg width="86" height="30" viewBox="0 0 86 34" aria-hidden><path d="M3 24c8-18 14-18 12-2s6 4 12-6c3-5 4 6 8 5s7-12 11-8" fill="none" stroke="#1b2b2a" strokeWidth="1.6" strokeLinecap="round" /></svg>
            <div className="text-right text-[7.5px] text-[#4a5f5d]">প্রদানের তারিখ: ০১/০৭/২০২২<br />প্রদানকারী কর্তৃপক্ষ</div>
          </div>
          <div className="absolute bottom-3 left-3 right-3 h-8 bg-[repeating-linear-gradient(90deg,#1b2b2a_0_2px,transparent_2px_4px,#1b2b2a_4px_5px,transparent_5px_8px,#1b2b2a_8px_11px,transparent_11px_13px)]" />
        </>
      )}
      <div className="pointer-events-none absolute -right-1 bottom-8 rotate-[-18deg] text-[32px] font-bold text-[#1f4d58]/10">নমুনা</div>
    </div>
  );
}
