import { webPathToApp } from "@/lib/links";

/** action_url ของแจ้งเตือนและลิงก์ที่แชร์กัน เป็น path ของเว็บ — ต้องพาไปหน้าเดียวกันในแอป */
describe("webPathToApp", () => {
  it.each([
    ["/account/pets/abc", "/pets/abc"],
    ["/account/pets/abc/edit", "/pets/abc"],
    ["/account/pets", "/pets"],
    ["/account/appointments", "/appointments"],
    ["/account/messages/t1", "/chat/t1"],
    ["/account/messages", "/chat"],
    ["/account/reviews/r1", "/review-request/r1"],
    ["/account/notifications", "/notifications"],
    ["/clinic/rak-nong-ma", "/clinic/rak-nong-ma"],
    ["/clinic/rak-nong-ma/review", "/clinic/rak-nong-ma/review"],
    ["/pets/share/TOKEN123", "/share/TOKEN123"],
    ["/claim/CLM", "/claim/CLM"],
    ["/community?q=q1", "/community/q1"],
    ["/community", "/community"],
    ["/search", "/"],
    ["https://petcare.example.com/pets/share/XYZ", "/share/XYZ"],
    ["/account/pets/", "/pets"],
    // บัญชีคลินิก
    ["/clinic-admin", "/clinic-admin"],
    ["/clinic-admin/appointments/requests", "/clinic-admin/requests"],
    ["/clinic-admin/queue", "/clinic-admin/appointments"],
    ["/clinic-admin/patients/p1", "/clinic-admin/patients/p1"],
    ["/clinic-admin/patients/p1/visit?case=c1", "/clinic-admin/patients/p1"],
    ["/clinic-admin/messages/t2", "/chat/t2"],
    ["/clinic-admin/reviews/settings", "/clinic-admin/reviews"],
    ["/clinic-admin/notifications", "/notifications"],
    // บัญชีหมอ
    ["/vet/dashboard", "/vet"],
    ["/vet/messages/t3", "/chat/t3"],
    ["/vet/pets/p2", "/vet/pets/p2"],
    ["/vet/schedule", "/vet/week"],
    ["/vet/availability", "/vet/availability"],
  ])("%s → %s", (input, expected) => {
    expect(webPathToApp(input)).toBe(expected);
  });

  it("returns null for pages the app does not have", () => {
    expect(webPathToApp("/clinic-admin/pos")).toBeNull();
    expect(webPathToApp("/clinic-admin/inventory")).toBeNull();
    expect(webPathToApp("/vet/medical-records/r1/edit")).toBeNull();
    expect(webPathToApp(null)).toBeNull();
    expect(webPathToApp("")).toBeNull();
  });
});
