import { useLocalSearchParams } from "expo-router";
import { CaseCompleteForm } from "@/components/staff/CaseCompleteForm";

/** จบเคสจากบัญชีร้าน (คลินิกที่มีหมอคนเดียว — หมอใช้ไอดีร้านร่วม) */
export default function ClinicCompleteCase() {
  const { id, pet, service, hasPet } = useLocalSearchParams<{ id: string; pet?: string; service?: string; hasPet?: string }>();
  return <CaseCompleteForm appointmentId={id} petName={pet ?? ""} service={service ?? null} hasRecord={false} hasPet={hasPet !== "0"} />;
}
