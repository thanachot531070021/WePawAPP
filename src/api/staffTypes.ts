/**
 * รูปร่าง response ของ route ฝั่งคลินิก/หมอ — ตรงกับ type ของเว็บ:
 * OpsData (app/clinic-admin/(dashboard)/appointments/ops-types.ts), RequestRow (request-types.ts),
 * VetTodayData (lib/vet/today.ts), VetWeekData (lib/vet/week.ts), VetProfile (app/actions/vets.ts)
 */
import type { AppointmentStatus } from "@/shared/apptTone";

export interface StaffClinic {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface SoloVet {
  id: string;
  full_name: string;
}

export interface OpsPet {
  id: string | null;
  name: string;
  species: string | null;
  avatar: string | null;
}

export type OpsCaseStatus = "awaiting" | "waiting" | "examining" | "done";

export interface OpsVet {
  id: string;
  name: string;
  nick: string;
  avatar: string | null;
  shift: [number, number] | null;
  onShiftNow: boolean;
  pendingAccount: boolean;
}

export interface OpsCase {
  id: string;
  time: number;
  pet: OpsPet;
  service: string;
  vetId: string | null;
  status: OpsCaseStatus;
  note: string | null;
  queueId: string | null;
  lane: string | null;
  home: boolean;
}

export interface OpsData {
  now: number;
  dateLabel: string;
  vets: OpsVet[];
  cases: OpsCase[];
  requests: { id: string; status: string }[];
}

export interface ClinicOverview {
  clinic: StaffClinic;
  pending: boolean;
  stats?: {
    views_total: number;
    views_7d: number;
    views_prev_7d: number;
    favorite_count: number;
    rating_avg: string | null;
    rating_count: number;
    pending_reply: number;
    pending_requests: number;
    accepted_waiting: number;
  };
  ops?: OpsData;
  solo_vet?: SoloVet | null;
}

export interface OwnerHistory {
  kept: number;
  postponed: number;
  cancelled: number;
  noShow: number;
}

export interface BookingRequest {
  id: string;
  status: AppointmentStatus;
  service_label: string | null;
  notes_owner: string | null;
  preferred_date: string | null;
  preferred_periods: string[] | null;
  created_at: string;
  accepted_at: string | null;
  pet_id: string | null;
  pet_name: string | null;
  pet_species: string | null;
  pet_avatar_url: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  history: OwnerHistory | null;
  is_home_visit: boolean;
  service_address: string | null;
  service_address_note: string | null;
  request_expires_at: string | null;
  dropoff_pickup_pref: string | null;
  dropoff_pickup_after: string | null;
  dropoff_contact_phone: string | null;
  dropoff_spend_ceiling: number | null;
  dropoff_unreachable_action: string | null;
}

export interface ClinicReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  clinic_reply: string | null;
  clinic_replied_at: string | null;
  created_at: string;
  user_full_name: string;
  user_avatar_url: string | null;
  pet_name: string | null;
  images: string[];
}

export interface ClinicProfile {
  id: string;
  slug: string;
  status: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  line_id: string | null;
  website: string | null;
  facebook_url: string | null;
  address_line: string;
  sub_district: string | null;
  district: string;
  province: string;
  postal_code: string | null;
  logo_url: string | null;
  rating_avg: string | null;
  rating_count: number;
}

export interface ClinicServiceRow {
  id: string;
  service_name: string;
  description: string | null;
  price_min: string | null;
  price_max: string | null;
  requires_dropoff: boolean;
  home_visit_available: boolean;
}

export interface ClinicVetRow {
  vet_id: string;
  full_name: string;
  avatar_url: string | null;
  role_label: string;
  is_primary: boolean;
  link_status: "active" | "provisional" | "requested";
  account_status: string;
  email: string | null;
  appointments_today: number;
}

export type TodayStatus = "awaiting" | "waiting" | "confirmed" | "examining" | "done";

export interface TodayCase {
  id: string;
  t: string;
  dur: number;
  status: TodayStatus;
  apptStatus: AppointmentStatus;
  pet: string;
  species: string;
  breed: string;
  age: string;
  sex: string;
  owner: string;
  service: string;
  symptom: string;
  flags: string[];
  weight: string;
  petId: string | null;
  petAvatar: string | null;
  hasRecord: boolean;
  lastVisit: { date: string; reason: string } | null;
  home: { address: string } | null;
}

export interface VetClinicRef {
  clinic_id: string;
  clinic_name: string;
  clinic_slug: string;
  role_at_clinic: string | null;
  is_primary: boolean;
}

export interface VetHome {
  vet: { id: string; full_name: string; avatar_url: string | null } | null;
  clinics: VetClinicRef[];
  selected_clinic: VetClinicRef | null;
  today: {
    now: string;
    mode: "busy" | "end";
    cases: TodayCase[];
    nextId: string | null;
    backlog: { id: string; pet: string; t: string; petId: string | null; apptStatus: AppointmentStatus; text: string }[];
    doneCount: number;
  };
  invites: { clinic_id: string; clinic_name: string; role_at_clinic: string | null }[];
}

export interface VetWeek {
  weekStartIso: string;
  weekLabel: string;
  weekDays: { iso: string; dow: string; dowFull: string; day: number; monthShort: string; isToday: boolean }[];
  appts: {
    id: string;
    iso_date: string;
    time: string;
    status: AppointmentStatus;
    arrived: boolean;
    service_label: string | null;
    pet_id: string | null;
    pet_name: string | null;
    pet_species: string | null;
    pet_avatar_url: string | null;
    walk_in_pet_name: string | null;
    owner_name: string | null;
    walk_in_owner_name: string | null;
  }[];
}

export interface VetProfile {
  vetId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  gender: "female" | "male" | "unspecified";
  licenseNumber: string | null;
  licenseVerified: boolean;
  bio: string | null;
  yearsOfExperience: number | null;
  specialties: string[] | null;
}

/** แฟ้มสัตว์ฝั่งคลินิก/หมอ (อ่านอย่างเดียว) */
export interface StaffPetFile {
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    gender: string | null;
    birth_date: string | null;
    weight_kg: string | null;
    color: string | null;
    is_neutered: boolean | null;
    microchip_id: string | null;
    allergies: string | null;
    chronic_conditions?: string | null;
    avatar_url: string | null;
    owner_name: string | null;
    owner_phone: string | null;
  };
  hidden_history_count?: number;
  medical_records: {
    id: string;
    visit_date: string;
    visit_type: string;
    clinic_name: string | null;
    vet_name: string | null;
    diagnosis: string | null;
    treatment: string | null;
    medications: string | null;
    notes: string | null;
    follow_up_date: string | null;
    is_verified: boolean;
    service_label?: string | null;
  }[];
  measurements: { id: string; measured_at: string; source: string | null; weight_kg: string | null; temperature_c: string | null; height_cm: string | null; body_length_cm: string | null; body_condition_score: number | null; heart_rate_bpm: number | null; notes: string | null }[];
  vaccinations: { id: string; vaccine_name: string; administered_date: string; next_due_date: string | null; clinic_name: string | null; is_verified: boolean }[];
  appointments?: { id: string; scheduled_at: string; status: AppointmentStatus; service_label: string | null; vet_name: string | null }[];
  open_appointment?: {
    id: string;
    scheduled_at: string;
    status: AppointmentStatus;
    service_label: string | null;
    notes_owner: string | null;
    has_record: boolean;
    is_today: boolean;
    case_thread_id: string | null;
  } | null;
}

/** body ของ /api/mobile/auth/signup/clinic — ตรงกับ SignupPayloadSchema ใน petcare/app/actions/clinic-signup.ts */
export interface ClinicSignupPayload {
  account: { email: string; password: string; full_name: string; phone: string };
  clinic: {
    name: string;
    clinic_type: "clinic" | "hospital" | "special";
    description: string;
    license_number: string;
    phone: string | null;
    email: null;
    line_id: string | null;
    website: string | null;
    facebook_url: null;
  };
  address: {
    address_line: string;
    sub_district: string | null;
    district: string;
    province: string;
    postal_code: string | null;
    lat: number;
    lng: number;
  };
  species: { species: string; other?: string }[];
  hours: { day_of_week: number; is_closed: boolean; open_time: string | null; close_time: string | null }[];
  services: { service_name: string; description: null; price_min: null; price_max: null; species: [] }[];
  vets: { full_name: string; license_number: string | null; years_of_experience: number | null; specialties: string[] }[];
  consent_terms: true;
}
