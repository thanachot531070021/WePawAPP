import { api } from "./client";
import type { ClinicSignupPayload } from "./staffTypes";
import type {
  ActionOk,
  AppointmentDetail,
  AppointmentRow,
  BookingData,
  CalendarNote,
  ChatAttachment,
  ChatMessage,
  ChatThread,
  ClinicDetail,
  ClinicListItem,
  CommunityQuestion,
  NotificationItem,
  PetDetail,
  PetRow,
  PetShare,
  Profile,
  ShareInvitation,
  User,
} from "./types";

/** ทุก endpoint ที่แอปใช้ — path ตรงกับ petcare/app/api/** */

// ── auth ──
export interface AuthResult {
  token: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    api<AuthResult>("/api/mobile/auth/login", { body: { email, password }, anonymous: true }),
  signup: (body: {
    email: string;
    password: string;
    full_name: string;
    phone?: string | null;
    province?: string | null;
    district?: string | null;
    consent_terms: boolean;
    consent_marketing: boolean;
    consent_data_sharing: boolean;
  }) => api<AuthResult>("/api/mobile/auth/signup", { body, anonymous: true }),
  /** ลงทะเบียนคลินิก (payload เดียวกับ signUpClinicOwner ของเว็บ) — คลินิกเริ่มเป็น pending รออนุมัติ */
  signupClinic: (body: ClinicSignupPayload) =>
    api<AuthResult & { clinic_id: string }>("/api/mobile/auth/signup/clinic", { body, anonymous: true }),
  refresh: () => api<AuthResult>("/api/mobile/auth/refresh", { method: "POST" }),
};

// ── me ──
export const meApi = {
  get: () => api<{ user: User; profile: Profile | null }>("/api/mobile/me"),
  update: (body: { full_name: string; phone?: string | null; province?: string | null; district?: string | null }) =>
    api<ActionOk<null>>("/api/mobile/me", { method: "PATCH", body }),
  setAvatar: (url: string | null) => api<ActionOk<null>>("/api/mobile/me/avatar", { method: "PUT", body: { url } }),
  changePassword: (current_password: string, new_password: string) =>
    api<ActionOk<null>>("/api/mobile/me/password", { body: { current_password, new_password } }),
  deleteAccount: (body: { password?: string; confirm?: boolean }) =>
    api<{ ok: true }>("/api/mobile/me", { method: "DELETE", body }),
  registerDevice: (body: { token: string; platform: string; device_name?: string; app_version?: string; os_version?: string }) =>
    api<{ ok: true }>("/api/mobile/me/devices", { body }),
  unregisterDevice: (token: string) => api<{ ok: true }>("/api/mobile/me/devices", { method: "DELETE", body: { token } }),
};

// ── upload (route เดิมของเว็บ — รับ Bearer ได้แล้ว) ──
export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

function fileForm(file: UploadFile): FormData {
  const fd = new FormData();
  // React Native รับ object {uri,name,type} เป็นไฟล์ใน FormData
  fd.append("file", file as unknown as Blob);
  return fd;
}

export const uploadApi = {
  pet: (file: UploadFile) => api<{ url: string }>("/api/pets/upload", { form: fileForm(file) }),
  avatar: (file: UploadFile) => api<{ url: string }>("/api/account/avatar", { form: fileForm(file) }),
  review: (file: UploadFile) => api<{ url: string }>("/api/reviews/upload", { form: fileForm(file) }),
  chat: (file: UploadFile) => api<{ attachment: ChatAttachment }>("/api/chat/upload", { form: fileForm(file) }),
};

// ── clinics ──
export interface ClinicSearch {
  q?: string;
  species?: string[];
  lat?: number;
  lng?: number;
  radius?: number;
  sort?: "rating" | "reviews" | "newest";
  open_now?: boolean;
}

export const clinicApi = {
  search: (s: ClinicSearch) =>
    api<{ items: ClinicListItem[] }>("/api/mobile/clinics", {
      query: { ...s, open_now: s.open_now ? "1" : undefined },
      anonymous: true,
    }),
  detail: (slug: string) => api<ClinicDetail>(`/api/mobile/clinics/${encodeURIComponent(slug)}`),
  bookingData: (clinicId: string) => api<BookingData>(`/api/clinic/${clinicId}/booking-data`),
  favorites: () => api<{ items: ClinicListItem[] }>("/api/mobile/favorites"),
  toggleFavorite: (clinic_id: string) =>
    api<{ ok: true; favorited: boolean }>("/api/mobile/favorites", { body: { clinic_id } }),
};

// ── pets ──
export interface PetInput {
  name: string;
  species: string;
  breed?: string | null;
  gender?: string;
  birth_date?: string | null;
  weight_kg?: string | null;
  color?: string | null;
  distinctive_marks?: string | null;
  is_neutered?: boolean;
  microchip_id?: string | null;
  allergies?: string | null;
  avatar_url?: string | null;
}

export const petApi = {
  list: () => api<{ items: PetRow[] }>("/api/mobile/pets"),
  detail: (id: string) => api<PetDetail>(`/api/mobile/pets/${id}`),
  create: (body: PetInput) => api<ActionOk<{ petId: string }>>("/api/mobile/pets", { body }),
  update: (id: string, body: PetInput) =>
    api<ActionOk<{ petId: string }>>(`/api/mobile/pets/${id}`, { method: "PATCH", body }),
  remove: (id: string) => api<ActionOk<null>>(`/api/mobile/pets/${id}`, { method: "DELETE" }),
  addMeasurement: (id: string, body: Record<string, string | null | undefined>) =>
    api<ActionOk<{ measurementId: string }>>(`/api/mobile/pets/${id}/measurements`, { body }),
  removeMeasurement: (mid: string) => api<ActionOk<unknown>>(`/api/mobile/measurements/${mid}`, { method: "DELETE" }),
  addVaccination: (id: string, body: Record<string, string | null | undefined>) =>
    api<ActionOk<{ vaccinationId: string }>>(`/api/mobile/pets/${id}/vaccinations`, { body }),
  removeVaccination: (vid: string) => api<ActionOk<unknown>>(`/api/mobile/vaccinations/${vid}`, { method: "DELETE" }),
  shares: (id: string) => api<{ shares: PetShare[]; invitations: ShareInvitation[] }>(`/api/mobile/pets/${id}/shares`),
  createInvitation: (id: string, role: "co_owner" | "viewer") =>
    api<ActionOk<{ token: string; invitationId: string; url: string }>>(`/api/mobile/pets/${id}/shares`, {
      body: { role },
    }),
  revokeInvitation: (invId: string) => api<ActionOk<unknown>>(`/api/mobile/pet-share-invitations/${invId}`, { method: "DELETE" }),
  updateShareRole: (shareId: string, role: "co_owner" | "viewer") =>
    api<ActionOk<unknown>>(`/api/mobile/pet-shares/${shareId}`, { method: "PATCH", body: { role } }),
  revokeShare: (shareId: string) => api<ActionOk<unknown>>(`/api/mobile/pet-shares/${shareId}`, { method: "DELETE" }),
  transfer: (id: string, new_owner_user_id: string) =>
    api<ActionOk<unknown>>(`/api/mobile/pets/${id}/transfer`, { body: { new_owner_user_id } }),
  previewInvitation: (token: string) =>
    api<{
      role: "co_owner" | "viewer";
      revoked: boolean;
      inviter_name: string | null;
      pets: { id: string; name: string; is_mine: boolean }[];
    }>("/api/mobile/pet-share-invitations/accept", { query: { token } }),
  acceptInvitation: (token: string) =>
    api<ActionOk<{ petId: string; petName: string; role: string; petIds: string[] }>>(
      "/api/mobile/pet-share-invitations/accept",
      { body: { token } }
    ),
};

// ── appointments ──
export interface BookingInput {
  clinic_id: string;
  pet_id: string;
  service_id?: string | null;
  service_label: string;
  preferred_date: string;
  preferred_periods: string[];
  notes_owner?: string | null;
  dropoff?: {
    pickup_pref?: string | null;
    pickup_after?: string | null;
    contact_phone?: string | null;
    spend_ceiling?: number | null;
    unreachable_action?: string | null;
  } | null;
}

export interface HomeVisitInput {
  clinic_id: string;
  pet_id: string;
  service_id: string;
  service_label: string;
  preferred_date: string;
  preferred_periods: string[];
  service_address: string;
  service_address_note?: string | null;
  service_lat?: number | null;
  service_lng?: number | null;
  notes_owner?: string | null;
}

export const appointmentApi = {
  list: (range: "upcoming" | "past") => api<{ items: AppointmentRow[] }>("/api/mobile/appointments", { query: { range } }),
  detail: (id: string) => api<AppointmentDetail>(`/api/mobile/appointments/${id}`),
  request: (body: BookingInput) => api<ActionOk<{ appointmentId: string }>>("/api/mobile/appointments", { body }),
  homeVisit: (body: HomeVisitInput) =>
    api<ActionOk<{ appointmentId: string }>>("/api/mobile/appointments/home-visit", { body }),
  cancel: (id: string, reason?: string) => api<{ ok: true }>(`/api/mobile/appointments/${id}/cancel`, { body: { reason } }),
  acceptSlot: (id: string, slot_id: string) =>
    api<ActionOk<unknown>>(`/api/mobile/appointments/${id}/proposal`, { body: { action: "accept", slot_id } }),
  declineProposal: (id: string, reason?: string) =>
    api<ActionOk<unknown>>(`/api/mobile/appointments/${id}/proposal`, { body: { action: "decline", reason } }),
};

// ── reviews ──
export interface ReviewInput {
  rating: number;
  rating_expertise?: number | null;
  rating_cleanliness?: number | null;
  rating_price?: number | null;
  rating_service?: number | null;
  title?: string | null;
  comment?: string | null;
}

export const reviewApi = {
  create: (body: ReviewInput & { clinic_id: string; pet_id?: string | null; image_urls?: string[] }) =>
    api<ActionOk<null>>("/api/mobile/reviews", { body }),
  request: (id: string) =>
    api<
      ActionOk<{
        id: string;
        clinic_id: string;
        clinic_name: string;
        clinic_slug: string;
        pet_id: string | null;
        pet_name: string | null;
        service_label: string | null;
        status: string;
        already_reviewed: boolean;
      }>
    >(`/api/mobile/review-requests/${id}`),
  submitRequest: (id: string, body: ReviewInput) =>
    api<ActionOk<{ reviewId: string }>>(`/api/mobile/review-requests/${id}`, { body }),
};

// ── notifications ──
export const notificationApi = {
  list: () => api<{ items: NotificationItem[]; unread_count: number }>("/api/mobile/notifications"),
  read: (id: string) => api<{ ok: true; unread_count: number }>(`/api/mobile/notifications/${id}/read`, { method: "POST" }),
  readAll: () => api<{ ok: true }>("/api/mobile/notifications/read-all", { method: "POST" }),
};

// ── chat ──
export const chatApi = {
  threads: () => api<{ items: ChatThread[]; role: "owner" | "clinic" | "vet" }>("/api/mobile/chat/threads"),
  start: (clinicId: string, opts: { petId?: string | null; subject?: string | null } = {}) =>
    api<{ thread: { id: string } }>("/api/chat/threads", {
      body: { clinicId, kind: "clinic", petId: opts.petId ?? null, subject: opts.subject ?? null },
    }),
  messages: (id: string, after?: string) =>
    api<{
      messages: ChatMessage[];
      thread: { id: string; status: string; subject: string | null; clinic_id: string; kind: string };
      my_role: string;
      can_post: boolean;
    }>(`/api/mobile/chat/threads/${id}/messages`, { query: { after } }),
  send: (id: string, body: { body?: string | null; attachments?: ChatAttachment[] }) =>
    api<{ message: ChatMessage }>(`/api/mobile/chat/threads/${id}/messages`, { body }),
  read: (id: string) => api<{ ok: true }>(`/api/mobile/chat/threads/${id}/read`, { method: "POST" }),
  unread: () => api<{ count: number }>("/api/mobile/chat/unread-count"),
};

// ── calendar notes ──
export const noteApi = {
  list: () => api<{ items: CalendarNote[] }>("/api/mobile/calendar-notes"),
  create: (body: { note_date: string; title: string; body?: string; color?: CalendarNote["color"] }) =>
    api<ActionOk<{ id: string }>>("/api/mobile/calendar-notes", { body }),
  remove: (id: string) => api<ActionOk<unknown>>(`/api/mobile/calendar-notes/${id}`, { method: "DELETE" }),
};

// ── community ──
export const communityApi = {
  list: (filter: string, sort: "recent" | "top") =>
    api<{ items: CommunityQuestion[] }>("/api/mobile/community", { query: { filter, sort } }),
  detail: (id: string) => api<{ question: CommunityQuestion }>(`/api/mobile/community/${id}`),
  ask: (body: { species: string; topic?: string; title: string; body: string }) =>
    api<ActionOk<{ id: string }>>("/api/mobile/community", { body }),
  answer: (id: string, body: string) =>
    api<ActionOk<{ id: string }>>(`/api/mobile/community/${id}/answers`, { body: { body } }),
  vote: (targetType: "question" | "answer", targetId: string, value: number) =>
    api<ActionOk<{ value: number }>>("/api/mobile/community/vote", { body: { targetType, targetId, value } }),
  report: (targetType: "question" | "answer", targetId: string, reason: string) =>
    api<{ ok: true }>("/api/mobile/community/report", { body: { targetType, targetId, reason } }),
};

/** ที่อยู่จากพิกัด — /api/geo/reverse ของเว็บ (Nominatim + ชื่อจังหวัด/อำเภอจากชุดข้อมูลไทยของเว็บ) */
export const geoApi = {
  reverse: (lat: number, lng: number) =>
    api<{ province: string; district: string; sub_district: string; postal_code: string; address_line: string }>(
      `/api/geo/reverse?lat=${lat}&lng=${lng}`,
      { anonymous: true }
    ),
};
