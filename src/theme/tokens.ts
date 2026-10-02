/**
 * Design tokens — พอร์ตตรงจาก petcare/app/globals.css + palette ของ Tailwind ที่เว็บใช้
 *
 * เว็บ: brand-* (emerald) เป็นสีหลัก, stone-* เป็น neutral, rose เป็น badge/ทำลาย,
 * amber เป็นดาว/ใกล้ครบกำหนด — ถ้าเว็บเปลี่ยนสีใน globals.css ต้องแก้ไฟล์นี้คู่กัน
 */
export const brand = {
  50: "#ecfdf5",
  100: "#d1fae5",
  200: "#a7f3d0",
  300: "#6ee7b7",
  400: "#34d399",
  500: "#10b981",
  600: "#059669",
  700: "#047857",
  800: "#065f46",
  900: "#064e3b",
} as const;

export const stone = {
  50: "#fafaf9",
  100: "#f5f5f4",
  200: "#e7e5e4",
  300: "#d6d3d1",
  400: "#a8a29e",
  500: "#78716c",
  600: "#57534e",
  700: "#44403c",
  800: "#292524",
  900: "#1c1917",
  950: "#0c0a09",
} as const;

export const rose = { 50: "#fff1f2", 100: "#ffe4e6", 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c" } as const;
export const amber = { 50: "#fffbeb", 100: "#fef3c7", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309" } as const;
export const sky = { 50: "#f0f9ff", 100: "#e0f2fe", 300: "#7dd3fc", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1" } as const;
export const violet = { 50: "#f5f3ff", 300: "#c4b5fd", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9" } as const;

/** รัศมีมุม — เว็บใช้ rounded-xl (12) / 2xl (16) / 3xl (24) */
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 } as const;

/** ระยะขอบหน้าจอ mobile ฝั่งเว็บ (px-4) */
export const gutter = 16;

export type ColorScheme = "light" | "dark";

/**
 * สีที่ resolve ตามธีมแล้ว — คู่กับคลาส light / `dark:` ของเว็บ
 * ใช้ผ่าน useColors() เสมอ ไม่อ้าง palette ตรง ๆ ในหน้าจอ
 */
export function makeColors(scheme: ColorScheme) {
  const dark = scheme === "dark";
  return {
    scheme,
    isDark: dark,
    /** พื้นหลังหน้าจอ — bg-stone-50 / dark:bg-stone-950 */
    bg: dark ? stone[950] : stone[50],
    /** การ์ด แถบบน แถบล่าง — bg-white / dark:bg-stone-900 */
    surface: dark ? stone[900] : "#ffffff",
    /** chip, ช่องกรอก — bg-stone-100 / dark:bg-stone-800 */
    surfaceAlt: dark ? stone[800] : stone[100],
    /** เส้นขอบการ์ด — border-stone-200/70 / dark:border-stone-800 */
    border: dark ? stone[800] : "rgba(231,229,228,0.7)",
    borderStrong: dark ? stone[700] : stone[200],
    text: dark ? stone[50] : stone[900],
    textMuted: dark ? stone[400] : stone[500],
    textFaint: dark ? stone[500] : stone[400],
    /** brand ที่อ่านได้ — text-brand-600 / dark:text-brand-400 */
    brand: dark ? brand[400] : brand[600],
    brandSolid: brand[600],
    brandPressed: brand[700],
    brandSoft: dark ? "rgba(16,185,129,0.15)" : brand[50],
    brandSoftText: dark ? brand[300] : brand[700],
    onBrand: "#ffffff",
    danger: dark ? rose[400] : rose[600],
    dangerSolid: rose[500],
    dangerSoft: dark ? "rgba(244,63,94,0.15)" : rose[50],
    warn: dark ? amber[400] : amber[600],
    warnText: dark ? amber[300] : amber[700],
    warnSoft: dark ? "rgba(245,158,11,0.15)" : amber[50],
    info: dark ? sky[300] : sky[700],
    infoSoft: dark ? "rgba(14,165,233,0.15)" : sky[50],
    star: amber[500],
    overlay: "rgba(12,10,9,0.45)",
    /** shadow-card ของเว็บ: 0 1px 2px rgba(16,24,40,.06), 0 6px 18px rgba(16,24,40,.08) */
    shadow: dark ? "#000000" : "rgb(16,24,40)",
  };
}

export type AppColors = ReturnType<typeof makeColors>;
