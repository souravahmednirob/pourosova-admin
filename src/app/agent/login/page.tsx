"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AgentFrame, AgentHeader, bigInput } from "@/components/agent/agent-frame";
import { Button } from "@/components/ui/button";
import { useAgent } from "@/store/agent";

export default function AgentLogin() {
  const router = useRouter();
  const agent = useAgent((s) => s.agent);
  const login = useAgent((s) => s.login);
  const [email, setEmail] = useState("agent1@kaliakair.gov.bd");
  const [password, setPassword] = useState("agent123");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agent) router.replace("/agent");
  }, [agent, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/agent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "প্রবেশ করা যায়নি");
      setLoading(false);
    }
  };

  return (
    <AgentFrame requireAuth={false}>
      <AgentHeader eyebrow="ফিল্ড এজেন্ট" title="স্বাগতম" subtitle="নাগরিক নিবন্ধন করতে প্রবেশ করুন" />
      <form onSubmit={submit} className="flex flex-1 flex-col gap-4 px-5 py-6">
        <label className="flex flex-col gap-1.5 text-[14px] font-semibold text-ink-2">
          ইমেইল
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={bigInput} required />
        </label>
        <label className="flex flex-col gap-1.5 text-[14px] font-semibold text-ink-2">
          পাসওয়ার্ড
          <div className="relative">
            <input type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${bigInput} pr-14`} required />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"} className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-ink-3 hover:bg-sunken">
              {show ? <EyeOff className="h-5 w-5" strokeWidth={1.8} /> : <Eye className="h-5 w-5" strokeWidth={1.8} />}
            </button>
          </div>
        </label>
        {error && <div role="alert" className="rounded-xl bg-brick-soft px-4 py-3 text-[14px] font-medium text-brick">{error}</div>}
        <Button type="submit" size="lg" loading={loading} className="mt-2 h-[54px] rounded-[14px] text-[16px]">{loading ? "যাচাই হচ্ছে…" : "প্রবেশ করুন"}</Button>
        <div className="mt-auto rounded-2xl border border-dashed border-line-strong p-3.5 text-[12.5px] text-ink-3">
          <div className="font-semibold text-ink-2">ডেমো (পাসওয়ার্ড agent123)</div>
          <div className="num">agent1@ · agent2@ · agent3@kaliakair.gov.bd</div>
        </div>
      </form>
    </AgentFrame>
  );
}
