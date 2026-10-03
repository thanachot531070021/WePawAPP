import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { UserPlus, Users } from "lucide-react-native";
import { View } from "react-native";
import { WEB_BASE_URL } from "@/api/config";
import { clinicStaffApi } from "@/api/staffEndpoints";
import { AppBar, Avatar, Button, Card, confirmAsync, EmptyState, ErrorView, LoadingView, Pill, Screen, toast, Txt } from "@/components/ui";
import { useClinicVets } from "@/features/staffQueries";
import { useColors } from "@/theme";

const LINK_LABEL: Record<string, string> = {
  active: "ทำงานอยู่",
  provisional: "รอหมอตอบรับคำเชิญ",
  requested: "หมอขอเข้าคลินิก",
};

/** สัตวแพทย์ของคลินิก — อนุมัติคำขอ / เอาออก (approveClinicRequest, endVetClinicLink ของเว็บ) · เพิ่มหมอใหม่ทำบนเว็บ */
export default function ClinicVets() {
  const c = useColors();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch, isRefetching } = useClinicVets();
  const done = (msg: string) => {
    toast.success(msg);
    void qc.invalidateQueries({ queryKey: ["clinic"] });
  };
  const approve = useMutation({ mutationFn: clinicStaffApi.approveVet, onSuccess: () => done("อนุมัติแล้ว"), onError: (e: Error) => toast.error(e.message) });
  const remove = useMutation({
    mutationFn: (id: string) => clinicStaffApi.removeVet(id),
    onSuccess: () => done("เอาหมอออกจากคลินิกแล้ว — ประวัติเคสยังอยู่"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Screen header={<AppBar title="สัตวแพทย์" back />} refreshing={isRefetching} onRefresh={refetch}>
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={(error as Error).message} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyState icon={Users} title="ยังไม่มีสัตวแพทย์" />
      ) : (
        data.map((v) => (
          <Card key={v.vet_id} style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <Avatar url={v.avatar_url} name={v.full_name} size={46} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt weight="semibold">{v.full_name}</Txt>
                <Txt size={13} tone="muted">
                  {[v.role_label, v.is_primary ? "คลินิกหลัก" : null, v.link_status === "active" ? `วันนี้ ${v.appointments_today} นัด` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </Txt>
              </View>
              <Pill
                label={LINK_LABEL[v.link_status] ?? v.link_status}
                color={v.link_status === "active" ? c.brandSoftText : c.warnText}
                bg={v.link_status === "active" ? c.brandSoft : c.warnSoft}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {v.link_status === "requested" && (
                <Button label="อนุมัติ" size="sm" loading={approve.isPending} onPress={() => approve.mutate(v.vet_id)} />
              )}
              <Button
                label={v.link_status === "active" ? "เอาออกจากคลินิก" : "ยกเลิก"}
                size="sm"
                variant="dangerOutline"
                onPress={async () => {
                  if (await confirmAsync(`เอา ${v.full_name} ออก?`, "หมอจะไม่เห็นงานของคลินิกนี้อีก ประวัติเคสที่ผ่านมายังอยู่", "เอาออก"))
                    remove.mutate(v.vet_id);
                }}
              />
            </View>
          </Card>
        ))
      )}
      <Button label="เพิ่มสัตวแพทย์บนเว็บ" icon={UserPlus} variant="outline" full onPress={() => WebBrowser.openBrowserAsync(`${WEB_BASE_URL}/clinic-admin/vets/new`)} />
    </Screen>
  );
}
