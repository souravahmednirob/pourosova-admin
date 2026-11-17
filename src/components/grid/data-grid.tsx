"use client";
/* Custom data grid — row-group bar, sortable headers with ⋮ menus, floating filters,
   column side tab, pagination footer, Excel export. No external grid library. */
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Columns3, EyeOff, Filter, GripVertical, Layers, MoreVertical, RotateCcw, Search, FileSpreadsheet, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { bn } from "@/lib/bn";
import { Empty, NativeSelect } from "@/components/ui/primitives";

export interface GridColumn<T> {
  key: string;
  label: string;
  /** value used for sorting, filtering, grouping and export */
  value: (row: T) => string | number | null | undefined;
  /** cell renderer; defaults to value */
  render?: (row: T) => ReactNode;
  width?: number;
  minWidth?: number;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  filterable?: boolean;
  groupable?: boolean;
  /** text filter (default) or select from unique values */
  filter?: "text" | "select";
  hiddenByDefault?: boolean;
  /** class for the cell */
  className?: string;
}

interface SortState {
  key: string;
  dir: "asc" | "desc";
}

export interface DataGridProps<T> {
  rows: T[];
  columns: GridColumn<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  toolbar?: ReactNode;
  /** text for the primary button area (rendered as-is) */
  primaryAction?: ReactNode;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  defaultSort?: SortState;
  exportFileName?: string;
  /** optional id of the row to highlight + scroll to */
  highlightKey?: string | null;
  quickSearch?: (row: T, q: string) => boolean;
  emptyTitle?: string;
  storageKey?: string;
  minHeight?: number;
  /** turn off the row-group bar / floating filters / column tab for simpler tables */
  features?: { groupBar?: boolean; filters?: boolean; columnPanel?: boolean; menu?: boolean };
}

type DisplayRow<T> = { type: "row"; row: T; depth: number } | { type: "group"; key: string; label: string; count: number; depth: number; path: string; colLabel: string };

function cmp(a: unknown, b: unknown) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "bn");
}

export function DataGrid<T>({ rows, columns, rowKey, onRowClick, toolbar, primaryAction, pageSizeOptions = [8, 15, 25, 50, 100], defaultPageSize = 8, defaultSort, exportFileName = "export", highlightKey, quickSearch, emptyTitle = "কোনো তথ্য নেই", storageKey, minHeight = 420, features }: DataGridProps<T>) {
  const feat = { groupBar: true, filters: true, columnPanel: true, menu: true, ...features };
  const [sort, setSort] = useState<SortState | null>(defaultSort ?? null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(columns.filter((c) => c.hiddenByDefault).map((c) => c.key)));
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [colPanel, setColPanel] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const dragKey = useRef<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // remember column visibility per grid
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(`kp-grid-${storageKey}`);
      if (raw) {
        const v = JSON.parse(raw) as { hidden?: string[]; pageSize?: number };
        if (v.hidden) queueMicrotask(() => setHidden(new Set(v.hidden)));
        if (v.pageSize) queueMicrotask(() => setPageSize(v.pageSize!));
      }
    } catch {}
  }, [storageKey]);
  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(`kp-grid-${storageKey}`, JSON.stringify({ hidden: [...hidden], pageSize }));
  }, [hidden, pageSize, storageKey]);

  const visibleCols = columns.filter((c) => !hidden.has(c.key));
  const colByKey = useMemo(() => Object.fromEntries(columns.map((c) => [c.key, c])), [columns]);

  // ── filter → sort ──
  const processed = useMemo(() => {
    let out = rows;
    const active = Object.entries(filters).filter(([, v]) => v.trim());
    if (active.length) {
      out = out.filter((r) =>
        active.every(([k, v]) => {
          const col = colByKey[k];
          if (!col) return true;
          const val = col.value(r);
          if (col.filter === "select") return String(val ?? "") === v;
          return String(val ?? "").toLowerCase().includes(v.toLowerCase()) || bn(String(val ?? "")).includes(v);
        }),
      );
    }
    if (q.trim() && quickSearch) out = out.filter((r) => quickSearch(r, q.trim()));
    if (sort) {
      const col = colByKey[sort.key];
      if (col) {
        out = [...out].sort((a, b) => {
          const r = cmp(col.value(a), col.value(b));
          return sort.dir === "asc" ? r : -r;
        });
      }
    }
    return out;
  }, [rows, filters, q, sort, colByKey, quickSearch]);

  // ── group → flatten ──
  const display = useMemo<DisplayRow<T>[]>(() => {
    if (!groupBy.length) return processed.map((row) => ({ type: "row", row, depth: 0 }));
    const build = (items: T[], depth: number, path: string): DisplayRow<T>[] => {
      if (depth >= groupBy.length) return items.map((row) => ({ type: "row", row, depth }));
      const col = colByKey[groupBy[depth]];
      const map = new Map<string, T[]>();
      for (const it of items) {
        const k = String(col.value(it) ?? "—");
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(it);
      }
      const keys = [...map.keys()].sort((a, b) => cmp(a, b));
      const out: DisplayRow<T>[] = [];
      for (const k of keys) {
        const p = `${path}/${k}`;
        const children = map.get(k)!;
        out.push({ type: "group", key: p, label: k, count: children.length, depth, path: p, colLabel: col.label });
        if (!collapsed.has(p)) out.push(...build(children, depth + 1, p));
      }
      return out;
    };
    return build(processed, 0, "");
  }, [processed, groupBy, collapsed, colByKey]);

  const total = display.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const pageRows = display.slice(start, start + pageSize);

  // jump to highlighted row
  useEffect(() => {
    if (!highlightKey) return;
    const idx = display.findIndex((d) => d.type === "row" && rowKey(d.row) === highlightKey);
    if (idx >= 0) {
      const p = Math.floor(idx / pageSize) + 1;
      queueMicrotask(() => setPage(p));
      setTimeout(() => bodyRef.current?.querySelector(`[data-rowkey="${CSS.escape(highlightKey)}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 120);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightKey]);

  const toggleSort = (key: string) => {
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const data = processed.map((r) => Object.fromEntries(visibleCols.map((c) => [c.label, c.value(r) ?? ""])));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${exportFileName}.xlsx`);
  };

  const reset = () => {
    setSort(defaultSort ?? null);
    setFilters({});
    setGroupBy([]);
    setCollapsed(new Set());
    setQ("");
    setPage(1);
  };

  const uniqueValues = (col: GridColumn<T>) => [...new Set(rows.map((r) => String(col.value(r) ?? "")))].filter(Boolean).sort((a, b) => cmp(a, b));

  const headerBtn = "flex h-7 w-7 items-center justify-center rounded-md text-ink-3 opacity-0 transition-opacity hover:bg-sunken hover:text-ink group-hover/head:opacity-100 data-[state=open]:opacity-100";
  const menuItem = "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-ink-2 outline-none data-[highlighted]:bg-sunken data-[highlighted]:text-ink";

  return (
    <div className="glass card relative flex flex-col overflow-hidden" style={{ minHeight }}>
      {/* ── Top bar: group drop zone + actions ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        {feat.groupBar ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const k = dragKey.current ?? e.dataTransfer.getData("text/col");
            if (k && !groupBy.includes(k)) {
              setGroupBy((g) => [...g, k]);
              setPage(1);
            }
            dragKey.current = null;
          }}
          className={cn("flex min-h-10 min-w-[260px] flex-1 flex-wrap items-center gap-2 rounded-xl border border-dashed px-3 py-1.5 text-[13px] transition-colors", dragOver ? "border-copper bg-copper-soft/50 text-copper-deep" : "border-line-strong text-ink-4")}
        >
          <Layers className="h-4 w-4 shrink-0 opacity-70" strokeWidth={1.8} />
          {groupBy.length === 0 && <span>গ্রুপ করতে কলাম এখানে টেনে আনুন</span>}
          {groupBy.map((k, i) => (
            <span key={k} className="pill bg-petrol-soft text-petrol">
              {i > 0 && <ChevronRight className="h-3 w-3 opacity-60" />}
              {colByKey[k]?.label}
              <button type="button" onClick={() => setGroupBy((g) => g.filter((x) => x !== k))} className="-mr-1 rounded-full p-0.5 hover:bg-petrol/15" aria-label="গ্রুপ সরান">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{toolbar}</div>
        )}
        {feat.groupBar && toolbar}
        {primaryAction}
        <div className="flex items-center gap-1">
          {quickSearch && (
            <div className={cn("flex items-center overflow-hidden transition-[width] duration-300 ease-[var(--ease-out)]", searchOpen ? "w-[220px]" : "w-10")}>
              {searchOpen ? (
                <div className="ctl flex h-10 w-full items-center gap-2 px-3">
                  <Search className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.8} />
                  <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="খুঁজুন…" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-ink-4 focus-visible:outline-none" onBlur={() => !q && setSearchOpen(false)} />
                  <button type="button" onClick={() => { setQ(""); setSearchOpen(false); }} className="text-ink-3 hover:text-ink" aria-label="বন্ধ"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => setSearchOpen(true)} className="grid h-10 w-10 place-items-center rounded-[12px] border border-line-strong bg-surface-solid text-ink-2 hover:text-ink" aria-label="খুঁজুন">
                  <Search className="h-4.5 w-4.5" strokeWidth={1.8} />
                </button>
              )}
            </div>
          )}
          {feat.menu && <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-[12px] border border-line-strong bg-surface-solid text-ink-2 hover:text-ink" aria-label="গ্রিড মেনু">
                <MoreVertical className="h-4.5 w-4.5" strokeWidth={1.8} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={8} className="glass-strong z-[60] w-[220px] rounded-[14px] p-1.5 outline-none data-[state=open]:animate-[page-in_200ms_var(--ease-out)]">
                <DropdownMenu.Item onSelect={exportExcel} className={menuItem}><FileSpreadsheet className="h-4 w-4" strokeWidth={1.8} /> এক্সেলে এক্সপোর্ট</DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => setColPanel(true)} className={menuItem}><Columns3 className="h-4 w-4" strokeWidth={1.8} /> কলাম দেখান/লুকান</DropdownMenu.Item>
                <DropdownMenu.Separator className="divider my-1" />
                <DropdownMenu.Item onSelect={reset} className={menuItem}><RotateCcw className="h-4 w-4" strokeWidth={1.8} /> ফিল্টার ও সাজানো রিসেট</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="relative flex min-h-0 flex-1">
        <div ref={bodyRef} className="table-wrap min-h-0 flex-1">
          <table className="w-full border-separate border-spacing-0 text-[13.5px]">
            <thead className="sticky top-0 z-[2]">
              <tr>
                {groupBy.length > 0 && <th className="w-9 border-b border-line bg-[var(--surface-solid)]" />}
                {visibleCols.map((c) => {
                  const sorted = sort?.key === c.key;
                  return (
                    <th
                      key={c.key}
                      draggable={feat.groupBar && c.groupable !== false}
                      onDragStart={(e) => {
                        dragKey.current = c.key;
                        e.dataTransfer.setData("text/col", c.key);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      style={{ width: c.width, minWidth: c.minWidth ?? 100 }}
                      aria-sort={sorted ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"}
                      className={cn("group/head border-b border-r border-line bg-[var(--surface-solid)] px-3 py-0 text-left last:border-r-0", c.align === "right" && "text-right")}
                    >
                      <div className="flex h-11 items-center gap-1">
                        {feat.groupBar && c.groupable !== false && <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-ink-4 opacity-0 transition-opacity group-hover/head:opacity-100" strokeWidth={1.8} />}
                        <button type="button" onClick={() => c.sortable !== false && toggleSort(c.key)} className={cn("label-caps flex min-w-0 flex-1 items-center gap-1.5 truncate text-left", c.align === "right" && "justify-end")}>
                          <span className="truncate">{c.label}</span>
                          {c.sortable !== false && (sorted ? sort!.dir === "asc" ? <ArrowUp className="h-3.5 w-3.5 shrink-0" /> : <ArrowDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover/head:opacity-60" />)}
                        </button>
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button type="button" className={headerBtn} aria-label={`${c.label} কলাম মেনু`}>
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content align="start" sideOffset={6} className="glass-strong z-[60] w-[210px] rounded-[14px] p-1.5 outline-none data-[state=open]:animate-[page-in_200ms_var(--ease-out)]">
                              {c.sortable !== false && (
                                <>
                                  <DropdownMenu.Item onSelect={() => setSort({ key: c.key, dir: "asc" })} className={menuItem}><ArrowUp className="h-4 w-4" /> ছোট থেকে বড়</DropdownMenu.Item>
                                  <DropdownMenu.Item onSelect={() => setSort({ key: c.key, dir: "desc" })} className={menuItem}><ArrowDown className="h-4 w-4" /> বড় থেকে ছোট</DropdownMenu.Item>
                                  <DropdownMenu.Item onSelect={() => setSort(null)} className={menuItem}><ArrowUpDown className="h-4 w-4" /> সাজানো তুলে দিন</DropdownMenu.Item>
                                  <DropdownMenu.Separator className="divider my-1" />
                                </>
                              )}
                              {feat.groupBar && c.groupable !== false && <DropdownMenu.Item onSelect={() => !groupBy.includes(c.key) && setGroupBy((g) => [...g, c.key])} className={menuItem}><Layers className="h-4 w-4" /> এই কলামে গ্রুপ</DropdownMenu.Item>}
                              <DropdownMenu.Item onSelect={() => setHidden((h) => new Set([...h, c.key]))} className={menuItem}><EyeOff className="h-4 w-4" /> কলাম লুকান</DropdownMenu.Item>
                              <DropdownMenu.Item onSelect={() => setColPanel(true)} className={menuItem}><Columns3 className="h-4 w-4" /> সব কলাম…</DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </div>
                    </th>
                  );
                })}
              </tr>
              {/* floating filter row */}
              {feat.filters && <tr>
                {groupBy.length > 0 && <td className="border-b border-line bg-[var(--surface-solid)]" />}
                {visibleCols.map((c) => (
                  <td key={c.key} className="border-b border-r border-line bg-[var(--surface-solid)] px-2 py-1.5 last:border-r-0">
                    {c.filterable !== false ? (
                      c.filter === "select" ? (
                        <div className="relative">
                          <select value={filters[c.key] ?? ""} onChange={(e) => { setFilters((f) => ({ ...f, [c.key]: e.target.value })); setPage(1); }} className="h-8 w-full appearance-none rounded-lg border border-line bg-transparent pl-7 pr-6 text-[12.5px] text-ink-2 outline-none focus:border-copper" aria-label={`${c.label} ফিল্টার`}>
                            <option value="">সব</option>
                            {uniqueValues(c).map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                          <Filter className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" strokeWidth={1.8} />
                          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" strokeWidth={1.8} />
                        </div>
                      ) : (
                        <div className="relative">
                          <Filter className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" strokeWidth={1.8} />
                          <input value={filters[c.key] ?? ""} onChange={(e) => { setFilters((f) => ({ ...f, [c.key]: e.target.value })); setPage(1); }} placeholder="ফিল্টার…" className="h-8 w-full rounded-lg border border-line bg-transparent pl-7 pr-2 text-[12.5px] text-ink-2 outline-none placeholder:text-ink-4 focus:border-copper focus-visible:outline-none" aria-label={`${c.label} ফিল্টার`} />
                        </div>
                      )
                    ) : null}
                  </td>
                ))}
              </tr>}
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={visibleCols.length + (groupBy.length ? 1 : 0)}>
                    <Empty title={emptyTitle} hint="ফিল্টার বদলে দেখুন" />
                  </td>
                </tr>
              )}
              {pageRows.map((d) =>
                d.type === "group" ? (
                  <tr key={d.key} className="bg-sunken/60">
                    <td colSpan={visibleCols.length + 1} className="border-b border-line px-3 py-0">
                      <button type="button" onClick={() => setCollapsed((s) => { const n = new Set(s); if (n.has(d.path)) n.delete(d.path); else n.add(d.path); return n; })} className="flex h-10 w-full items-center gap-2 text-left text-[13.5px] font-semibold text-ink" style={{ paddingLeft: d.depth * 20 }}>
                        <ChevronDown className={cn("h-4 w-4 text-ink-3 transition-transform", collapsed.has(d.path) && "-rotate-90")} />
                        <span className="text-ink-3">{d.colLabel}:</span> {d.label}
                        <span className="num rounded-full bg-petrol-soft px-2 py-0.5 text-[11.5px] text-petrol">{bn(d.count)}</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={rowKey(d.row)}
                    data-rowkey={rowKey(d.row)}
                    onClick={() => onRowClick?.(d.row)}
                    tabIndex={onRowClick ? 0 : -1}
                    onKeyDown={(e) => { if (onRowClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onRowClick(d.row); } }}
                    className={cn("group/row transition-colors duration-150", onRowClick && "cursor-pointer hover:bg-copper-soft/35 focus-visible:bg-copper-soft/35 focus-visible:outline-none", highlightKey === rowKey(d.row) && "bg-sage-soft/70")}
                  >
                    {groupBy.length > 0 && <td className="border-b border-line" />}
                    {visibleCols.map((c, i) => (
                      <td key={c.key} className={cn("border-b border-r border-line px-3 py-2.5 align-middle last:border-r-0", c.align === "right" && "text-right", c.align === "center" && "text-center", c.className)} style={i === 0 ? { paddingLeft: 12 + d.depth * 20 } : undefined}>
                        {c.render ? c.render(d.row) : (c.value(d.row) ?? "—")}
                      </td>
                    ))}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        {/* column side tab */}
        {feat.columnPanel && <div className="relative z-[3] flex shrink-0 border-l border-line bg-[var(--surface-solid)]">
          <button type="button" onClick={() => setColPanel((v) => !v)} className={cn("flex w-8 items-start justify-center pt-3 text-[12px] font-semibold tracking-wider text-ink-3 transition-colors hover:text-ink [writing-mode:vertical-rl]", colPanel && "text-copper-deep dark:text-copper")} aria-expanded={colPanel} aria-label="কলাম প্যানেল">
            <span className="flex items-center gap-1.5"><Columns3 className="h-3.5 w-3.5 rotate-90" strokeWidth={1.8} /> কলাম</span>
          </button>
          {colPanel && (
            <div className="w-[220px] border-l border-line p-3 animate-[page-in_200ms_var(--ease-out)]">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink">কলাম</span>
                <button type="button" onClick={() => setColPanel(false)} className="text-ink-3 hover:text-ink" aria-label="বন্ধ"><X className="h-4 w-4" /></button>
              </div>
              <ul className="flex flex-col gap-0.5">
                {columns.map((c) => {
                  const on = !hidden.has(c.key);
                  return (
                    <li key={c.key}>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-ink-2 hover:bg-sunken">
                        <span className={cn("grid h-4.5 w-4.5 place-items-center rounded-[6px] border transition-colors", on ? "border-copper bg-copper text-white" : "border-line-strong")}>{on && <Check className="h-3 w-3" strokeWidth={3} />}</span>
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => setHidden((h) => { const n = new Set(h); if (n.has(c.key)) n.delete(c.key); else if (visibleCols.length > 1) n.add(c.key); return n; })} />
                        {c.label}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>}
      </div>

      {/* ── Footer ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-[13px] text-ink-3">
        <div className="flex items-center gap-2">
          <span>প্রতি পাতায়</span>
          <NativeSelect value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-8 w-[74px] px-2.5 text-[13px]" aria-label="পাতার আকার">
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{bn(n)}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex items-center gap-3">
          <span className="num tabular">{total === 0 ? "০" : `${bn(start + 1)}–${bn(Math.min(start + pageSize, total))}`} / {bn(total)}</span>
          <div className="flex items-center gap-1">
            <button type="button" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-line-strong text-ink-2 transition-colors hover:bg-sunken disabled:opacity-40" aria-label="আগের পাতা"><ChevronLeft className="h-4 w-4" /></button>
            <span className="num min-w-[60px] text-center">{bn(safePage)} / {bn(pageCount)}</span>
            <button type="button" disabled={safePage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-line-strong text-ink-2 transition-colors hover:bg-sunken disabled:opacity-40" aria-label="পরের পাতা"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
