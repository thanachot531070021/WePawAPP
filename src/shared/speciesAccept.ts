// คลินิกรับสัตว์ชนิดนี้ไหม — ตาม clinic_species ที่คลินิกเลือกตอนสมัคร/แก้โปรไฟล์ (ไม่แตะ DB ใช้ได้ทั้ง client/server)
//
// เดิมจองนกที่คลินิกรับแค่หมา/แมวได้เฉย ๆ (ทดสอบเว็บจริง 20 ต.ค. 2026) — คลินิกได้คำขอที่รับไม่ได้
// กติกาผ่อนไว้ไม่ให้บล็อกผิด: ไม่มีข้อมูลชนิดเลย = ไม่บล็อก · "สัตว์พิเศษ" (exotic) = รับทุกชนิดที่ไม่ใช่หมา/แมว

const DOG_CAT = new Set(["dog", "cat"]);

export function clinicAcceptsSpecies(accepted: readonly string[], species: string): boolean {
  if (accepted.length === 0) return true;
  return clinicListsSpecies(accepted, species);
}

/**
 * แบบเข้มสำหรับตัวกรองค้นหา — ต้องระบุไว้จริง (ไม่มีข้อมูลชนิด = ไม่ผ่าน)
 * เลือก "ปลา" ในตัวกรองจึงเจอทั้งคลินิกที่ติ๊กปลาและคลินิกที่ติ๊ก "สัตว์พิเศษ"
 */
export function clinicListsSpecies(accepted: readonly string[], species: string): boolean {
  if (accepted.includes(species)) return true;
  return accepted.includes("exotic") && !DOG_CAT.has(species);
}

/** ชนิดที่ส่งให้ SQL ค้นหา (clinic_species = ANY) — ชนิดที่ไม่ใช่หมา/แมว ให้รวมคลินิก "สัตว์พิเศษ" ด้วย */
export function speciesFilterSet(selected: readonly string[]): string[] {
  const out = new Set(selected);
  if (selected.some((s) => !DOG_CAT.has(s))) out.add("exotic");
  return [...out];
}
