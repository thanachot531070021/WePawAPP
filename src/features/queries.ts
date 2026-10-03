import { useQuery } from "@tanstack/react-query";
import {
  appointmentApi,
  chatApi,
  clinicApi,
  communityApi,
  meApi,
  noteApi,
  notificationApi,
  petApi,
  type ClinicSearch,
} from "@/api/endpoints";
import { qk } from "@/lib/queryClient";

/** hook ดึงข้อมูลทั้งหมดของแอป — หน้าจอเรียกผ่านไฟล์นี้เท่านั้น ไม่ fetch เอง */

export const useMe = () => useQuery({ queryKey: qk.me, queryFn: meApi.get });
export const usePets = () => useQuery({ queryKey: qk.pets, queryFn: async () => (await petApi.list()).items });
export const usePet = (id: string) => useQuery({ queryKey: qk.pet(id), queryFn: () => petApi.detail(id), enabled: !!id });
export const usePetShares = (id: string) =>
  useQuery({ queryKey: qk.petShares(id), queryFn: () => petApi.shares(id), enabled: !!id });

export const useAppointments = (range: "upcoming" | "past") =>
  useQuery({ queryKey: qk.appointments(range), queryFn: async () => (await appointmentApi.list(range)).items });
export const useAppointment = (id: string) =>
  useQuery({ queryKey: qk.appointment(id), queryFn: () => appointmentApi.detail(id), enabled: !!id });

export const useClinics = (params: ClinicSearch) =>
  useQuery({ queryKey: qk.clinics(params), queryFn: async () => (await clinicApi.search(params)).items });
export const useClinic = (slug: string) =>
  useQuery({ queryKey: qk.clinic(slug), queryFn: () => clinicApi.detail(slug), enabled: !!slug });
export const useBookingData = (clinicId: string | undefined) =>
  useQuery({
    queryKey: qk.bookingData(clinicId ?? ""),
    queryFn: () => clinicApi.bookingData(clinicId!),
    enabled: !!clinicId,
  });
export const useFavorites = () =>
  useQuery({ queryKey: qk.favorites, queryFn: async () => (await clinicApi.favorites()).items });

export const useNotifications = () =>
  useQuery({ queryKey: qk.notifications, queryFn: notificationApi.list, refetchInterval: 60_000 });

export const useChatThreads = () =>
  useQuery({ queryKey: qk.chatThreads, queryFn: chatApi.threads, refetchInterval: 30_000 });
export const useChatUnread = () =>
  useQuery({ queryKey: qk.chatUnread, queryFn: async () => (await chatApi.unread()).count, refetchInterval: 30_000 });

export const useNotes = () => useQuery({ queryKey: qk.notes, queryFn: async () => (await noteApi.list()).items });

export const useCommunity = (filter: string, sort: "recent" | "top") =>
  useQuery({ queryKey: qk.community(filter, sort), queryFn: async () => (await communityApi.list(filter, sort)).items });
export const useQuestion = (id: string) =>
  useQuery({ queryKey: qk.question(id), queryFn: async () => (await communityApi.detail(id)).question, enabled: !!id });
