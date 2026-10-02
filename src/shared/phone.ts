// เบอร์โทรไทย — จัดรูปแบบระหว่างพิมพ์ + ตรวจความถูกต้อง
// มือถือ 10 หลัก (06/08/09) → 080-502-1231
// เบอร์บ้าน 9 หลัก: กรุงเทพฯ 02 → 02-123-4567, ต่างจังหวัด 03x-07x → 053-123-456

/** เหลือแต่ตัวเลข แปลง +66 / 66 นำหน้าเป็น 0 และตัดเกิน 10 หลัก */
export function phoneDigits(raw: string | null | undefined): string {
  let d = (raw ?? "").replace(/\D/g, "");
  if (d.startsWith("66")) d = `0${d.slice(2)}`;
  return d.slice(0, 10);
}

export function formatThaiPhone(raw: string | null | undefined): string {
  const d = phoneDigits(raw);
  if (d.startsWith("02")) {
    const b = d.slice(0, 9);
    return [b.slice(0, 2), b.slice(2, 5), b.slice(5)].filter(Boolean).join("-");
  }
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6)].filter(Boolean).join("-");
}

export function isValidThaiPhone(raw: string | null | undefined): boolean {
  const d = phoneDigits(raw);
  return /^0[689]\d{8}$/.test(d) || /^0[2-7]\d{7}$/.test(d);
}

/** ข้อความ error สำหรับฟอร์ม — null = ผ่าน */
export function thaiPhoneError(raw: string | null | undefined, opts: { required?: boolean; label?: string } = {}): string | null {
  const label = opts.label ?? "เบอร์โทร";
  if (!phoneDigits(raw)) return opts.required ? `กรุณากรอก${label}` : null;
  if (isValidThaiPhone(raw)) return null;
  return `${label}ไม่ถูกต้อง — มือถือ 10 หลัก (08x-xxx-xxxx) หรือเบอร์บ้าน 9 หลัก (02-xxx-xxxx)`;
}

export const PHONE_PLACEHOLDER = "08x-xxx-xxxx";
