/**
 * "What does this pet need next?" — one meaningful, do-this-next line derived
 * from vaccine + visit history. Shared by the mobile pet list layouts and the
 * account overlay so both read the same state from the same rules.
 */

export type PetStatus =
  | { kind: "overdue"; text: string; note: string }
  | { kind: "due"; text: string }
  | { kind: "ok"; text: string }
  | { kind: "none" };

/** The subset of a pet row the rules actually read. */
export interface PetStatusInput {
  next_vaccine_due_at: string | null;
  next_vaccine_name: string | null;
  vaccine_count: string;
  last_visit_at: string | null;
}

export function daysUntil(dateOnly: string): number {
  const target = new Date(`${dateOnly}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / 86_400_000);
}

export function formatDayMonth(dateOnly: string): string {
  const d = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Bangkok",
  });
}

export function overdueSpan(days: number): string {
  if (days >= 60) return `${Math.round(days / 30)} เดือน`;
  if (days >= 14) return `${Math.round(days / 7)} สัปดาห์`;
  return `${days} วัน`;
}

export function derivePetStatus(pet: PetStatusInput): PetStatus {
  const vaccineName = pet.next_vaccine_name ?? "วัคซีน";
  if (pet.next_vaccine_due_at) {
    const d = daysUntil(pet.next_vaccine_due_at);
    if (d < 0) {
      return {
        kind: "overdue",
        text: `เลยกำหนด${vaccineName}มา ${overdueSpan(-d)}`,
        note: "ไม่เป็นไรเลย เริ่มใหม่วันนี้ได้",
      };
    }
    if (d <= 30) {
      return {
        kind: "due",
        text:
          d === 0
            ? `${vaccineName}ถึงกำหนดวันนี้`
            : `${vaccineName}ถึงกำหนดใน ${d} วัน`,
      };
    }
  }
  if (Number(pet.vaccine_count) > 0) {
    const checked = pet.last_visit_at
      ? ` · ตรวจล่าสุด ${formatDayMonth(pet.last_visit_at)}`
      : "";
    return { kind: "ok", text: `วัคซีนครบ${checked}` };
  }
  return { kind: "none" };
}

/** Days to the next anniversary of the birth date (0 = today, null = unknown). */
export function daysToBirthday(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next.setFullYear(next.getFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}
