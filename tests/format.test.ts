import { addDays, bkkDateKey, dayAndMonth, formatDateLong, formatDateShort, formatDistance, formatPrice, formatTime } from "@/lib/format";

/** วันเวลาต้องเป็นเวลาไทยเสมอ ไม่ว่าเครื่องตั้งโซนไหน (เหมือน bkkDateKey ของเว็บ) */
describe("Bangkok time formatting", () => {
  it("rolls the date at Bangkok midnight, not UTC", () => {
    expect(bkkDateKey("2026-10-02T16:59:00Z")).toBe("2026-10-02");
    expect(bkkDateKey("2026-10-02T17:00:00Z")).toBe("2026-10-03");
  });

  it("formats time in Bangkok", () => {
    expect(formatTime("2026-10-02T03:30:00Z")).toBe("10:30");
  });

  it("keeps date-only strings on the same day (no timezone shift)", () => {
    expect(formatDateShort("2026-03-14")).toBe("14 มี.ค. 2569");
    expect(dayAndMonth("2026-03-14")).toEqual({ day: "14", month: "มี.ค.", dow: "ส." });
    expect(formatDateLong("2026-03-14")).toBe("เสาร์ 14 มีนาคม 2569");
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("price / distance", () => {
  it("shows a range only when min ≠ max", () => {
    expect(formatPrice("300", "500")).toBe("฿300–500");
    expect(formatPrice("300", "300")).toBe("฿300");
    expect(formatPrice(null, null)).toBeNull();
  });

  it("switches to km past 1000 m", () => {
    expect(formatDistance(850)).toBe("850 ม.");
    expect(formatDistance(2450)).toBe("2.5 กม.");
    expect(formatDistance(null)).toBeNull();
  });
});
