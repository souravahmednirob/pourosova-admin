"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useData, RuleError, type RegisterInput } from "./data";
import { uid } from "@/lib/utils";

export interface AgentUser {
  id: string;
  name: string;
  email: string;
}

export interface QueuedSubmission {
  localId: string;
  input: RegisterInput;
  createdAt: string;
  /** last sync problem shown to the agent, in plain words */
  error?: string;
}

interface AgentState {
  agent: AgentUser | null;
  queue: QueuedSubmission[];
  login: (email: string, password: string) => Promise<AgentUser>;
  logout: () => void;
  /** Submit now when online, otherwise keep it on the phone. Returns the application number or null when queued. */
  submit: (input: RegisterInput) => { applicationNo: string | null; localId: string };
  sync: () => { sent: number; failed: number };
}

export const useAgent = create<AgentState>()(
  persist(
    (set, get) => ({
      agent: null,
      queue: [],
      login: async (email, password) => {
        await new Promise((r) => setTimeout(r, 800));
        const u = useData.getState().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!u || u.password !== password) throw new Error("ইমেইল বা পাসওয়ার্ড সঠিক নয়");
        if (u.role !== "FIELD_AGENT") throw new Error("এটি ফিল্ড এজেন্টের অ্যাকাউন্ট নয়");
        if (!u.active) throw new Error("এই অ্যাকাউন্ট বন্ধ আছে");
        const agent = { id: u.id, name: u.name, email: u.email };
        set({ agent });
        return agent;
      },
      logout: () => set({ agent: null }),
      submit: (input) => {
        const agent = get().agent;
        if (!agent) throw new RuleError("আবার প্রবেশ করুন");
        const localId = uid("q_");
        const online = typeof navigator === "undefined" ? true : navigator.onLine;
        if (!online) {
          // basic duplicate check against what is already on the phone
          if (get().queue.some((q) => q.input.nationalId === input.nationalId)) throw new RuleError("এই পরিচয়পত্র নম্বর দিয়ে একটি নিবন্ধন ফোনে জমা আছে");
          set({ queue: [...get().queue, { localId, input, createdAt: new Date().toISOString() }] });
          return { applicationNo: null, localId };
        }
        const c = useData.getState().registerCitizen(input, { id: agent.id, name: agent.name }, false);
        return { applicationNo: c.applicationNo ?? null, localId };
      },
      sync: () => {
        const agent = get().agent;
        if (!agent || !navigator.onLine) return { sent: 0, failed: 0 };
        let sent = 0, failed = 0;
        const left: QueuedSubmission[] = [];
        for (const q of get().queue) {
          try {
            useData.getState().registerCitizen(q.input, { id: agent.id, name: agent.name }, false);
            sent += 1;
          } catch (e) {
            failed += 1;
            left.push({ ...q, error: e instanceof RuleError ? e.message : "পাঠানো যায়নি" });
          }
        }
        set({ queue: left });
        return { sent, failed };
      },
    }),
    { name: "kp-ration-agent", storage: createJSONStorage(() => localStorage) },
  ),
);
