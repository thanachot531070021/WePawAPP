import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { AlertTriangle, CalendarCheck2, Home, MailOpen } from "lucide-react-native";
import { View } from "react-native";
import type { TodayCase } from "@/api/staffTypes";
import { caseApi, vetStaffApi } from "@/api/staffEndpoints";
import { TopActions } from "@/components/TopActions";
import { VET_CASE_TONE } from "@/components/staff/caseTones";
import { StatusPill } from "@/components/staff/StatusDot";
import { VetClinicSwitcher } from "@/components/staff/VetClinicSwitcher";
import { AppBar, Button, Card, EmptyState, ErrorView, LoadingView, PetAvatar, Screen, SectionTitle, toast, Txt } from "@/components/ui";
import { useVetHome } from "@/features/staffQueries";
import { radius, useColors } from "@/theme";

function goComplete(k: { id: string; pet: string; service: string; hasRecord: boolean; petId: string | null }) {
  router.push({
    pathname: "/vet/complete/[id]",
    params: { id: k.id, pet: k.pet, service: k.service, hasRecord: k.hasRecord ? "1" : "0", hasPet: k.petId ? "1" : "0" },
  });
}

/** แท็บ "วันนี้" ของหมอ — ข้อมูลจาก getVetTodayData() ชุดเดียวกับ VetTodayMobile ของเว็บ */
export default function VetToday() {
  const c = useColors();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch, isRefetching } = useVetHome();

  const start = useMutation({
    mutationFn: (id: string) => caseApi.setStatus(id, "in_progress"),
    onSuccess: () => {
      toast.success("เริ่มตรวจแล้ว");
      void qc.invalidateQueries({ queryKey: ["vet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const invite = useMutation({
    mutationFn: ({ clinicId, action }: { clinicId: string; action: "accept" | "decline" }) => vetStaffApi.respondInvite(clinicId, action),
    onSuccess: (_d, v) => {
      toast.success(v.action === "accept" ? "เข้าร่วมคลินิกแล้ว" : "ปฏิเสธคำเชิญแล้ว");
      void qc.invalidateQueries({ queryKey: ["vet"] });
      void qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const header = (
    <AppBar
      title="งานวันนี้"
      subtitle={data?.selected_clinic?.clinic_name ?? (data ? "ยังไม่ได้ผูกคลินิก" : null)}
      right={<TopActions />}
    />
  );
  if (isLoading)
    return (
      <Screen inTabs header={header} scroll={false}>
        <LoadingView />
      </Screen>
    );
  if (error || !data)
    return (
      <Screen inTabs header={header}>
        <ErrorView message={(error as Error)?.message ?? "โหลดไม่สำเร็จ"} onRetry={refetch} />
      </Screen>
    );

  const { today } = data;
  const next = today.cases.find((k) => k.id === today.nextId);
  const total = today.cases.length;

  const caseCard = (k: TodayCase, highlight = false) => {
    const tone = VET_CASE_TONE[k.status] ?? VET_CASE_TONE.done;
    return (
      <Card
        key={k.id}
        onPress={k.petId ? () => router.push(`/vet/pets/${k.petId}`) : undefined}
        style={{ gap: 10, borderWidth: highlight ? 2 : 1, borderColor: highlight ? c.brand : c.border, opacity: k.status === "done" ? 0.7 : 1 }}
      >
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Txt size={17} weight="bold" style={{ width: 50 }}>
            {k.t}
          </Txt>
          <PetAvatar species={k.species} seed={k.petId ?? k.pet} url={k.petAvatar} size={44} />
          <View style={{ flex: 1, gap: 1 }}>
            <Txt weight="semibold" numberOfLines={1}>
              {k.pet}
            </Txt>
            <Txt size={12.5} tone="muted" numberOfLines={1}>
              {[k.breed, k.age, k.sex, k.weight].filter(Boolean).join(" · ")}
            </Txt>
            <Txt size={12.5} tone="muted" numberOfLines={1}>
              {[k.service, k.owner].filter(Boolean).join(" · ")}
            </Txt>
          </View>
          <StatusPill tone={tone} />
        </View>
        {!!k.symptom && (
          <View style={{ padding: 10, borderRadius: radius.md, backgroundColor: c.surfaceAlt }}>
            <Txt size={13.5}>{k.symptom}</Txt>
          </View>
        )}
        {k.flags.length > 0 && (
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <AlertTriangle size={14} color={c.danger} />
            <Txt size={12.5} tone="danger" numberOfLines={2} style={{ flex: 1 }}>
              {k.flags.join(" · ")}
            </Txt>
          </View>
        )}
        {k.home && (
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <Home size={14} color={c.info} />
            <Txt size={12.5} color={c.info} numberOfLines={2} style={{ flex: 1 }}>
              {k.home.address}
            </Txt>
          </View>
        )}
        {k.status !== "done" && k.status !== "awaiting" && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            {k.status !== "examining" && (
              <Button label="เริ่มตรวจ" size="sm" loading={start.isPending && start.variables === k.id} onPress={() => start.mutate(k.id)} />
            )}
            <Button
              label="จบเคส"
              size="sm"
              variant={k.status === "examining" ? "primary" : "outline"}
              onPress={() => goComplete({ id: k.id, pet: k.pet, service: k.service, hasRecord: k.hasRecord, petId: k.petId })}
            />
          </View>
        )}
      </Card>
    );
  };

  return (
    <Screen inTabs header={header} refreshing={isRefetching} onRefresh={refetch}>
      <VetClinicSwitcher clinics={data.clinics} selected={data.selected_clinic} />

      {data.invites.map((inv) => (
        <Card key={inv.clinic_id} style={{ gap: 10, borderColor: c.brand }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <MailOpen size={20} color={c.brand} />
            <Txt weight="semibold" style={{ flex: 1 }}>
              {inv.clinic_name} เชิญคุณเข้าร่วมคลินิก
            </Txt>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button label="ตอบรับ" size="sm" loading={invite.isPending} onPress={() => invite.mutate({ clinicId: inv.clinic_id, action: "accept" })} />
            <Button label="ปฏิเสธ" size="sm" variant="ghost" onPress={() => invite.mutate({ clinicId: inv.clinic_id, action: "decline" })} />
          </View>
        </Card>
      ))}

      {!data.selected_clinic ? (
        <EmptyState icon={CalendarCheck2} title="ยังไม่ได้ผูกคลินิก" body="เมื่อคลินิกเชิญและคุณตอบรับ งานของวันนี้จะขึ้นที่นี่" />
      ) : total === 0 ? (
        <EmptyState icon={CalendarCheck2} title="วันนี้ยังไม่มีเคส" />
      ) : (
        <>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Txt size={13} tone="muted">
                เสร็จแล้ว
              </Txt>
              <Txt size={22} weight="bold">
                {today.doneCount}/{total} เคส
              </Txt>
            </View>
            <Txt size={13} tone="muted">
              ตอนนี้ {today.now}
            </Txt>
          </Card>
          {next && (
            <>
              <SectionTitle>เคสถัดไป</SectionTitle>
              {caseCard(next, true)}
            </>
          )}
          <SectionTitle>ทั้งหมดวันนี้</SectionTitle>
          {today.cases.filter((k) => k.id !== next?.id).map((k) => caseCard(k))}
        </>
      )}

      {today.backlog.length > 0 && (
        <>
          <SectionTitle>เคสค้างที่ยังไม่ปิด</SectionTitle>
          <Card padded={false}>
            {today.backlog.map((b, i) => (
              <View key={b.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}>
                <View style={{ flex: 1 }}>
                  <Txt weight="medium">{b.pet}</Txt>
                  <Txt size={12.5} tone="muted">
                    {b.text}
                  </Txt>
                </View>
                <Button
                  label="ปิดเคส"
                  size="sm"
                  variant="outline"
                  onPress={() => goComplete({ id: b.id, pet: b.pet, service: "", hasRecord: false, petId: b.petId })}
                />
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}
