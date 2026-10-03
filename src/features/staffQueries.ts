import { useQuery } from "@tanstack/react-query";
import { meApi } from "@/api/endpoints";
import { clinicStaffApi, vetStaffApi } from "@/api/staffEndpoints";
import { useSession } from "@/state/session";

/** hook ข้อมูลฝั่งคลินิก/หมอ — คีย์ขึ้นต้น ["clinic"] / ["vet"] (สลับคลินิกของหมอ = invalidate ["vet"] ทั้งชุด) */

export const staffKeys = {
  me: ["staff", "me"] as const,
  overview: ["clinic", "overview"] as const,
  requests: ["clinic", "requests"] as const,
  reviews: ["clinic", "reviews"] as const,
  profile: ["clinic", "profile"] as const,
  services: ["clinic", "services"] as const,
  vets: ["clinic", "vets"] as const,
  clinicPet: (id: string) => ["clinic", "pet", id] as const,
  vetHome: (clinic: string | null) => ["vet", "home", clinic] as const,
  vetWeek: (clinic: string | null, start: string | null) => ["vet", "week", clinic, start] as const,
  vetAvailability: (clinic: string | null) => ["vet", "availability", clinic] as const,
  vetProfile: ["vet", "profile"] as const,
  vetPet: (id: string) => ["vet", "pet", id] as const,
};

/** /api/mobile/me แบบเต็ม (must_change_password, solo_vet, vet_clinics) */
export const useStaffMe = () =>
  useQuery({
    queryKey: staffKeys.me,
    queryFn: () =>
      meApi.get() as Promise<
        Awaited<ReturnType<typeof meApi.get>> & {
          must_change_password: boolean;
          solo_vet: { id: string; full_name: string } | null;
          vet: { id: string; full_name: string; account_status: string } | null;
        }
      >,
  });

export const useClinicOverview = () =>
  useQuery({ queryKey: staffKeys.overview, queryFn: clinicStaffApi.overview, refetchInterval: 60_000 });
export const useClinicRequests = () =>
  useQuery({ queryKey: staffKeys.requests, queryFn: clinicStaffApi.requests, refetchInterval: 60_000 });
export const useClinicReviews = () =>
  useQuery({ queryKey: staffKeys.reviews, queryFn: async () => (await clinicStaffApi.reviews()).items });
export const useClinicProfile = () =>
  useQuery({ queryKey: staffKeys.profile, queryFn: async () => (await clinicStaffApi.profile()).clinic });
export const useClinicServices = () =>
  useQuery({ queryKey: staffKeys.services, queryFn: async () => (await clinicStaffApi.services()).items });
export const useClinicVets = () =>
  useQuery({ queryKey: staffKeys.vets, queryFn: async () => (await clinicStaffApi.vets()).items });
export const useClinicPetFile = (id: string) =>
  useQuery({ queryKey: staffKeys.clinicPet(id), queryFn: () => clinicStaffApi.petFile(id), enabled: !!id });

export function useVetHome() {
  const clinic = useSession((s) => s.vetClinicId);
  return useQuery({ queryKey: staffKeys.vetHome(clinic), queryFn: vetStaffApi.home, refetchInterval: 60_000 });
}
export function useVetWeek(start: string | null) {
  const clinic = useSession((s) => s.vetClinicId);
  return useQuery({ queryKey: staffKeys.vetWeek(clinic, start), queryFn: () => vetStaffApi.week(start ?? undefined) });
}
export function useVetAvailability() {
  const clinic = useSession((s) => s.vetClinicId);
  return useQuery({ queryKey: staffKeys.vetAvailability(clinic), queryFn: vetStaffApi.availability });
}
export const useVetProfile = () =>
  useQuery({ queryKey: staffKeys.vetProfile, queryFn: async () => (await vetStaffApi.profile()).profile });
export const useVetPetFile = (id: string) =>
  useQuery({ queryKey: staffKeys.vetPet(id), queryFn: () => vetStaffApi.petFile(id), enabled: !!id });
