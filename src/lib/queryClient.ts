import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // 4xx (ไม่มีสิทธิ์/ไม่พบ) ลองซ้ำก็ไม่หาย — ลองซ้ำเฉพาะเน็ตหลุด/เซิร์ฟเวอร์ล่ม
      retry: (count, err) =>
        count < 2 && !(err instanceof ApiError && err.status >= 400 && err.status < 500),
    },
  },
});

/** คีย์ cache กลาง — invalidate ตามกลุ่มหลังเขียนข้อมูล */
export const qk = {
  me: ["me"] as const,
  pets: ["pets"] as const,
  pet: (id: string) => ["pets", id] as const,
  petShares: (id: string) => ["pets", id, "shares"] as const,
  appointments: (range: string) => ["appointments", range] as const,
  appointment: (id: string) => ["appointments", "detail", id] as const,
  clinics: (params: unknown) => ["clinics", params] as const,
  clinic: (slug: string) => ["clinic", slug] as const,
  bookingData: (clinicId: string) => ["bookingData", clinicId] as const,
  favorites: ["favorites"] as const,
  notifications: ["notifications"] as const,
  chatThreads: ["chat", "threads"] as const,
  chatMessages: (id: string) => ["chat", "messages", id] as const,
  chatUnread: ["chat", "unread"] as const,
  notes: ["notes"] as const,
  community: (filter: string, sort: string) => ["community", filter, sort] as const,
  question: (id: string) => ["community", "q", id] as const,
};
