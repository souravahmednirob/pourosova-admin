"use client";
import * as echarts from "echarts/core";
import { LineChart, BarChart, PieChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent, DatasetComponent, AriaComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";
import { useEffect, useRef } from "react";
import { useUI, useReducedMotion } from "@/store/ui";
import { cn } from "@/lib/utils";

echarts.use([LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, DatasetComponent, AriaComponent, CanvasRenderer]);

export interface ChartTheme {
  ink: string;
  ink2: string;
  ink3: string;
  line: string;
  surface: string;
  petrol: string;
  copper: string;
  sage: string;
  ochre: string;
  brick: string;
  copper2: string;
  petrol2: string;
  font: string;
}

/** Reads the live CSS variables so charts follow the theme. */
export function readChartTheme(): ChartTheme {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return {
    ink: v("--ink"),
    ink2: v("--ink-2"),
    ink3: v("--ink-3"),
    line: v("--line-strong"),
    surface: v("--surface-solid"),
    petrol: v("--petrol"),
    petrol2: v("--petrol-2"),
    copper: v("--copper"),
    copper2: v("--copper-2"),
    sage: v("--sage-2"),
    ochre: v("--ochre-2"),
    brick: v("--brick-2"),
    font: "'Hind Siliguri', system-ui, sans-serif",
  };
}

export function baseTooltip(t: ChartTheme) {
  return {
    backgroundColor: t.surface,
    borderColor: t.line,
    borderWidth: 1,
    padding: [10, 12],
    textStyle: { color: t.ink, fontFamily: t.font, fontSize: 13 },
    extraCssText: "border-radius:12px;box-shadow:0 12px 32px -8px rgba(0,0,0,.25);",
  };
}

export type ChartOption = EChartsCoreOption;
export function EChart({ option, className, ariaLabel, onReady }: { option: (t: ChartTheme, reduced: boolean) => EChartsCoreOption; className?: string; ariaLabel: string; onReady?: (chart: echarts.ECharts) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const theme = useUI((s) => s.theme);
  const reduced = useReducedMotion();
  const optionRef = useRef(option);
  useEffect(() => {
    optionRef.current = option;
  }, [option]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chart = echarts.init(el, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    onReady?.(chart);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    // read theme after the class flips (next frame) so colours are current
    const id = requestAnimationFrame(() => {
      const t = readChartTheme();
      chart.setOption({ textStyle: { fontFamily: t.font }, ...optionRef.current(t, reduced) }, true);
    });
    return () => cancelAnimationFrame(id);
  }, [option, theme, reduced]);

  return <div ref={ref} role="img" aria-label={ariaLabel} className={cn("h-full w-full", className)} />;
}
