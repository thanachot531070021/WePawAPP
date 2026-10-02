import { useMemo } from "react";
import { useColorScheme } from "react-native";
import { usePrefs } from "@/state/prefs";
import { makeColors, type AppColors, type ColorScheme } from "./tokens";

export * from "./tokens";
export { font } from "./fonts";

/** ธีมที่ใช้จริง: ผู้ใช้เลือกเองก่อน ไม่งั้นตามระบบ (เหมือน ThemeToggle ของเว็บ) */
export function useScheme(): ColorScheme {
  const system = useColorScheme();
  const pref = usePrefs((s) => s.theme);
  if (pref === "light" || pref === "dark") return pref;
  return system === "dark" ? "dark" : "light";
}

export function useColors(): AppColors {
  const scheme = useScheme();
  return useMemo(() => makeColors(scheme), [scheme]);
}
