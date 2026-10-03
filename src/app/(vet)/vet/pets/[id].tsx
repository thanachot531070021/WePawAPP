import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { MessageCircle, Stethoscope } from "lucide-react-native";
import { View } from "react-native";
import { caseApi } from "@/api/staffEndpoints";
import { StaffPetFileView } from "@/components/staff/StaffPetFileView";
import { AppBar, Button, Card, ErrorView, LoadingView, Screen, toast, Txt } from "@/components/ui";
import { useVetPetFile } from "@/features/staffQueries";
import { formatDateShort, formatTime } from "@/lib/format";
import { toneColors, toneOf } from "@/shared/apptTone";
import { useColors } from "@/theme";

/** แฟ้มสัตว์ฝั่งหมอ — = MobileVetCaseRecord ของเว็บ (ประวัติทั้งหมด + นัดที่กำลังตรวจ + ปุ่มจบเคส) */
export default function VetPetFile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch, isRefetching } = useVetPetFile(id);
  const open = data?.open_appointment ?? null;

  const start = useMutation({
    mutationFn: () => caseApi.setStatus(open!.id, "in_progress"),
    onSuccess: () => {
      toast.success("เริ่มตรวจแล้ว");
      void qc.invalidateQueries({ queryKey: ["vet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const chat = useMutation({
    mutationFn: async () => open!.case_thread_id ?? (await caseApi.openCaseThread(open!.id)).data.threadId,
    onSuccess: (threadId) => router.push(`/chat/${threadId}`),
    onError: (e: Error) => toast.error(e.message),
  });

  const openCard =
    open && data ? (
      <Card style={{ gap: 10, borderWidth: 2, borderColor: toneOf(open.status).solid }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Stethoscope size={20} color={toneColors(toneOf(open.status), c.isDark).ink} />
          <View style={{ flex: 1 }}>
            <Txt weight="semibold">{open.service_label ?? "นัดหมาย"}</Txt>
            <Txt size={13} tone="muted">
              {open.is_today ? "วันนี้" : formatDateShort(open.scheduled_at)} · {formatTime(open.scheduled_at)} น. · {toneOf(open.status).label}
            </Txt>
          </View>
        </View>
        {open.notes_owner && <Txt size={13.5}>อาการที่แจ้ง: {open.notes_owner}</Txt>}
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {open.status !== "in_progress" && <Button label="เริ่มตรวจ" size="sm" loading={start.isPending} onPress={() => start.mutate()} />}
          <Button
            label="จบเคส"
            size="sm"
            variant={open.status === "in_progress" ? "primary" : "outline"}
            onPress={() =>
              router.push({
                pathname: "/vet/complete/[id]",
                params: { id: open.id, pet: data.pet.name, service: open.service_label ?? "", hasRecord: open.has_record ? "1" : "0", hasPet: "1" },
              })
            }
          />
          <Button label="แชทเคส" icon={MessageCircle} size="sm" variant="outline" loading={chat.isPending} onPress={() => chat.mutate()} />
        </View>
      </Card>
    ) : null;

  return (
    <Screen header={<AppBar title={data?.pet.name ?? "แฟ้มสัตว์"} subtitle="แฟ้มเคส" back />} refreshing={isRefetching} onRefresh={refetch}>
      {isLoading ? (
        <LoadingView />
      ) : error || !data ? (
        <ErrorView message={(error as Error)?.message ?? "เปิดแฟ้มนี้ไม่ได้ — หมอเห็นได้เฉพาะสัตว์ที่มีนัดในคลินิกที่สังกัด"} onRetry={refetch} />
      ) : (
        <StaffPetFileView data={data} top={openCard} />
      )}
    </Screen>
  );
}
