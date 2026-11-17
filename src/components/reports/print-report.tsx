"use client";
import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";
import type { ProductRow } from "@/lib/reports";
import { CATEGORY_LABEL, UNIT_LABEL } from "@/lib/types";
import { bn, taka, fmtDateTime } from "@/lib/bn";

const subscribe = () => () => {};

/** Plain, ink-friendly copy of the filtered report, mounted at <body> level and shown only when printing. */
export function PrintReport({ rows, totals, rangeText, categoryText, preparedBy }: { rows: ProductRow[]; totals: { sales: number; orders: number; market: number; saving: number }; rangeText: string; categoryText: string; preparedBy?: string }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!mounted) return null;
  const th = "border-b-2 border-black px-2 py-1.5 text-left text-[11px] font-bold";
  const td = "border-b border-[#bbb] px-2 py-1.5 text-[11px]";
  return createPortal(
    <div className="print-root hidden bg-white font-sans text-black print:block">
      <div className="flex items-end justify-between border-b-2 border-black pb-2">
        <div>
          <div className="text-[18px] font-bold">কালিয়াকৈর পৌরসভা — নাগরিক রেশন সেবা</div>
          <div className="text-[14px] font-semibold">বিক্রয় রিপোর্ট</div>
        </div>
        <div className="text-right text-[10.5px]">
          <div>সময়: {rangeText}</div>
          <div>ক্যাটাগরি: {categoryText}</div>
          <div>প্রিন্ট: {fmtDateTime(new Date())}{preparedBy ? ` · ${preparedBy}` : ""}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[
          ["মোট বিক্রয়", taka(totals.sales)],
          ["মোট অর্ডার", bn(totals.orders)],
          ["বাজার মূল্য হলে", taka(totals.market)],
          ["নাগরিকের সাশ্রয়", taka(totals.saving)],
        ].map(([l, v]) => (
          <div key={l} className="rounded border border-[#999] px-3 py-2">
            <div className="text-[10.5px]">{l}</div>
            <div className="text-[16px] font-bold">{v}</div>
          </div>
        ))}
      </div>
      <table className="mt-3 w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>পণ্য</th>
            <th className={th}>ক্যাটাগরি</th>
            <th className={`${th} text-right`}>বিক্রিত পরিমাণ</th>
            <th className={`${th} text-right`}>মোট বিক্রয়</th>
            <th className={`${th} text-right`}>বাজার মূল্য হলে</th>
            <th className={`${th} text-right`}>নাগরিকের সাশ্রয়</th>
            <th className={`${th} text-right`}>অর্ডার</th>
            <th className={`${th} text-right`}>মজুত বাকি</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.product.id} className="break-inside-avoid">
              <td className={`${td} font-semibold`}>{r.product.name}</td>
              <td className={td}>{CATEGORY_LABEL[r.product.category]}</td>
              <td className={`${td} text-right`}>{bn(r.qty)} {UNIT_LABEL[r.product.unit]}</td>
              <td className={`${td} text-right font-semibold`}>{taka(r.sales)}</td>
              <td className={`${td} text-right`}>{taka(r.market)}</td>
              <td className={`${td} text-right`}>{taka(r.saving)}</td>
              <td className={`${td} text-right`}>{bn(r.orders)}</td>
              <td className={`${td} text-right`}>{bn(r.product.stock)} {UNIT_LABEL[r.product.unit]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 text-[9.5px] text-[#555]">শুধু সংগ্রহ সম্পন্ন অর্ডার থেকে হিসাব। নমুনা ডেটা।</div>
    </div>,
    document.body,
  );
}
