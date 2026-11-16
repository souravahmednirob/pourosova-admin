import { Hammer } from "lucide-react";
import { PageHeader } from "./page-header";

export function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="glass card flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sunken text-ink-3">
          <Hammer className="h-5.5 w-5.5" strokeWidth={1.8} />
        </div>
        <div className="text-[16px] font-semibold text-ink-2">এই অংশটি {phase}-এ যুক্ত হবে</div>
        <div className="max-w-md text-[13.5px] text-ink-3">ফাউন্ডেশন (থিম, শেল, লগইন, ডেটা) প্রস্তুত। পরের ধাপে এই পেজের পূর্ণ কার্যকারিতা আসছে।</div>
      </div>
    </>
  );
}
