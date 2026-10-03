import { useLocalSearchParams } from "expo-router";
import { CaseCompleteForm } from "@/components/staff/CaseCompleteForm";

/** จบเคส + เวชระเบียน — = หน้า /vet/appointments/[id]/complete ของเว็บ */
export default function VetCompleteCase() {
  const { id, pet, service, hasRecord, hasPet } = useLocalSearchParams<{
    id: string;
    pet?: string;
    service?: string;
    hasRecord?: string;
    hasPet?: string;
  }>();
  return (
    <CaseCompleteForm
      appointmentId={id}
      petName={pet ?? ""}
      service={service || null}
      hasRecord={hasRecord === "1"}
      hasPet={hasPet !== "0"}
    />
  );
}
