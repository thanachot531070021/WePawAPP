import { create } from "zustand";
import { storage } from "@/lib/storage";

export type ThemePref = "system" | "light" | "dark";

interface PrefsState {
  theme: ThemePref;
  setTheme: (t: ThemePref) => void;
  hydrate: () => Promise<void>;
}

const KEY = "wepaw.theme";

/** ค่าที่ผู้ใช้เลือกเองในเครื่อง (โหมดมืด) — เหมือนปุ่มธีมในแท็บโปรไฟล์ของเว็บ */
export const usePrefs = create<PrefsState>((set) => ({
  theme: "system",
  setTheme: (theme) => {
    set({ theme });
    void storage.set(KEY, theme);
  },
  hydrate: async () => {
    const v = await storage.get(KEY);
    if (v === "light" || v === "dark" || v === "system") set({ theme: v });
  },
}));
