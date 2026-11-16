/* Bangla numerals, lakh-style grouping, dates and times. */

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Convert every ASCII digit in a string/number to Bangla digits. */
export function bn(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** Convert Bangla digits back to ASCII (for inputs). */
export function en(value: string): string {
  return value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

/** Lakh-style grouping: 2333000 → ২৩,৩৩,০০০ */
export function groupLakh(n: number, decimals = 0): string {
  const neg = n < 0;
  const fixed = Math.abs(n).toFixed(decimals);
  const [intPart, frac] = fixed.split(".");
  let out = "";
  if (intPart.length <= 3) {
    out = intPart;
  } else {
    const last3 = intPart.slice(-3);
    let rest = intPart.slice(0, -3);
    const groups: string[] = [];
    while (rest.length > 2) {
      groups.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest) groups.unshift(rest);
    out = groups.join(",") + "," + last3;
  }
  const s = frac ? `${out}.${frac}` : out;
  return bn((neg ? "-" : "") + s);
}

export function bnNum(n: number, decimals = 0) {
  return groupLakh(n, decimals);
}

export function taka(n: number, decimals = 0) {
  return `৳${groupLakh(n, decimals)}`;
}

export function pct(n: number, decimals = 0) {
  return `${bn(n.toFixed(decimals))}%`;
}

const MONTHS_BN = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];
const MONTHS_BN_SHORT = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];

export function monthName(m: number, short = false) {
  return (short ? MONTHS_BN_SHORT : MONTHS_BN)[m] ?? "";
}

function two(n: number) {
  return String(n).padStart(2, "0");
}

/** dd/mm/yyyy in Bangla digits */
export function fmtDate(d: Date | string | number): string {
  const dt = new Date(d);
  return bn(`${two(dt.getDate())}/${two(dt.getMonth() + 1)}/${dt.getFullYear()}`);
}

/** Period word used in Bangla for 12-hour times. */
function dayPart(h: number) {
  if (h < 4) return "রাত";
  if (h < 6) return "ভোর";
  if (h < 12) return "সকাল";
  if (h < 15) return "দুপুর";
  if (h < 18) return "বিকাল";
  if (h < 20) return "সন্ধ্যা";
  return "রাত";
}

/** e.g. সকাল ১০:২৪ */
export function fmtTime(d: Date | string | number): string {
  const dt = new Date(d);
  const h = dt.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${dayPart(h)} ${bn(h12)}:${bn(two(dt.getMinutes()))}`;
}

/** ০৯/১১/২০২৬, সকাল ১০:২৪ — always date and time, never relative words. */
export function fmtDateTime(d: Date | string | number): string {
  return `${fmtDate(d)}, ${fmtTime(d)}`;
}

/** ৯ নভেম্বর ২০২৬ */
export function fmtDateLong(d: Date | string | number): string {
  const dt = new Date(d);
  return `${bn(dt.getDate())} ${MONTHS_BN[dt.getMonth()]} ${bn(dt.getFullYear())}`;
}

export function fmtMonthYear(d: Date | string | number): string {
  const dt = new Date(d);
  return `${MONTHS_BN[dt.getMonth()]} ${bn(dt.getFullYear())}`;
}

export const WARD_NAME = (n: number) => `ওয়ার্ড ${bn(n)}`;

/** Bangla ordinal-ish list labels */
export const bnCount = (n: number, unit = "টি") => `${bn(n)}${unit}`;
