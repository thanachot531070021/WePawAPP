/** วันที่/เวลาแบบไทย — แสดงตามโซน Asia/Bangkok เสมอเหมือนเว็บ */

const TZ = "Asia/Bangkok";

const TH_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const TH_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const TH_DAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
export const TH_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

/** แยก ปี/เดือน/วัน/ชั่วโมง ตามเวลาไทย จาก ISO หรือ Date */
function bkkParts(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  // เวลาไทย = UTC+7 ตลอดปี (ไม่มี DST) — คำนวณตรงเพื่อไม่พึ่ง Intl ที่บาง engine ไม่รองรับ timeZone
  const t = new Date(d.getTime() + 7 * 3600_000);
  return {
    y: t.getUTCFullYear(),
    m: t.getUTCMonth(),
    d: t.getUTCDate(),
    dow: t.getUTCDay(),
    hh: t.getUTCHours(),
    mm: t.getUTCMinutes(),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD ตามวันไทย */
export function bkkDateKey(input: string | Date = new Date()): string {
  const p = bkkParts(input);
  return `${p.y}-${pad(p.m + 1)}-${pad(p.d)}`;
}

/** "YYYY-MM-DD" (วันล้วน) → parts โดยไม่เลื่อนโซน */
function dateOnlyParts(dateOnly: string) {
  const [y, m, d] = dateOnly.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m: m - 1, d, dow };
}

export function formatTime(iso: string): string {
  const p = bkkParts(iso);
  return `${pad(p.hh)}:${pad(p.mm)}`;
}

/** 14 มี.ค. 2569 */
export function formatDateShort(input: string, withYear = true): string {
  const p = input.length === 10 ? dateOnlyParts(input) : bkkParts(input);
  return `${p.d} ${TH_MONTHS_SHORT[p.m]}${withYear ? ` ${p.y + 543}` : ""}`;
}

/** อังคาร 14 มีนาคม 2569 */
export function formatDateLong(input: string): string {
  const p = input.length === 10 ? dateOnlyParts(input) : bkkParts(input);
  return `${TH_DAYS[p.dow]} ${p.d} ${TH_MONTHS[p.m]} ${p.y + 543}`;
}

export function dayAndMonth(input: string): { day: string; month: string; dow: string } {
  const p = input.length === 10 ? dateOnlyParts(input) : bkkParts(input);
  return { day: String(p.d), month: TH_MONTHS_SHORT[p.m], dow: TH_DAYS_SHORT[p.dow] };
}

export function monthLabel(year: number, monthIndex: number): string {
  return `${TH_MONTHS[monthIndex]} ${year + 543}`;
}

export { TH_DAYS_SHORT };

/** "5 นาทีที่แล้ว" แบบสั้น */
export function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} วันที่แล้ว`;
  return formatDateShort(iso);
}

export function formatPrice(min: string | number | null, max: string | number | null): string | null {
  const a = min != null ? Number(min) : null;
  const b = max != null ? Number(max) : null;
  const f = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
  if (a != null && b != null && a !== b) return `฿${f(a)}–${f(b)}`;
  if (a != null) return `฿${f(a)}`;
  if (b != null) return `฿${f(b)}`;
  return null;
}

export function formatDistance(meters: number | null | undefined): string | null {
  if (meters == null) return null;
  return meters < 1000 ? `${Math.round(meters)} ม.` : `${(meters / 1000).toFixed(1)} กม.`;
}

export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export { TZ };
