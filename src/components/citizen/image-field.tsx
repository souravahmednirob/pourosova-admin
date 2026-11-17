"use client";
import { useRef, useState } from "react";
import { Camera, ImagePlus, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Downscale an image file to a small JPEG data URL (keeps localStorage light). */
export async function fileToDataUrl(file: File, maxW = 720, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export function ImageField({ label, hint, value, onChange, aspect = "card", capture, compact }: { label: string; hint?: string; value?: string; onChange: (v: string | undefined) => void; aspect?: "card" | "portrait"; capture?: "user" | "environment"; compact?: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const handle = async (f?: File | null) => {
    if (!f) return;
    setBusy(true);
    try {
      onChange(await fileToDataUrl(f, aspect === "portrait" ? 480 : 900));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-[13px] font-semibold text-ink-2">{label}</span>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]); }}
        className={cn("relative overflow-hidden rounded-[16px] border transition-colors", aspect === "portrait" ? "aspect-[3/4]" : "aspect-[1.586]", value ? "border-line-strong" : "border-dashed", drag ? "border-copper bg-copper-soft/40" : !value && "border-line-strong bg-sunken")}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label || "ছবি"} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/55 to-transparent p-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-ink hover:bg-white" aria-label="আবার দিন"><RefreshCw className="h-4 w-4" strokeWidth={1.8} /></button>
              <button type="button" onClick={() => onChange(undefined)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-brick hover:bg-white" aria-label="সরান"><X className="h-4 w-4" strokeWidth={1.8} /></button>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
            {busy ? (
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-line-strong border-t-copper" />
            ) : (
              <>
                <div className={cn("flex gap-2", compact && "flex-col")}>
                  <button type="button" onClick={() => camRef.current?.click()} aria-label="ক্যামেরা দিয়ে তুলুন" className={cn("flex h-10 items-center justify-center gap-1.5 rounded-[12px] border border-line-strong bg-surface-solid text-[13px] font-semibold text-ink hover:border-copper", compact ? "w-11 px-0" : "px-3")}>
                    <Camera className="h-4 w-4" strokeWidth={1.8} /> {!compact && "ক্যামেরা"}
                  </button>
                  <button type="button" onClick={() => fileRef.current?.click()} aria-label="ফাইল থেকে দিন" className={cn("flex h-10 items-center justify-center gap-1.5 rounded-[12px] border border-line-strong bg-surface-solid text-[13px] font-semibold text-ink hover:border-copper", compact ? "w-11 px-0" : "px-3")}>
                    <ImagePlus className="h-4 w-4" strokeWidth={1.8} /> {!compact && "ফাইল"}
                  </button>
                </div>
                {hint && !compact && <span className="text-[12px] text-ink-3">{hint}</span>}
              </>
            )}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
        <input ref={camRef} type="file" accept="image/*" capture={capture ?? "environment"} className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      </div>
    </div>
  );
}
