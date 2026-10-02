import {
  Sarabun_400Regular,
  Sarabun_500Medium,
  Sarabun_600SemiBold,
  Sarabun_700Bold,
} from "@expo-google-fonts/sarabun";

/** ฟอนต์เดียวกับเว็บ (Sarabun) — ฝังในแอป ไม่ต้องโหลดจากเน็ต */
export const fontAssets = {
  Sarabun_400Regular,
  Sarabun_500Medium,
  Sarabun_600SemiBold,
  Sarabun_700Bold,
};

/** RN สังเคราะห์ตัวหนาจากฟอนต์ custom ไม่ได้ ต้องเลือก family ตามน้ำหนัก */
export const font = {
  regular: "Sarabun_400Regular",
  medium: "Sarabun_500Medium",
  semibold: "Sarabun_600SemiBold",
  bold: "Sarabun_700Bold",
} as const;

export type FontWeight = keyof typeof font;
