import { Inbox } from "lucide-react-native";
import { RequestCard } from "@/components/staff/RequestCard";
import { AppBar, EmptyState, ErrorView, LoadingView, Screen } from "@/components/ui";
import { useClinicRequests } from "@/features/staffQueries";

/** คำขอจองคิว — = หน้า /clinic-admin/appointments/requests ของเว็บ */
export default function ClinicRequests() {
  const { data, isLoading, error, refetch, isRefetching } = useClinicRequests();
  const waiting = (data?.requests ?? []).filter((r) => r.status === "requested").length;
  const arriving = (data?.requests ?? []).filter((r) => r.status === "accepted").length;
  const sub = [waiting ? `${waiting} คำขอรอกดรับ` : null, arriving ? `${arriving} รายการรอสัตว์มาส่ง` : null].filter(Boolean).join(" · ");
  return (
    <Screen header={<AppBar title="คำขอจองคิว" subtitle={sub || null} back />} refreshing={isRefetching} onRefresh={refetch}>
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={(error as Error).message} onRetry={refetch} />
      ) : !data?.requests.length ? (
        <EmptyState icon={Inbox} title="ไม่มีคำขอจองที่รออยู่" />
      ) : (
        data.requests.map((r) => <RequestCard key={r.id} req={r} vets={data.vets} />)
      )}
    </Screen>
  );
}
