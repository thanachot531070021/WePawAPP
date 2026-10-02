import type { Href } from "expo-router";

/**
 * แปลง path ของเว็บ petcare → หน้าในแอป
 * ใช้กับ action_url ของแจ้งเตือน (push + in-app) และลิงก์ที่เปิดเข้าแอป (universal link / wepaw://)
 * path ที่แอปไม่มี คืน null → ผู้เรียกตัดสินใจเอง (เช่นเปิดหน้าแจ้งเตือน)
 */
export function webPathToApp(raw: string | null | undefined): Href | null {
  if (!raw) return null;
  let path = raw;
  let search = "";
  try {
    const u = new URL(raw, "https://placeholder.local");
    path = u.pathname;
    search = u.search;
  } catch {
    // ใช้ raw ต่อ
  }
  path = path.replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(search);
  let m: RegExpMatchArray | null;

  if ((m = path.match(/^\/account\/pets\/([^/]+)(\/edit)?$/))) return `/pets/${m[1]}` as Href;
  if (path === "/account/pets") return "/pets" as Href;
  if (path === "/account/appointments") return "/appointments" as Href;
  if ((m = path.match(/^\/account\/messages\/([^/]+)$/))) return `/chat/${m[1]}` as Href;
  if (path === "/account/messages") return "/chat" as Href;
  if ((m = path.match(/^\/account\/reviews\/([^/]+)$/))) return `/review-request/${m[1]}` as Href;
  if (path === "/account/notifications") return "/notifications" as Href;
  if (path === "/account/favorites") return "/favorites" as Href;
  if (path === "/account") return "/me" as Href;
  if ((m = path.match(/^\/clinic\/([^/]+)\/review$/))) return `/clinic/${m[1]}/review` as Href;
  if ((m = path.match(/^\/clinic\/([^/]+)$/))) return `/clinic/${m[1]}` as Href;
  if ((m = path.match(/^\/pets\/share\/([^/]+)$/))) return `/share/${m[1]}` as Href;
  if ((m = path.match(/^\/claim\/([^/]+)$/))) return `/claim/${m[1]}` as Href;
  if (path === "/community") {
    const q = params.get("q");
    return (q ? `/community/${q}` : "/community") as Href;
  }
  if (path === "/search" || path === "/home" || path === "/") return "/" as Href;
  return null;
}
