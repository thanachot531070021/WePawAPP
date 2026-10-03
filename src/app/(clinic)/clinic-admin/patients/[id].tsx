import { useLocalSearchParams } from "expo-router";
import { StaffPetFileView } from "@/components/staff/StaffPetFileView";
import { AppBar, ErrorView, LoadingView, Screen } from "@/components/ui";
import { useClinicPetFile } from "@/features/staffQueries";

/** แฟ้มสัตว์ฝั่งคลินิก — ข้อมูลตามกติกา visibility เดียวกับ /clinic-admin/patients/[id] ของเว็บ */
export default function ClinicPatient() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch, isRefetching } = useClinicPetFile(id);
  return (
    <Screen header={<AppBar title={data?.pet.name ?? "แฟ้มสัตว์"} subtitle="แฟ้มสัตว์ของคลินิก" back />} refreshing={isRefetching} onRefresh={refetch}>
      {isLoading ? (
        <LoadingView />
      ) : error || !data ? (
        <ErrorView message={(error as Error)?.message ?? "ไม่พบแฟ้มสัตว์"} onRetry={refetch} />
      ) : (
        <StaffPetFileView data={data} />
      )}
    </Screen>
  );
}
