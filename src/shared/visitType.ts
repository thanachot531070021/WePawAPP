/**
 * ประเภทการตรวจ — คู่กับ petcare/lib/utils.ts (ALL_VISIT_TYPES, VISIT_TYPE_LABEL)
 * และค่าเริ่มต้นจากชื่อบริการ คู่กับ petcare/lib/medical/visitType.ts (visitTypeFromService)
 */
export const ALL_VISIT_TYPES = ["vaccination", "checkup", "illness", "surgery", "dental", "grooming", "other"] as const;
export type VisitType = (typeof ALL_VISIT_TYPES)[number];

export const VISIT_TYPE_LABEL: Record<string, string> = {
  vaccination: "ฉีดวัคซีน",
  checkup: "ตรวจสุขภาพ",
  illness: "เจ็บป่วย",
  surgery: "ผ่าตัด",
  dental: "ทันตกรรม",
  grooming: "อาบน้ำ/ตัดขน",
  other: "อื่นๆ",
};

const LABEL_RULES: { re: RegExp; type: VisitType }[] = [
  { re: /วัคซีน|เข็ม|vaccin/i, type: "vaccination" },
  { re: /อาบน้ำ|ตัดขน|ไถขน|ตัดเล็บ|สปา|กรูม|groom|bath|spa/i, type: "grooming" },
  { re: /ผ่าตัด|ทำหมัน|surger|spay|neuter/i, type: "surgery" },
  { re: /ฟัน|หินปูน|ทันตกรรม|dental|scaling/i, type: "dental" },
  { re: /ตรวจสุขภาพ|เช็คสุขภาพ|health\s*check|check\s*up|checkup/i, type: "checkup" },
  { re: /ป่วย|อาการ|ฉุกเฉิน|รักษา|illness|emergency/i, type: "illness" },
];

export function visitTypeFromService(serviceLabel?: string | null): VisitType {
  const label = serviceLabel?.trim();
  if (label) for (const r of LABEL_RULES) if (r.re.test(label)) return r.type;
  return "other";
}
