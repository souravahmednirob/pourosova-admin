"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, PackagePlus } from "lucide-react";
import { Drawer } from "@/components/shell/drawer";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Pill } from "@/components/ui/primitives";
import { useData, RuleError } from "@/store/data";
import { useAuth, can } from "@/store/auth";
import { CATEGORY_LABEL, UNIT_LABEL, type Product, type ProductCategory, type Unit } from "@/lib/types";
import { bn, en, taka, pct, fmtDateTime } from "@/lib/bn";
import { savingPct } from "@/lib/orders";

type Form = { name: string; category: ProductCategory; unit: Unit; marketPrice: string; municipalPrice: string; stock: string; capacity: string; perFamilyLimit: string };
const blank: Form = { name: "", category: "GROCERY", unit: "KG", marketPrice: "", municipalPrice: "", stock: "0", capacity: "1000", perFamilyLimit: "1" };

function NumInput({ value, onChange, ...rest }: { value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return <Input inputMode="numeric" className="num" value={bn(value)} onChange={(e) => onChange(en(e.target.value).replace(/[^\d]/g, ""))} {...rest} />;
}

export function ProductDrawer({ open, productId, onClose }: { open: boolean; productId?: string; onClose: () => void }) {
  const user = useAuth((s) => s.user);
  const product = useData((s) => s.products.find((p) => p.id === productId));
  const movements = useData((s) => s.movements);
  const upsert = useData((s) => s.upsertProduct);
  const addStock = useData((s) => s.addStock);
  const [f, setF] = useState<Form>(blank);
  const [busy, setBusy] = useState(false);
  const canEdit = can(user?.role, "product.edit");
  const canPrice = can(user?.role, "product.price");

  useEffect(() => {
    if (!open) return;
    const p = productId ? useData.getState().products.find((x) => x.id === productId) : undefined;
    queueMicrotask(() =>
      setF(p ? { name: p.name, category: p.category, unit: p.unit, marketPrice: String(p.marketPrice), municipalPrice: String(p.municipalPrice), stock: String(p.stock), capacity: String(p.capacity), perFamilyLimit: String(p.perFamilyLimit) } : blank),
    );
  }, [open, productId]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));
  const mp = Number(f.marketPrice || 0), up = Number(f.municipalPrice || 0);
  const priceBad = mp > 0 && up >= mp;

  const save = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const p = upsert({ id: productId, name: f.name.trim(), category: f.category, unit: f.unit, marketPrice: mp, municipalPrice: up, stock: Number(f.stock || 0), capacity: Number(f.capacity || 0), perFamilyLimit: Number(f.perFamilyLimit || 1) }, { id: user.id, name: user.name });
      toast.success(productId ? `${p.name} আপডেট হয়েছে` : `${p.name} যুক্ত হয়েছে`);
      onClose();
    } catch (e) {
      toast.error(e instanceof RuleError ? e.message : "সংরক্ষণ করা যায়নি");
    } finally {
      setBusy(false);
    }
  };

  const quick = (n: number) => {
    if (!productId || !user) return;
    try {
      const p = addStock(productId, n, { id: user.id, name: user.name });
      set("stock", String(p.stock));
      toast.success(`${p.name}: +${bn(n)} ${UNIT_LABEL[p.unit]} যোগ হয়েছে`);
    } catch (e) {
      toast.error(e instanceof RuleError ? e.message : "করা যায়নি");
    }
  };

  const recent = productId ? movements.filter((m) => m.productId === productId).slice(-6).reverse() : [];
  const MOVE: Record<string, string> = { RESERVE: "সংরক্ষিত", RELEASE: "ছাড়", SALE: "বিক্রয়", ADJUST: "সমন্বয়", RESTOCK: "মজুত যোগ" };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={productId ? (canEdit ? "পণ্য সম্পাদনা" : "পণ্যের বিবরণ") : "নতুন পণ্য"}
      footer={
        canEdit && (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>বাতিল</Button>
            <Button onClick={save} loading={busy} disabled={!f.name.trim() || priceBad || !mp || !up}><Save className="h-4 w-4" strokeWidth={1.8} /> সংরক্ষণ</Button>
          </div>
        )
      }
    >
      <fieldset disabled={!canEdit} className="flex flex-col gap-5 disabled:opacity-90">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="পণ্যের নাম" required className="sm:col-span-2"><Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="যেমন: মসুর ডাল" /></Field>
          <Field label="ক্যাটাগরি">
            <NativeSelect value={f.category} onChange={(e) => set("category", e.target.value as ProductCategory)}>
              {(Object.keys(CATEGORY_LABEL) as ProductCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </NativeSelect>
          </Field>
          <Field label="একক">
            <NativeSelect value={f.unit} onChange={(e) => set("unit", e.target.value as Unit)}>
              {(Object.keys(UNIT_LABEL) as Unit[]).map((u) => <option key={u} value={u}>{UNIT_LABEL[u]}</option>)}
            </NativeSelect>
          </Field>
        </div>

        <div>
          <div className="label-caps mb-2">দাম</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="বাজার দাম (৳)" required><NumInput value={f.marketPrice} onChange={(v) => set("marketPrice", v)} disabled={!canPrice} /></Field>
            <Field label="পৌরসভার দাম (৳)" required error={priceBad ? "বাজার দামের চেয়ে কম হতে হবে" : undefined}><NumInput value={f.municipalPrice} onChange={(v) => set("municipalPrice", v)} disabled={!canPrice} /></Field>
          </div>
          {mp > 0 && up > 0 && !priceBad && (
            <div className="mt-2 flex items-center gap-2 text-[13px] text-ink-3">
              নাগরিকের সাশ্রয় <Pill tone="sage">{taka(mp - up)} · {pct(savingPct({ marketPrice: mp, municipalPrice: up }))}</Pill> প্রতি {UNIT_LABEL[f.unit]}
            </div>
          )}
        </div>

        <div>
          <div className="label-caps mb-2">মজুত</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="বর্তমান মজুত"><NumInput value={f.stock} onChange={(v) => set("stock", v)} /></Field>
            <Field label="মোট ধারণক্ষমতা"><NumInput value={f.capacity} onChange={(v) => set("capacity", v)} /></Field>
          </div>
          {productId && canEdit && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-ink-3">দ্রুত যোগ:</span>
              {[50, 100, 500].map((n) => (
                <Button key={n} type="button" variant="secondary" size="sm" onClick={() => quick(n)}><PackagePlus className="h-3.5 w-3.5" strokeWidth={1.8} /> +{bn(n)}</Button>
              ))}
            </div>
          )}
        </div>

        <Field label="পরিবারপ্রতি মাসিক সীমা" hint={`প্রতি পরিবার মাসে সর্বোচ্চ কত ${UNIT_LABEL[f.unit]} নিতে পারবে`}><NumInput value={f.perFamilyLimit} onChange={(v) => set("perFamilyLimit", v)} /></Field>
      </fieldset>

      {product && recent.length > 0 && (
        <div className="mt-6">
          <div className="label-caps mb-2">সাম্প্রতিক মজুত পরিবর্তন</div>
          <ul className="divide-y divide-line">
            {recent.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2 text-[13px]">
                <span className="text-ink-2">{MOVE[m.type]}{m.orderId ? " · অর্ডার" : ""}</span>
                <span className="flex items-center gap-3">
                  <span className={`num font-semibold ${m.type === "RESTOCK" || m.type === "RELEASE" || (m.type === "ADJUST" && m.quantity > 0) ? "text-sage" : "text-brick"}`}>{m.type === "RESTOCK" || m.type === "RELEASE" ? "+" : m.type === "ADJUST" ? (m.quantity > 0 ? "+" : "") : "−"}{bn(Math.abs(m.quantity))}</span>
                  <span className="text-[12px] text-ink-3">{fmtDateTime(m.at)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!canEdit && <p className="mt-4 text-[12.5px] text-ink-3">আপনার অ্যাকাউন্টে পণ্য সম্পাদনার অনুমতি নেই।</p>}
    </Drawer>
  );
}

export type { Product };
