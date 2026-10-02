import { webPathToApp } from "@/lib/links";

/**
 * ลิงก์ที่เปิดเข้าแอปจากภายนอก (https://<โดเมนเว็บ>/pets/share/... หรือ wepaw://...)
 * ใช้ path ของเว็บ → แปลงเป็นหน้าในแอปด้วยกติกาเดียวกับแจ้งเตือน
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const target = webPathToApp(path.replace(/^wepaw:\/\//, "/"));
    return typeof target === "string" ? target : path;
  } catch {
    return "/";
  }
}
