import { addDays, bkkDateKey } from "@/lib/format";
import { derivePetStatus } from "@/shared/petStatus";
import { getSpeciesPhoto } from "@/shared/species";

/** กติกาเดียวกับเว็บ (ไฟล์ copy มา — check-sync ยืนยันว่าตรง) ทดสอบว่ารันบน RN ได้ผลตามคาด */
describe("derivePetStatus", () => {
  const base = { next_vaccine_name: "วัคซีนรวม", vaccine_count: "1", last_visit_at: null };
  const today = bkkDateKey();

  it("overdue", () => {
    const s = derivePetStatus({ ...base, next_vaccine_due_at: addDays(today, -20) });
    expect(s.kind).toBe("overdue");
  });
  it("due within 30 days", () => {
    const s = derivePetStatus({ ...base, next_vaccine_due_at: addDays(today, 10) });
    expect(s).toEqual({ kind: "due", text: "วัคซีนรวมถึงกำหนดใน 10 วัน" });
  });
  it("ok when far away", () => {
    expect(derivePetStatus({ ...base, next_vaccine_due_at: addDays(today, 200) }).kind).toBe("ok");
  });
  it("none without vaccines", () => {
    expect(derivePetStatus({ ...base, vaccine_count: "0", next_vaccine_due_at: null }).kind).toBe("none");
  });
});

describe("getSpeciesPhoto", () => {
  it("picks the same portrait for the same pet id (stable across screens)", () => {
    expect(getSpeciesPhoto("dog", "pet-1")).toBe(getSpeciesPhoto("dog", "pet-1"));
  });
  it("has no portrait for reptiles (falls back to pictogram)", () => {
    expect(getSpeciesPhoto("reptile", "x")).toBeNull();
  });
});
