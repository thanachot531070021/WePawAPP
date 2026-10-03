import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { CalendarCheck2, Home, Inbox } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import type { OpsCase } from "@/api/staffTypes";
import { caseApi, clinicStaffApi } from "@/api/staffEndpoints";
import { TopActions } from "@/components/TopActions";
import { CLINIC_CASE_TONE } from "@/components/staff/caseTones";
import { opsTime } from "@/components/staff/opsFormat";
import { RequestCard } from "@/components/staff/RequestCard";
import { StatusPill } from "@/components/staff/StatusDot";
import {
  AppBar,
  Button,
  Card,
  confirmAsync,
  EmptyState,
  ErrorView,
  LoadingView,
  PetAvatar,
  Screen,
  Segmented,
  toast,
  Txt,
} from "@/components/ui";
import { useClinicOverview, useClinicRequests } from "@/features/staffQueries";
import { useColors } from "@/theme";

/**
 * แท็บนัดของคลินิก — เคสวันนี้ (buildOpsData) + คำขอจอง (loadBookingRequests)
 * ปุ่ม "เริ่มตรวจ / จบเคส" มีเฉพาะคลินิกที่มีหมอคนเดียว (หมอใช้ไอดีร้านร่วม) — มีหมอหลายคนให้หมอทำจากบัญชีตัวเอง
 */
export default function ClinicAppointments() {
  const [tab, setTab] = useState<"today" | "requests">("today");
  const overview = useClinicOverview();
  const requests = useClinicRequests();
  const waitingCount = (requests.data?.requests ?? []).filter((r) => r.status === "requested").length;

  return (
    <Screen
      inTabs
      header={<AppBar title="ตารางงานคลินิก" subtitle={overview.data?.ops ? `วันนี้ · ${overview.data.ops.dateLabel}` : null} right={<TopActions />} />}
      refreshing={overview.isRefetching || requests.isRefetching}
      onRefresh={() => {
        void overview.refetch();
        void requests.refetch();
      }}
    >
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "today", label: "เคสวันนี้", count: overview.data?.ops?.cases.length },
          { value: "requests", label: "คำขอจอง", count: waitingCount || undefined },
        ]}
      />
      {tab === "today" ? <TodayCases /> : <RequestsList />}
    </Screen>
  );
}

function TodayCases() {
  const c = useColors();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useClinicOverview();
  const solo = !!data?.solo_vet;
  const vetName = (id: string | null) => data?.ops?.vets.find((v) => v.id === id)?.nick ?? null;

  const act = useMutation({
    mutationFn: async ({ kind, c: k }: { kind: "arrived" | "start" | "noshow"; c: OpsCase }) => {
      if (kind === "arrived") return clinicStaffApi.markArrived(k.id);
      if (kind === "start") return caseApi.setStatus(k.id, "in_progress");
      return caseApi.setStatus(k.id, "no_show");
    },
    onSuccess: (_d, v) => {
      toast.success(v.kind === "arrived" ? "เช็คอินแล้ว — เคสขึ้นบอร์ด" : v.kind === "start" ? "เริ่มตรวจแล้ว" : "บันทึกว่าไม่มาตามนัด");
      void qc.invalidateQueries({ queryKey: ["clinic"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView message={(error as Error).message} onRetry={refetch} />;
  const cases = [...(data?.ops?.cases ?? [])].sort((a, b) => a.time - b.time);
  if (!cases.length) return <EmptyState icon={CalendarCheck2} title="วันนี้ยังไม่มีเคส" body="คำขอที่รับแล้วจะขึ้นที่นี่เมื่อน้องมาถึง" />;

  return (
    <>
      {cases.map((k) => {
        const tone = CLINIC_CASE_TONE[k.status] ?? CLINIC_CASE_TONE.done;
        return (
          <Card
            key={k.id}
            onPress={k.pet.id ? () => router.push(`/clinic-admin/patients/${k.pet.id}`) : undefined}
            style={{ gap: 10, opacity: k.status === "done" ? 0.75 : 1 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 52, alignItems: "center" }}>
                <Txt size={17} weight="bold">
                  {opsTime(k.time)}
                </Txt>
              </View>
              <PetAvatar species={k.pet.species} seed={k.pet.id ?? k.pet.name} url={k.pet.avatar} size={42} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt weight="semibold" numberOfLines={1}>
                  {k.pet.name}
                </Txt>
                <Txt size={13} tone="muted" numberOfLines={1}>
                  {[k.service, vetName(k.vetId)].filter(Boolean).join(" · ")}
                </Txt>
              </View>
              <StatusPill tone={tone} />
            </View>
            {k.home && (
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                <Home size={14} color={c.info} />
                <Txt size={12.5} color={c.info}>
                  เยี่ยมบ้าน
                </Txt>
              </View>
            )}
            {k.note && (
              <Txt size={13} tone="muted" numberOfLines={2}>
                {k.note}
              </Txt>
            )}
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {k.status === "awaiting" && !k.home && (
                <>
                  <Button label="น้องมาถึงแล้ว" size="sm" loading={act.isPending} onPress={() => act.mutate({ kind: "arrived", c: k })} />
                  <Button
                    label="ไม่มาตามนัด"
                    size="sm"
                    variant="ghost"
                    onPress={async () => {
                      if (await confirmAsync("บันทึกว่าไม่มาตามนัด?", `น้อง${k.pet.name} · ${opsTime(k.time)}`, "บันทึก")) act.mutate({ kind: "noshow", c: k });
                    }}
                  />
                </>
              )}
              {solo && k.status === "waiting" && (
                <Button label="เริ่มตรวจ" size="sm" loading={act.isPending} onPress={() => act.mutate({ kind: "start", c: k })} />
              )}
              {solo && (k.status === "examining" || k.status === "waiting") && (
                <Button
                  label="จบเคส"
                  size="sm"
                  variant={k.status === "examining" ? "primary" : "outline"}
                  onPress={() =>
                    router.push({
                      pathname: "/clinic-admin/complete/[id]",
                      params: { id: k.id, pet: k.pet.name, service: k.service, hasPet: k.pet.id ? "1" : "0" },
                    })
                  }
                />
              )}
            </View>
          </Card>
        );
      })}
    </>
  );
}

function RequestsList() {
  const { data, isLoading, error, refetch } = useClinicRequests();
  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView message={(error as Error).message} onRetry={refetch} />;
  const list = data?.requests ?? [];
  if (!list.length) return <EmptyState icon={Inbox} title="ไม่มีคำขอจองที่รออยู่" />;
  return (
    <>
      {list.map((r) => (
        <RequestCard key={r.id} req={r} vets={data!.vets} />
      ))}
    </>
  );
}
