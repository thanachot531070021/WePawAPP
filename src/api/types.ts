/**
 * รูปร่าง response ของ petcare /api/mobile/* — ตรงกับ SELECT ใน route ฝั่งเว็บ
 * pg คืน NUMERIC เป็น string (เช่น rating_avg, weight_kg) จึงพิมพ์เป็น string
 */
import type { AppointmentStatus } from "@/shared/apptTone";

export interface User {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  role: string;
  avatar_url: string | null;
}

export interface Profile {
  province: string | null;
  district: string | null;
  consent_marketing: boolean | null;
  consent_data_sharing: boolean | null;
  auth_provider: string | null;
  has_social: boolean;
}

export interface ClinicListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  district: string | null;
  province: string | null;
  address_line: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  clinic_type: string | null;
  is_verified: boolean;
  rating_avg: string | null;
  rating_count: number;
  view_count: number;
  favorite_count: number;
  lat: number | null;
  lng: number | null;
  distance_meters: number | null;
  species_list: string[];
}

export interface ClinicHour {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export interface ClinicService {
  id: string;
  service_name: string;
  description: string | null;
  price_min: string | null;
  price_max: string | null;
}

export interface ClinicVet {
  id: string;
  full_name: string;
  avatar_url: string | null;
  specialties: string[] | null;
  years_of_experience: number | null;
}

export interface Review {
  id: string;
  rating: number;
  rating_expertise: number | null;
  rating_cleanliness: number | null;
  rating_price: number | null;
  rating_service: number | null;
  title: string | null;
  comment: string | null;
  clinic_reply: string | null;
  clinic_replied_at: string | null;
  helpful_count: number;
  created_at: string;
  user_full_name: string;
  user_avatar_url: string | null;
  pet_name: string | null;
  pet_species: string | null;
  images: string[];
}

export interface ClinicDetail {
  clinic: ClinicListItem & {
    email: string | null;
    website: string | null;
    line_id: string | null;
    facebook_url: string | null;
    sub_district: string | null;
    postal_code: string | null;
  };
  hours: ClinicHour[];
  services: ClinicService[];
  images: { id: string; image_url: string; caption: string | null }[];
  vets: ClinicVet[];
  reviews: Review[];
}

/** = MobilePetRow ของเว็บ (app/account/layout.tsx) */
export interface PetRow {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  weight_kg: string | null;
  color: string | null;
  is_neutered: boolean | null;
  microchip_id: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  my_role: "owner" | "co_owner" | "viewer";
  share_count: string;
  next_vaccine_due_at: string | null;
  next_vaccine_name: string | null;
  vaccine_count: string;
  last_visit_at: string | null;
  upcoming_appointment_at: string | null;
  upcoming_clinic_name: string | null;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  birth_date: string | null;
  weight_kg: string | null;
  color: string | null;
  distinctive_marks: string | null;
  is_neutered: boolean | null;
  microchip_id: string | null;
  allergies: string | null;
  avatar_url: string | null;
  owner_name: string;
  owner_phone: string | null;
}

export interface Measurement {
  id: string;
  measured_at: string;
  source: string | null;
  weight_kg: string | null;
  height_cm: string | null;
  body_length_cm: string | null;
  body_condition_score: number | null;
  temperature_c: string | null;
  heart_rate_bpm: number | null;
  notes: string | null;
}

export interface Vaccination {
  id: string;
  vaccine_name: string;
  vaccine_type: string | null;
  dose_number: number | null;
  administered_date: string;
  next_due_date: string | null;
  clinic_name: string | null;
  administered_by_name: string | null;
  is_verified: boolean;
  notes: string | null;
}

export interface MedicalRecord {
  id: string;
  visit_date: string;
  visit_type: string;
  clinic_name: string | null;
  vet_name: string | null;
  diagnosis: string | null;
  treatment: string | null;
  medications: unknown;
  notes: string | null;
  follow_up_date: string | null;
  is_verified: boolean;
}

export interface PetDetail {
  pet: Pet;
  access_role: "owner" | "co_owner" | "viewer" | "vet" | "clinic";
  measurements: Measurement[];
  vaccinations: Vaccination[];
  medical_records: MedicalRecord[];
  appointments: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: AppointmentStatus;
    service_label: string | null;
    clinic_name: string;
    vet_name: string | null;
  }[];
}

export interface AppointmentRow {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  source: string | null;
  service_label: string | null;
  notes_owner: string | null;
  preferred_date: string | null;
  preferred_periods: string[] | null;
  is_home_visit: boolean;
  clinic_id: string;
  review_request_id: string | null;
  clinic_name: string;
  clinic_slug: string;
  clinic_phone: string | null;
  vet_name: string | null;
  pet_name: string | null;
  pet_species: string | null;
}

export interface AppointmentDetail {
  appointment: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: AppointmentStatus;
    service_label: string | null;
    notes_owner: string | null;
    cancel_reason: string | null;
    cancelled_at: string | null;
    preferred_date: string | null;
    preferred_periods: string[] | null;
    is_home_visit: boolean;
    service_address: string | null;
    service_address_note: string | null;
    dropoff_pickup_pref: string | null;
    dropoff_pickup_after: string | null;
    dropoff_contact_phone: string | null;
    dropoff_spend_ceiling: number | null;
    dropoff_unreachable_action: string | null;
    accepted_at: string | null;
    arrived_at: string | null;
    created_at: string;
    clinic_id: string;
    clinic_name: string;
    clinic_slug: string;
    clinic_phone: string | null;
    clinic_address: string | null;
    clinic_logo_url: string | null;
    vet_id: string | null;
    vet_name: string | null;
    pet_id: string | null;
    pet_name: string | null;
    pet_species: string | null;
    pet_avatar_url: string | null;
    case_thread_id: string | null;
    review_request_id: string | null;
  };
  proposed_slots: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    is_accepted: boolean;
    vet_name: string | null;
  }[];
}

export interface BookingData {
  clinic: { id: string; name: string; slug: string };
  ownerPhone: string | null;
  clinicHoursLabel: string | null;
  pets: { id: string; name: string; species: string }[];
  services: {
    id: string;
    service_name: string;
    price_min: string | null;
    price_max: string | null;
    home_visit_available: boolean;
    requires_dropoff: boolean;
    typical_duration_min: number | null;
    dropoff_pickup_options: string[] | null;
  }[];
  closedDays: number[];
  closedDates: string[];
  periodWindows: { key: "morning" | "afternoon" | "evening"; start: string; end: string }[];
  homeVisit: {
    bookingEnabled: boolean;
    baseFee: string | null;
    travelFee: string | null;
    note: string | null;
    clinicLat: number | null;
    clinicLng: number | null;
  };
}

export interface NotificationItem {
  id: string;
  category: string;
  title: string;
  body: string;
  action_url: string | null;
  action_label: string | null;
  icon: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ChatThread {
  id: string;
  kind: "clinic" | "vet" | "case";
  clinic_id: string;
  status: "open" | "closed" | "blocked";
  subject: string | null;
  owner_unread_count: number;
  clinic_unread_count: number;
  owner_full_name: string;
  owner_avatar_url: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_sender_role: string | null;
  clinic_name: string;
  clinic_slug: string;
  clinic_logo_url: string | null;
  vet_full_name: string | null;
  vet_avatar_url: string | null;
  pet_name: string | null;
}

export interface ChatAttachment {
  url: string;
  type: string;
  name: string;
  size: number;
  width?: number;
  height?: number;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_user_id: string | null;
  sender_role: "owner" | "clinic" | "vet" | "system";
  sender_name: string | null;
  sender_avatar_url: string | null;
  body: string | null;
  attachments: ChatAttachment[];
  read_at: string | null;
  created_at: string;
}

export interface PetShare {
  id: string;
  user_id: string;
  role: "co_owner" | "viewer";
  accepted_at: string;
  user_full_name: string;
  user_email: string;
  user_avatar_url: string | null;
}

export interface ShareInvitation {
  id: string;
  token: string;
  role: "co_owner" | "viewer";
  uses_count: number;
  created_at: string;
  url: string;
}

export interface CalendarNote {
  id: string;
  note_date: string;
  title: string;
  body: string | null;
  color: "stone" | "emerald" | "amber" | "sky" | "rose";
}

export interface CommunityAnswer {
  id: string;
  role: "vet" | "owner";
  authorName: string;
  authorInitial: string;
  authorAvatar: string | null;
  clinic: string | null;
  time: string;
  body: string;
  likes: number;
  dislikes: number;
  myVote: number;
  isMine: boolean;
}

export interface CommunityQuestion {
  id: string;
  species: string;
  topic: string | null;
  time: string;
  askerName: string;
  askerInitial: string;
  askerAvatar: string | null;
  pet: string;
  title: string;
  body: string;
  photoUrl: string | null;
  likes: number;
  dislikes: number;
  views: number;
  answerCount: number;
  vetAnswered: boolean;
  myVote: number;
  isMine: boolean;
  answers: CommunityAnswer[];
}

/** ผลของ route ที่ห่อ server action: `{ ok, data }` */
export interface ActionOk<T> {
  ok: true;
  data: T;
}
