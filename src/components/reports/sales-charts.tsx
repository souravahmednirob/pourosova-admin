"use client";
import { useCallback, useMemo } from "react";
import { EChart, baseTooltip, type ChartTheme, type ChartOption } from "@/components/charts/echart";
import { Card } from "@/components/ui/primitives";
import { useData } from "@/store/data";
import { chartData } from "@/lib/reports";
import { CATEGORY_LABEL, type ProductCategory } from "@/lib/types";
import { bn, taka, monthName, groupLakh } from "@/lib/bn";

const short = (v: number) => (v >= 100000 ? `${bn((v / 100000).toFixed(1))} লা` : v >= 1000 ? `${bn(Math.round(v / 1000))} হা` : bn(v));

function catColor(t: ChartTheme, c: ProductCategory) {
  return { RICE_FLOUR: t.ochre, LENTIL: t.copper, OIL_SPICE: t.petrol, GROCERY: t.ink3, VEG: t.sage }[c];
}

function ChartCard({ title, subtitle, children, alt }: { title: string; subtitle: string; children: React.ReactNode; alt: string }) {
  return (
    <Card className="flex h-[360px] flex-col p-5">
      <h3 className="text-[17px] font-semibold text-ink">{title}</h3>
      <div className="text-[12.5px] text-ink-3">{subtitle}</div>
      <div className="mt-2 min-h-0 flex-1">{children}</div>
      <p className="sr-only">{alt}</p>
    </Card>
  );
}

export function SalesCharts() {
  const orders = useData((s) => s.orders);
  const products = useData((s) => s.products);
  const citizens = useData((s) => s.citizens);
  const wards = useData((s) => s.wards);
  const d = useMemo(() => chartData(orders, products, citizens, wards), [orders, products, citizens, wards]);
  const labels = d.months.map((x) => monthName(x.m, true));
  const span = `${monthName(d.months[0].m)} ${bn(d.months[0].y)} – ${monthName(d.months[11].m)} ${bn(d.months[11].y)}`;

  const axis = (t: ChartTheme) => ({
    axisLine: { lineStyle: { color: t.line } },
    axisTick: { show: false },
    axisLabel: { color: t.ink3, fontSize: 11.5 },
  });
  const valAxis = (t: ChartTheme) => ({
    type: "value" as const,
    splitLine: { lineStyle: { color: t.line, type: "dashed" as const } },
    axisLabel: { color: t.ink3, fontSize: 11.5, formatter: (v: number) => short(v) },
  });
  const anim = (reduced: boolean) => ({ animationDuration: reduced ? 0 : 1200, animationEasing: "cubicOut" as const });

  /* 1. monthly stacked bars by category */
  const monthly = useCallback(
    (t: ChartTheme, reduced: boolean): ChartOption => ({
      ...anim(reduced),
      grid: { left: 4, right: 8, top: 28, bottom: 4, containLabel: true },
      legend: { top: 0, left: 0, itemWidth: 10, itemHeight: 10, icon: "roundRect", textStyle: { color: t.ink2, fontSize: 11.5 } },
      tooltip: {
        ...baseTooltip(t),
        trigger: "axis",
        axisPointer: { type: "shadow", shadowStyle: { color: t.line } },
        formatter: (ps: { dataIndex: number; seriesName: string; value: number; color: string }[]) => {
          const i = ps[0].dataIndex;
          const rows = ps.filter((p) => p.value > 0).map((p) => `<div style="display:flex;justify-content:space-between;gap:18px"><span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color};margin-right:6px"></span>${p.seriesName}</span><b>${taka(p.value)}</b></div>`).join("");
          return `<div style="font-weight:600;margin-bottom:4px">${monthName(d.months[i].m)} ${bn(d.months[i].y)}</div>${rows}<div style="border-top:1px solid ${t.line};margin-top:6px;padding-top:6px;display:flex;justify-content:space-between"><span>মোট</span><b>${taka(d.monthSales[i])}</b></div>`;
        },
      },
      xAxis: { type: "category", data: labels, ...axis(t) },
      yAxis: valAxis(t),
      series: d.cats.map((c, ci) => ({
        name: CATEGORY_LABEL[c],
        type: "bar",
        stack: "s",
        barWidth: "56%",
        data: d.byCat[c],
        itemStyle: { color: catColor(t, c), borderRadius: ci === d.cats.length - 1 ? [5, 5, 0, 0] : 0 },
        animationDelay: (i: number) => (reduced ? 0 : i * 40),
      })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d],
  );

  /* 2. donut of product share */
  const donut = useCallback(
    (t: ChartTheme, reduced: boolean): ChartOption => {
      const palette = [t.ochre, t.copper, t.petrol, t.sage, t.copper2, t.petrol2, t.ink3, t.brick];
      const data = products.map((p, i) => ({ name: p.name, value: d.byProduct.get(p.id) ?? 0, itemStyle: { color: palette[i % palette.length] } })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
      const total = data.reduce((s, x) => s + x.value, 0);
      return {
        animationDuration: reduced ? 0 : 1300,
        animationType: "expansion",
        animationEasing: "cubicOut",
        title: { text: taka(total), subtext: "মোট বিক্রয়", left: "29%", top: "41%", textAlign: "center", textStyle: { color: t.ink, fontSize: 17, fontWeight: 700, fontFamily: t.font }, subtextStyle: { color: t.ink3, fontSize: 11.5, fontFamily: t.font }, itemGap: 2 },
        tooltip: { ...baseTooltip(t), trigger: "item", formatter: (p: { name: string; value: number; percent: number }) => `<b>${p.name}</b><br/>${taka(p.value)} · ${bn(p.percent.toFixed(1))}%` },
        legend: {
          orient: "vertical",
          right: 0,
          top: "middle",
          itemWidth: 10,
          itemHeight: 10,
          icon: "circle",
          itemGap: 9,
          textStyle: { color: t.ink2, fontSize: 12 },
          formatter: (name: string) => {
            const v = data.find((x) => x.name === name)?.value ?? 0;
            return `${name}  ${bn(total ? Math.round((v / total) * 100) : 0)}%`;
          },
        },
        series: [{ type: "pie", radius: ["54%", "80%"], center: ["30%", "52%"], padAngle: 1.5, itemStyle: { borderRadius: 6, borderColor: t.surface, borderWidth: 2 }, label: { show: false }, emphasis: { scale: true, scaleSize: 5 }, data }],
      };
    },
    [d, products],
  );

  /* 3. citizen savings: two lines */
  const savings = useCallback(
    (t: ChartTheme, reduced: boolean): ChartOption => ({
      ...anim(reduced),
      grid: { left: 4, right: 8, top: 28, bottom: 4, containLabel: true },
      legend: { top: 0, left: 0, itemWidth: 14, itemHeight: 3, textStyle: { color: t.ink2, fontSize: 11.5 } },
      tooltip: {
        ...baseTooltip(t),
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: t.copper, type: "dashed" } },
        formatter: (ps: { dataIndex: number }[]) => {
          const i = ps[0].dataIndex;
          return `<div style="font-weight:600;margin-bottom:4px">${monthName(d.months[i].m)} ${bn(d.months[i].y)}</div>
          <div style="display:flex;justify-content:space-between;gap:18px"><span style="color:${t.ink3}">বাজার মূল্য হলে</span><b>${taka(d.monthMarket[i])}</b></div>
          <div style="display:flex;justify-content:space-between;gap:18px"><span style="color:${t.ink3}">পৌরসভার মূল্য</span><b>${taka(d.monthSales[i])}</b></div>
          <div style="display:flex;justify-content:space-between;gap:18px;margin-top:4px"><span>সাশ্রয়</span><b style="color:${t.sage}">${taka(d.monthMarket[i] - d.monthSales[i])}</b></div>`;
        },
      },
      xAxis: { type: "category", boundaryGap: false, data: labels, ...axis(t) },
      yAxis: valAxis(t),
      series: [
        { name: "বাজার মূল্য হলে", type: "line", smooth: 0.3, showSymbol: false, data: d.monthMarket, lineStyle: { width: 2, color: t.ink3, type: "dashed" }, itemStyle: { color: t.ink3 } },
        {
          name: "পৌরসভার মূল্য",
          type: "line",
          smooth: 0.3,
          showSymbol: false,
          data: d.monthSales,
          lineStyle: { width: 2.5, color: t.sage },
          itemStyle: { color: t.sage },
          areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: t.sage + "40" }, { offset: 1, color: t.sage + "00" }] } },
        },
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d],
  );

  /* 4. wards horizontal bars */
  const wardsOpt = useCallback(
    (t: ChartTheme, reduced: boolean): ChartOption => {
      const nums = wards.map((w) => w.number);
      return {
        ...anim(reduced),
        grid: { left: 4, right: 56, top: 4, bottom: 4, containLabel: true },
        tooltip: { ...baseTooltip(t), trigger: "item", formatter: (p: { name: string; value: number }) => `<b>${p.name}</b><br/>${taka(p.value)}` },
        xAxis: { type: "value", show: false },
        yAxis: { type: "category", inverse: true, data: nums.map((n) => `ওয়ার্ড ${bn(n)}`), ...axis(t) },
        series: [
          {
            type: "bar",
            barWidth: "58%",
            data: nums.map((n) => d.byWard.get(n) ?? 0),
            itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: t.petrol2 }, { offset: 1, color: t.petrol }] }, borderRadius: [0, 6, 6, 0] },
            label: { show: true, position: "right", color: t.ink2, fontSize: 11.5, formatter: (p: { value: number }) => short(p.value) },
            showBackground: true,
            backgroundStyle: { color: t.line, borderRadius: [0, 6, 6, 0] },
            animationDelay: (i: number) => (reduced ? 0 : i * 60),
          },
        ],
      };
    },
     
    [d, wards],
  );

  const top = [...d.byProduct.entries()].sort((a, b) => b[1] - a[1])[0];
  const topName = products.find((p) => p.id === top?.[0])?.name;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ChartCard title="মাসভিত্তিক বিক্রয়" subtitle={`ক্যাটাগরি অনুযায়ী · ${span}`} alt={`মাসভিত্তিক বিক্রয়: ${labels.map((l, i) => `${l} ${taka(d.monthSales[i])}`).join(", ")}`}>
        <EChart option={monthly} ariaLabel="মাসভিত্তিক বিক্রয়ের স্ট্যাকড বার চার্ট" />
      </ChartCard>
      <ChartCard title="কোন পণ্য কত অংশ" subtitle="বিক্রয় মূল্যের ভাগ" alt={`সবচেয়ে বেশি বিক্রি ${topName ?? "—"}`}>
        <EChart option={donut} ariaLabel="পণ্যভিত্তিক বিক্রয়ের অংশ ডোনাট চার্ট" />
      </ChartCard>
      <ChartCard title="নাগরিকের সাশ্রয়" subtitle="বাজার মূল্য বনাম পৌরসভার মূল্য, প্রতি মাসে" alt={`মোট সাশ্রয় ${taka(d.monthMarket.reduce((a, b) => a + b, 0) - d.monthSales.reduce((a, b) => a + b, 0))}`}>
        <EChart option={savings} ariaLabel="মাসভিত্তিক বাজার মূল্য ও পৌরসভার মূল্যের লাইন চার্ট" />
      </ChartCard>
      <ChartCard title="কোন ওয়ার্ডে কত বিক্রি" subtitle="ওয়ার্ড ১–৯" alt={wards.map((w) => `ওয়ার্ড ${bn(w.number)} ${groupLakh(d.byWard.get(w.number) ?? 0)}`).join(", ")}>
        <EChart option={wardsOpt} ariaLabel="ওয়ার্ডভিত্তিক বিক্রয়ের অনুভূমিক বার চার্ট" />
      </ChartCard>
    </div>
  );
}
