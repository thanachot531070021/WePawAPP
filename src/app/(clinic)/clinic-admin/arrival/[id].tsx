import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { clinicStaffApi } from "@/api/staffEndpoints";
import { AppBar, Button, Card, Checkbox, Chip, ErrorView, Field, LoadingView, Notice, PetAvatar, Screen, SectionTitle, toast, Txt } from "@/components/ui";
import { useClinicRequests } from "@/features/staffQueries";
import { bkkDateKey } from "@/lib/format";

const DURATIONS = [15, 30, 45, 60, 90];

/** เวลาไทยตอนนี้ ปัดขึ้นทีละ 5 นาที → "HH:MM" */
function nowRounded(): string {
  const t = new Date(Date.now() + 7 * 3600_000);
  let m = t.getUTCHours() * 60 + t.getUTCMinutes();
  m = Math.ceil(m / 5) * 5;
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/**
 * น้องมาถึงแล้ว → จัดเวลา + หมอ — scheduleOnArrival() ตัวเดียวกับหน้า
 * /clinic-admin/appointments/new?arrival= ของเว็บ (วันล็อกเป็นวันนี้, ข้อมูลคำขออ่านอย่างเดียว)
 * server ตรวจเวลาทำการ/ตารางเวรหมอเอง — ไม่ผ่านจะแจ้งเหตุผลกลับมา
 */
export default function ArrivalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const { data, isLoading, error } = useClinicRequests();
  const req = data?.requests.find((r) => r.id === id);
  const [time, setTime] = useState(nowRounded());
  const [duration, setDuration] = useState(30);
  const [vetId, setVetId] = useState<string | null>(data?.vets.length === 1 ? data.vets[0].id : null);
  const [startNow, setStartNow] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: () =>
      clinicStaffApi.scheduleArrival(id, {
        scheduled_at_iso: new Date(`${bkkDateKey()}T${time}:00+07:00`).toISOString(),
        duration_minutes: duration,
        vet_id: vetId,
        start_now: startNow,
      }),
    onSuccess: () => {
      toast.success(startNow ? "เข้าห้องตรวจแล้ว" : "จัดคิวแล้ว — เคสขึ้นบอร์ดวันนี้");
      void qc.invalidateQueries({ queryKey: ["clinic"] });
      router.back();
    },
    onError: (e: Error) => setErr(e.message),
  });

  if (isLoading) return <LoadingView />;
  if (error || !req)
    return (
      <Screen header={<AppBar title="น้องมาถึงแล้ว" back />}>
        <ErrorView message={(error as Error)?.message ?? "ไม่พบคำขอนี้ หรือจัดเวลาไปแล้ว"} />
      </Screen>
    );

  return (
    <Screen
      header={<AppBar title="น้องมาถึงแล้ว" subtitle="จัดเวลาและสัตวแพทย์" back />}
      footer={
        <Button
          label={startNow ? "เข้าห้องตรวจเลย" : "จัดเข้าคิว"}
          size="lg"
          full
          loading={m.isPending}
          onPress={() => {
            setErr(null);
            if (!/^\d{2}:\d{2}$/.test(time)) {
              setErr("กรอกเวลาเป็น HH:MM");
              return;
            }
            m.mutate();
          }}
        />
      }
    >
      <Card style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <PetAvatar species={req.pet_species} seed={req.pet_id ?? req.pet_name} url={req.pet_avatar_url} size={48} />
        <View style={{ flex: 1 }}>
          <Txt weight="semibold">{req.pet_name ? `น้อง${req.pet_name}` : "ไม่ระบุสัตว์"}</Txt>
          <Txt size={13} tone="muted">
            {[req.service_label, req.owner_name].filter(Boolean).join(" · ")}
          </Txt>
        </View>
      </Card>
      {err && <Notice tone="danger">{err}</Notice>}
      <SectionTitle>เวลาเริ่ม (วันนี้)</SectionTitle>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <View style={{ width: 110 }}>
          <Field value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" placeholder="HH:MM" />
        </View>
        <Chip label="ตอนนี้" onPress={() => setTime(nowRounded())} />
      </View>
      <SectionTitle>ระยะเวลา</SectionTitle>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {DURATIONS.map((d) => (
          <Chip key={d} label={`${d} นาที`} selected={duration === d} onPress={() => setDuration(d)} />
        ))}
      </View>
      <SectionTitle>สัตวแพทย์</SectionTitle>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Chip label="ยังไม่ระบุ" selected={!vetId} onPress={() => setVetId(null)} />
        {data!.vets.map((v) => (
          <Chip key={v.id} label={v.full_name} selected={vetId === v.id} onPress={() => setVetId(v.id)} />
        ))}
      </View>
      <Checkbox checked={startNow} onChange={setStartNow}>
        เริ่มตรวจเลย (ไม่ต้องรอคิว)
      </Checkbox>
    </Screen>
  );
}
