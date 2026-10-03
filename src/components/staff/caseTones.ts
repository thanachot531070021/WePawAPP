/**
 * สีสถานะเคส — คู่กับ OPS_CASE_STATUS (ops-types.ts) ของบอร์ดคลินิก
 * และ STATUS ใน components/vet/VetTodayMobile.tsx ของหมอบนเว็บ
 */
export interface CaseTone {
  label: string;
  dot: string;
}

/** บอร์ดคลินิก: awaiting = จองเวลาไว้ ยังไม่มา · waiting = มาถึงแล้วรอเรียก */
export const CLINIC_CASE_TONE: Record<string, CaseTone> = {
  awaiting: { label: "รอสัตว์มาถึง", dot: "#8b5cf6" },
  waiting: { label: "รอเรียก", dot: "#d97706" },
  examining: { label: "กำลังตรวจ", dot: "#059669" },
  done: { label: "เสร็จสิ้น", dot: "#78716c" },
};

/** วันนี้ของหมอ: confirmed = สัตว์มาถึงแล้ว พร้อมตรวจ */
export const VET_CASE_TONE: Record<string, CaseTone> = {
  awaiting: { label: "รอสัตว์มาถึง", dot: "#8b5cf6" },
  waiting: { label: "รอ", dot: "#d97706" },
  confirmed: { label: "มาถึงแล้ว", dot: "#0284c7" },
  examining: { label: "กำลังตรวจ", dot: "#059669" },
  done: { label: "เสร็จ", dot: "#a8a29e" },
};

/** สีอ่อนของ dot สำหรับพื้นป้าย (light) / โปร่ง (dark) */
export function toneBg(dot: string, isDark: boolean): string {
  return isDark ? `${dot}26` : `${dot}1a`;
}
