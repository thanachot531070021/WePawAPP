import { api } from "./client";
import type { ActionOk } from "./types";
import type {
  BookingRequest,
  ClinicOverview,
  ClinicProfile,
  ClinicReview,
  ClinicServiceRow,
  ClinicVetRow,
  StaffPetFile,
  VetHome,
  VetProfile,
  VetWeek,
} from "./staffTypes";

/** endpoint ฝั่งคลินิก — petcare app/api/mobile/clinic/** */
export const clinicStaffApi = {
  overview: () => api<ClinicOverview>("/api/mobile/clinic/overview"),
  requests: () =>
    api<{ requests: BookingRequest[]; vets: { id: string; full_name: string }[] }>("/api/mobile/clinic/requests"),
  respond: (
    id: string,
    body:
      | { action: "accept" }
      | { action: "decline" | "decline_home"; reason?: string }
      | { action: "cancel"; by: "owner" | "clinic"; reason?: string }
      | { action: "confirm_home"; window_start_iso: string; window_end_iso: string; vet_id?: string | null; final_fee?: number | null }
  ) => api<ActionOk<unknown>>(`/api/mobile/clinic/requests/${id}`, { body }),
  markArrived: (id: string) => api<ActionOk<unknown>>(`/api/mobile/clinic/appointments/${id}/arrived`, { method: "POST" }),
  scheduleArrival: (
    id: string,
    body: { scheduled_at_iso: string; duration_minutes: number; vet_id?: string | null; start_now: boolean }
  ) => api<ActionOk<unknown>>(`/api/mobile/clinic/appointments/${id}/schedule`, { body }),
  reviews: () => api<{ items: ClinicReview[] }>("/api/mobile/clinic/reviews"),
  reply: (id: string, reply: string) => api<ActionOk<unknown>>(`/api/mobile/clinic/reviews/${id}/reply`, { body: { reply } }),
  profile: () => api<{ clinic: ClinicProfile }>("/api/mobile/clinic/profile"),
  updateProfile: (body: Partial<ClinicProfile>) =>
    api<ActionOk<unknown>>("/api/mobile/clinic/profile", { method: "PATCH", body }),
  services: () => api<{ items: ClinicServiceRow[] }>("/api/mobile/clinic/services"),
  createService: (body: { service_name: string; description?: string; price_min?: string; price_max?: string }) =>
    api<ActionOk<unknown>>("/api/mobile/clinic/services", { body }),
  updateService: (id: string, body: { service_name: string; description?: string; price_min?: string; price_max?: string }) =>
    api<ActionOk<unknown>>(`/api/mobile/clinic/services/${id}`, { method: "PATCH", body }),
  deleteService: (id: string) => api<ActionOk<unknown>>(`/api/mobile/clinic/services/${id}`, { method: "DELETE" }),
  vets: () => api<{ items: ClinicVetRow[] }>("/api/mobile/clinic/vets"),
  approveVet: (vetId: string) => api<ActionOk<unknown>>(`/api/mobile/clinic/vets/${vetId}`, { method: "POST" }),
  /** createVet ของเว็บ — หมอใหม่ได้ activationPath ให้คลินิกส่งต่อ, หมอที่มีบัญชีแล้วได้คำเชิญ */
  addVet: (body: {
    full_name: string;
    email: string | null;
    phone: string | null;
    license_number: string | null;
    years_of_experience: string | null;
    role_at_clinic: "full_time" | "part_time" | "freelance";
  }) =>
    api<ActionOk<{ vetId: string; outcome: "created_pending" | "linked_existing"; activationPath?: string }>>("/api/mobile/clinic/vets", {
      body,
    }),
  /** ลิงก์เปิดใช้งานใหม่ให้หมอที่ยัง pending (ใบเก่าถูกยกเลิก) */
  vetActivationLink: (vetId: string) =>
    api<ActionOk<{ activationPath: string }>>(`/api/mobile/clinic/vets/${vetId}/activation`, { method: "POST" }),
  removeVet: (vetId: string, reason?: string) =>
    api<ActionOk<unknown>>(`/api/mobile/clinic/vets/${vetId}`, { method: "DELETE", body: { reason } }),
  petFile: (petId: string) => api<StaffPetFile>(`/api/mobile/clinic/pets/${petId}`),
};

/** endpoint ฝั่งหมอ — petcare app/api/mobile/vet/** (คลินิกที่เลือกส่งทาง header x-vet-clinic) */
export const vetStaffApi = {
  home: () => api<VetHome>("/api/mobile/vet/home"),
  week: (start?: string) => api<VetWeek>("/api/mobile/vet/week", { query: { start } }),
  respondInvite: (clinicId: string, action: "accept" | "decline") =>
    api<ActionOk<unknown>>(`/api/mobile/vet/invites/${clinicId}`, { body: { action } }),
  availability: () =>
    api<{
      clinic: { clinic_id: string; clinic_name: string } | null;
      availability: { day_of_week: number; start_time: string; end_time: string }[];
      time_off: { id: string; clinic_id: string | null; clinic_name: string | null; start_at: string; end_at: string; reason: string | null }[];
    }>("/api/mobile/vet/availability"),
  saveAvailability: (rows: { day_of_week: number; start_time: string; end_time: string; active: boolean }[]) =>
    api<ActionOk<unknown>>("/api/mobile/vet/availability", { method: "PUT", body: { rows } }),
  addTimeOff: (body: { clinic_id: string; start_date: string; start_time: string; end_date: string; end_time: string; reason?: string }) =>
    api<ActionOk<unknown>>("/api/mobile/vet/time-off", { body }),
  deleteTimeOff: (id: string) => api<ActionOk<unknown>>(`/api/mobile/vet/time-off/${id}`, { method: "DELETE" }),
  profile: () => api<{ profile: VetProfile | null }>("/api/mobile/vet/profile"),
  updateProfile: (body: Record<string, string | null>) =>
    api<ActionOk<unknown>>("/api/mobile/vet/profile", { method: "PATCH", body }),
  setAvatar: (avatar_url: string | null) =>
    api<ActionOk<unknown>>("/api/mobile/vet/profile", { method: "PATCH", body: { avatar_url } }),
  petFile: (petId: string) => api<StaffPetFile>(`/api/mobile/vet/pets/${petId}`),
};

/** ใช้ร่วมกันระหว่างหมอกับคลินิก (สิทธิ์ตรวจที่ action ของเว็บ) */
export const caseApi = {
  setStatus: (appointmentId: string, status: string, reason?: string) =>
    api<ActionOk<unknown>>(`/api/mobile/appointments/${appointmentId}/status`, { body: { status, reason } }),
  complete: (
    appointmentId: string,
    body: {
      visit_date: string;
      visit_type: string;
      diagnosis?: string | null;
      treatment?: string | null;
      medications?: string | null;
      notes?: string | null;
      follow_up_date?: string | null;
    }
  ) => api<ActionOk<{ recordId: string | null }>>(`/api/mobile/appointments/${appointmentId}/complete`, { body }),
  openCaseThread: (appointmentId: string) =>
    api<ActionOk<{ threadId: string }>>(`/api/mobile/chat/appointments/${appointmentId}`, { method: "POST" }),
  closeThread: (threadId: string) => api<ActionOk<unknown>>(`/api/mobile/chat/threads/${threadId}/close`, { method: "POST" }),
};
