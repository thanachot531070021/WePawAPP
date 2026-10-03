import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Link2, UserPlus, Users } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { clinicStaffApi } from "@/api/staffEndpoints";
import { ActivationLinkCard } from "@/components/staff/ActivationLinkCard";
import { AppBar, Avatar, Button, Card, confirmAsync, EmptyState, ErrorView, LoadingView, Pill, Screen, Sheet, toast, Txt } from "@/components/ui";
import { useClinicOverview, useClinicVets } from "@/features/staffQueries";
import { useColors } from "@/theme";

const LINK_LABEL: Record<string, string> = {
  active: "ทำงานอยู่",
  provisional: "รอหมอตอบรับคำเชิญ",
  requested: "หมอขอเข้าคลินิก",
};

/** สัตวแพทย์ของคลินิก — เพิ่ม / ส่งลิงก์เปิดใช้งานใหม่ / อนุมัติคำขอ / เอาออก (createVet, regenerateVetActivationToken, approveClinicRequest, endVetClinicLink ของเว็บ) */
export default function ClinicVets() {
  const c = useColors();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch, isRefetching } = useClinicVets();
  const { data: overview } = useClinicOverview();
  const [link, setLink] = useState<{ name: string; path: string } | null>(null);
  const relink = useMutation({
    mutationFn: (v: { id: string; name: string }) => clinicStaffApi.vetActivationLink(v.id).then((r) => ({ name: v.name, path: r.data.activationPath })),
    onSuccess: setLink,
    onError: (e: Error) => toast.error(e.message),
  });
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
                label={pendingAccount(v) ? "รอหมอเปิดใช้บัญชี" : (LINK_LABEL[v.link_status] ?? v.link_status)}
                color={v.link_status === "active" ? c.brandSoftText : c.warnText}
                bg={v.link_status === "active" ? c.brandSoft : c.warnSoft}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {pendingAccount(v) && (
                <Button
                  label="ส่งลิงก์เปิดใช้งาน"
                  icon={Link2}
                  size="sm"
                  loading={relink.isPending && relink.variables?.id === v.vet_id}
                  onPress={() => relink.mutate({ id: v.vet_id, name: v.full_name })}
                />
              )}
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
      <Button label="เพิ่มสัตวแพทย์" icon={UserPlus} full onPress={() => router.push("/clinic-admin/add-vet")} testID="open-add-vet" />
      <Sheet open={!!link} onClose={() => setLink(null)} title="ลิงก์เปิดใช้งานใหม่">
        <Txt tone="muted">ลิงก์เดิมใช้ไม่ได้แล้ว — ส่งลิงก์นี้ให้หมอแทน</Txt>
        {link && <ActivationLinkCard vetName={link.name} clinicName={overview?.clinic.name ?? ""} path={link.path} />}
      </Sheet>
    </Screen>
  );
}

/** หมอที่คลินิกเพิ่มแต่ยังไม่ได้ตั้งรหัสผ่าน (account pending) — ส่งลิงก์ใหม่ได้ */
function pendingAccount(v: { link_status: string; account_status: string }) {
  return v.link_status === "provisional" && v.account_status === "pending";
}
