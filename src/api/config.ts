import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * URL ของ petcare backend
 * - ตั้งด้วย EXPO_PUBLIC_API_URL (eas.json ต่อ profile / .env ตอน dev)
 * - ไม่ตั้ง: Android emulator ใช้ 10.0.2.2 (= localhost ของเครื่อง dev), ที่เหลือใช้ localhost
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (fromExtra) return fromExtra.replace(/\/$/, "");
  return Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
}

export const API_BASE_URL = resolveBaseUrl();

/** ลิงก์ของเว็บ petcare (ใช้เปิดหน้าที่แอปยังไม่มี เช่น ลิงก์ claim) */
export const WEB_BASE_URL =
  (process.env.EXPO_PUBLIC_WEB_URL ?? "").replace(/\/$/, "") || API_BASE_URL;

/** path ของไฟล์บน storage อาจเป็น /uploads/... (fallback local) → ต่อเป็น URL เต็ม */
export function absoluteUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}
