"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Aurora } from "@/components/shell/aurora";
import { ThemeSync } from "@/components/shell/theme";
import { LogoMark } from "@/components/shell/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { useAuth } from "@/store/auth";
import { useHydrated } from "@/store/ui";
import { bn } from "@/lib/bn";
import { cn } from "@/lib/utils";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const user = useAuth((s) => s.user);
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState("admin@kaliakair.gov.bd");
  const [password, setPassword] = useState("admin123");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totp, setTotp] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const next = params.get("next") || "/admin";
  const reason = params.get("reason");

  useEffect(() => {
    if (hydrated && user) router.replace(next);
  }, [hydrated, user, router, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Super Admin: optional TOTP step (demo accepts 123456)
      if (!totp && email.trim().toLowerCase() === "super@kaliakair.gov.bd") {
        await new Promise((r) => setTimeout(r, 600));
        setTotp(email);
        setLoading(false);
        return;
      }
      if (totp && code !== "123456") throw new Error("যাচাই কোড সঠিক নয়");
      await login(email, password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "প্রবেশ করা যায়নি");
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-[440px]">
        <div className="glass-strong hairline card page-enter p-8 md:p-9">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 rounded-full p-1.5 glow-copper">
              <LogoMark size={64} />
            </div>
            <h1 className="text-[22px] font-bold text-ink">কালিয়াকৈর পৌরসভা</h1>
            <div className="mt-0.5 text-[14px] font-medium text-copper-deep dark:text-copper">নাগরিক রেশন সেবা · প্রশাসন পোর্টাল</div>
          </div>

          {reason === "timeout" && !error && <div className="mb-4 rounded-xl bg-ochre-soft px-3.5 py-2.5 text-[13px] text-ochre">নিষ্ক্রিয়তার কারণে সেশন শেষ হয়েছে। আবার প্রবেশ করুন।</div>}

          <form onSubmit={submit} className="flex flex-col gap-4" aria-busy={loading}>
            {!totp ? (
              <>
                <Field label="ইমেইল">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-4" strokeWidth={1.8} />
                    <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10.5" required />
                  </div>
                </Field>
                <Field label="পাসওয়ার্ড">
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-4" strokeWidth={1.8} />
                    <Input type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10.5 pr-11" required />
                    <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-3 hover:bg-sunken hover:text-ink" aria-label={show ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}>
                      {show ? <EyeOff className="h-4.5 w-4.5" strokeWidth={1.8} /> : <Eye className="h-4.5 w-4.5" strokeWidth={1.8} />}
                    </button>
                  </div>
                </Field>
                <div className="-mt-1 flex justify-end">
                  <button type="button" className="text-[13px] font-medium text-copper-deep hover:underline dark:text-copper" onClick={() => setError("পাসওয়ার্ড পুনরুদ্ধারের জন্য সুপার অ্যাডমিনের সাথে যোগাযোগ করুন")}>
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 rounded-xl bg-petrol-soft px-3.5 py-3 text-[13.5px] text-petrol">
                  <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" strokeWidth={1.8} />
                  <span>সুপার অ্যাডমিনের জন্য দ্বিতীয় ধাপ: অথেন্টিকেটর অ্যাপের ৬ ডিজিটের কোড দিন। (ডেমো কোড: {bn("123456")})</span>
                </div>
                <Field label="যাচাই কোড">
                  <Input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="num text-center text-[20px] tracking-[0.4em]" autoFocus />
                </Field>
                <button type="button" onClick={() => setTotp(null)} className="self-start text-[13px] text-ink-3 hover:text-ink">
                  ← অন্য অ্যাকাউন্টে প্রবেশ
                </button>
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-xl bg-brick-soft px-3.5 py-2.5 text-[13px] font-medium text-brick">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
              {loading ? "যাচাই হচ্ছে…" : totp ? "যাচাই করুন" : "প্রবেশ করুন"}
            </Button>
          </form>

          <div className={cn("mt-6 rounded-2xl border border-dashed border-line-strong p-3.5 text-[12.5px] leading-relaxed text-ink-3")}>
            <div className="mb-1 font-semibold text-ink-2">ডেমো অ্যাকাউন্ট (পাসওয়ার্ড: admin123)</div>
            <div className="num grid grid-cols-1 gap-0.5 sm:grid-cols-2">
              <span>super@kaliakair.gov.bd</span>
              <span>admin@kaliakair.gov.bd</span>
              <span>officer@kaliakair.gov.bd</span>
              <span>viewer@kaliakair.gov.bd</span>
            </div>
          </div>
        </div>
        <p className="mt-5 text-center text-[12px] text-ink-3">© {bn(new Date().getFullYear())} কালিয়াকৈর পৌরসভা, গাজীপুর · নমুনা ডেটা</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Aurora />
      <ThemeSync />
      <Suspense>
        <LoginInner />
      </Suspense>
    </>
  );
}
