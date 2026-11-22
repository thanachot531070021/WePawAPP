// ข้อมูลเพิ่มเติมที่เจ้าของตั้งหัวข้อเอง (migration 046) — ไม่แตะ DB ใช้ได้ทั้ง client/server
// โหลดจาก DB: lib/pets/customFieldsDb.ts · บันทึก: app/actions/pet-custom-fields.ts

export const CUSTOM_FIELD_LIMITS = { maxFields: 30, label: 60, value: 1000 } as const;

export type PetCustomField = { id: string; label: string; value: string };

/** หัวข้อตัวอย่างให้กดเลือก — พิมพ์เองได้เสมอ */
export const CUSTOM_FIELD_SUGGESTIONS = [
  "อาหารที่กิน",
  "ขนมที่ชอบ",
  "ของเล่นที่ชอบ",
  "นิสัย",
  "สิ่งที่กลัว",
  "ยาที่ทานประจำ",
  "ประกันสัตว์เลี้ยง",
  "สัตวแพทย์ประจำ",
  "ผู้ติดต่อฉุกเฉิน",
  "ที่มา/ฟาร์ม",
];
