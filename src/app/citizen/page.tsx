import { Aurora } from "@/components/shell/aurora";
import { ThemeSync } from "@/components/shell/theme";
import { LogoMark } from "@/components/shell/logo";

export default function CitizenHome() {
  return (
    <>
      <Aurora />
      <ThemeSync />
      <div className="relative z-10 grid min-h-dvh place-items-center p-4">
        <div className="glass-strong hairline card page-enter w-full max-w-[420px] p-8 text-center">
          <div className="mx-auto mb-4 w-fit"><LogoMark size={60} /></div>
          <h1 className="text-[22px] font-bold text-ink">নাগরিক রেশন সেবা</h1>
          <p className="mt-1 text-[14px] text-ink-3">কালিয়াকৈর পৌরসভা</p>
          <p className="mt-6 text-[13.5px] text-ink-2">নাগরিক অ্যাপ পরের ধাপে যুক্ত হবে।</p>
        </div>
      </div>
    </>
  );
}
