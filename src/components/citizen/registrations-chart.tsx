"use client";
import { useCallback, useMemo, useState } from "react";
import { EChart, baseTooltip, type ChartTheme, type ChartOption } from "@/components/charts/echart";
import { NativeSelect } from "@/components/ui/primitives";
import { useData } from "@/store/data";
import { bn, monthName } from "@/lib/bn";

export function RegistrationsChart() {
  const citizens = useData((s) => s.citizens);
  const years = useMemo(() => {
    const ys = new Set(citizens.map((c) => new Date(c.registeredAt).getFullYear()));
    ys.add(new Date().getFullYear());
    return [...ys].sort((a, b) => b - a);
  }, [citizens]);
  const [year, setYear] = useState(() => new Date().getFullYear());

  const data = useMemo(() => {
    const perMonth = Array(12).fill(0) as number[];
    let before = 0;
    for (const c of citizens) {
      const d = new Date(c.registeredAt);
      if (d.getFullYear() === year) perMonth[d.getMonth()] += 1;
      else if (d.getFullYear() < year) before += 1;
    }
    const cumulative: number[] = [];
    let run = before;
    for (let m = 0; m < 12; m++) {
      run += perMonth[m];
      cumulative.push(run);
    }
    // months in the future stay empty (gap) instead of dropping to zero
    const now = new Date();
    const series: (number | null)[] = perMonth.map((v, m) => (year > now.getFullYear() || (year === now.getFullYear() && m > now.getMonth()) ? null : v));
    return { perMonth, cumulative, series };
  }, [citizens, year]);

  const option = useCallback(
    (t: ChartTheme, reduced: boolean): ChartOption => ({
      animationDuration: reduced ? 0 : 1400,
      animationEasing: "cubicOut" as const,
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        ...baseTooltip(t),
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: t.copper, width: 1, type: "dashed" } },
        formatter: (params: { dataIndex: number }[]) => {
          const i = params[0].dataIndex;
          return `<div style="font-weight:600;margin-bottom:4px">${monthName(i)} ${bn(year)}</div>
            <div style="display:flex;justify-content:space-between;gap:18px"><span style="color:${t.ink3}">মোট নিবন্ধিত</span><b>${bn(data.cumulative[i])}</b></div>
            <div style="display:flex;justify-content:space-between;gap:18px"><span style="color:${t.ink3}">এই মাসে যুক্ত</span><b style="color:${t.copper}">+${bn(data.perMonth[i])}</b></div>`;
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: Array.from({ length: 12 }, (_, i) => monthName(i, true)),
        axisLine: { lineStyle: { color: t.line } },
        axisTick: { show: false },
        axisLabel: { color: t.ink3, fontSize: 12 },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: t.line, type: "dashed" } },
        axisLabel: { color: t.ink3, fontSize: 12, formatter: (v: number) => bn(v) },
      },
      series: [
        {
          name: "নতুন নিবন্ধন",
          type: "line",
          smooth: 0.25,
          smoothMonotone: "x",
          connectNulls: false,
          symbol: "circle",
          symbolSize: 7,
          showSymbol: false,
          data: data.series,
          lineStyle: { width: 2.5, color: t.copper },
          itemStyle: { color: t.copper, borderColor: t.surface, borderWidth: 2 },
          emphasis: { scale: 1.6 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: t.copper + "55" },
                { offset: 1, color: t.copper + "00" },
              ],
            },
          },
        },
      ],
      aria: { enabled: true, decal: { show: false } },
    }),
    [data, year],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[17px] font-semibold text-ink">মাসভিত্তিক নতুন নিবন্ধন</h3>
        <NativeSelect value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-9 w-[110px] px-3 text-[13px]" aria-label="বছর">
          {years.map((y) => (
            <option key={y} value={y}>{bn(y)}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="mt-2 min-h-[260px] flex-1">
        <EChart option={option} ariaLabel={`${bn(year)} সালে মাসভিত্তিক নতুন নিবন্ধনের লাইন চার্ট`} />
      </div>
    </div>
  );
}
