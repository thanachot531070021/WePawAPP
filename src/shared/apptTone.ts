/**
 * สีสถานะนัด — พอร์ตจาก APPT_TONE ใน petcare/components/account/MobileAccountView.tsx
 *
 * หนึ่งสถานะ = หนึ่งสี + หนึ่งไอคอน และสีต้องโผล่ซ้ำในการ์ดใบเดียว 3 จุด
 * (แถบสีข้าง · บล็อกวันที่ · ป้ายสถานะ) — แก้ฝั่งเว็บต้องแก้ไฟล์นี้คู่กัน
 */
import {
  AlertTriangle,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  Clock,
  Hourglass,
  Stethoscope,
  X,
  type LucideIcon,
} from "lucide-react-native";

export type AppointmentStatus =
  | "requested"
  | "proposed"
  | "accepted"
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface ApptTone {
  label: string;
  solid: string;
  ink: string;
  tint: string;
  tint2: string;
  edge: string;
  darkInk: string;
  Icon: LucideIcon;
  dash?: boolean;
}

export const APPT_TONE: Record<AppointmentStatus, ApptTone> = {
  requested: {
    label: "รอคลินิกรับคำขอ",
    solid: "#7c3aed",
    ink: "#6d28d9",
    tint: "#f5f3ff",
    tint2: "#ede9fe",
    edge: "#ddd6fe",
    darkInk: "#c4b5fd",
    Icon: Hourglass,
  },
  proposed: {
    label: "รอคุณยืนยันเวลา",
    solid: "#0284c7",
    ink: "#0369a1",
    tint: "#f0f9ff",
    tint2: "#e0f2fe",
    edge: "#bae6fd",
    darkInk: "#7dd3fc",
    Icon: CalendarClock,
  },
  accepted: {
    label: "พาน้องมาส่งได้เลย",
    solid: "#0d9488",
    ink: "#0f766e",
    tint: "#f0fdfa",
    tint2: "#ccfbf1",
    edge: "#99f6e4",
    darkInk: "#5eead4",
    Icon: CheckCircle2,
  },
  pending: {
    label: "รอยืนยัน",
    solid: "#d97706",
    ink: "#b45309",
    tint: "#fffbeb",
    tint2: "#fef3c7",
    edge: "#fde68a",
    darkInk: "#fcd34d",
    Icon: Clock,
  },
  confirmed: {
    label: "ยืนยันแล้ว",
    solid: "#059669",
    ink: "#047857",
    tint: "#ecfdf5",
    tint2: "#d1fae5",
    edge: "#a7f3d0",
    darkInk: "#6ee7b7",
    Icon: CheckCircle2,
  },
  in_progress: {
    label: "กำลังตรวจ",
    solid: "#2563eb",
    ink: "#1d4ed8",
    tint: "#eff6ff",
    tint2: "#dbeafe",
    edge: "#bfdbfe",
    darkInk: "#93c5fd",
    Icon: Stethoscope,
  },
  completed: {
    label: "เสร็จสิ้น",
    solid: "#78716c",
    ink: "#57534e",
    tint: "#fafaf9",
    tint2: "#f5f5f4",
    edge: "#e7e5e4",
    darkInk: "#a8a29e",
    Icon: CheckCheck,
  },
  cancelled: {
    label: "ยกเลิกแล้ว",
    solid: "#e11d48",
    ink: "#be123c",
    tint: "#fff1f2",
    tint2: "#ffe4e6",
    edge: "#fecdd3",
    darkInk: "#fda4af",
    Icon: X,
  },
  no_show: {
    label: "ไม่มาตามนัด",
    solid: "#9f1239",
    ink: "#9f1239",
    tint: "#fff1f2",
    tint2: "#ffe4e6",
    edge: "#fecdd3",
    darkInk: "#fda4af",
    Icon: AlertTriangle,
    dash: true,
  },
};

export function toneOf(status: string): ApptTone {
  return APPT_TONE[status as AppointmentStatus] ?? APPT_TONE.completed;
}

/** สีของ tone ตามธีม — โหมดมืดใช้ solid โปร่ง ๆ เป็นพื้น + เฉด 300 เป็นตัวอักษร (เหมือน toneVars ของเว็บ) */
export function toneColors(t: ApptTone, isDark: boolean) {
  return isDark
    ? { ink: t.darkInk, tint: `${t.solid}26`, tint2: `${t.solid}26`, edge: `${t.solid}59`, solid: t.solid }
    : { ink: t.ink, tint: t.tint, tint2: t.tint2, edge: t.edge, solid: t.solid };
}

/** คำขอที่คลินิกยังไม่ได้จัดเวลา — scheduled_at เป็นแค่ placeholder ต้องอ่าน preferred_date แทน */
export const REQUEST_STATUSES: AppointmentStatus[] = ["requested", "proposed", "accepted"];

export const PERIOD_LABEL: Record<string, string> = {
  morning: "ช่วงเช้า",
  afternoon: "ช่วงบ่าย",
  evening: "ช่วงเย็น",
  any: "สะดวกได้ทั้งวัน",
};
