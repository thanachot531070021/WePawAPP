import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  AlertTriangle,
  CalendarPlus,
  Pencil,
  QrCode,
  Ruler,
  Scale,
  Share2,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Trash2,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { petApi } from "@/api/endpoints";
import type { PetDetail } from "@/api/types";
import { WeightChart } from "@/components/WeightChart";
import {
  AppBar,
  Button,
  Card,
  confirmAsync,
  EmptyState,
  ErrorView,
  IconButton,
  LoadingView,
  Notice,
  PetAvatar,
  Pill,
  Screen,
  SectionTitle,
  Sheet,
  toast,
  Txt,
} from "@/components/ui";
import { usePet } from "@/features/queries";
import { formatDateShort, formatTime } from "@/lib/format";
import { qk } from "@/lib/queryClient";
import { toneColors, toneOf } from "@/shared/apptTone";
import { estimateHumanAge, formatPetAge } from "@/shared/petAge";
import { derivePetStatus } from "@/shared/petStatus";
import { GENDER_LABEL, getSpeciesLabel, type PetSpecies } from "@/shared/species";
import { usePetStatusTone } from "@/components/PetCard";
import { radius, useColors } from "@/theme";

/** ค่าตาม CHECK ของ pet_medical_records.visit_type */
const VISIT_TYPE: Record<string, string> = {
  checkup: "ตรวจสุขภาพ",
  vaccination: "ฉีดวัคซีน",
  illness: "เจ็บป่วย",
  surgery: "ผ่าตัด",
  dental: "ทันตกรรม",
  grooming: "อาบน้ำตัดขน",
  other: "อื่น ๆ",
};

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, minWidth: "30%" }}>
      <Txt size={12} tone="faint">
        {label}
      </Txt>
      <Txt size={14.5} weight="medium" numberOfLines={1}>
        {value}
      </Txt>
    </View>
  );
}

/** แฟ้มน้อง — = MobilePetProfile ของเว็บ (hero, สถานะ, แพ้ยา, ค่าวัด, วัคซีน, ประวัติ, นัด, QR) */
export default function PetProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const { data, isLoading, error, refetch, isRefetching } = usePet(id);
  const [qrOpen, setQrOpen] = useState(false);

  if (isLoading) return <LoadingView />;
  if (error || !data)
    return (
      <Screen header={<AppBar title="แฟ้มสัตว์เลี้ยง" back />}>
        <ErrorView message={(error as Error)?.message ?? "ไม่พบสัตว์เลี้ยง"} onRetry={refetch} />
      </Screen>
    );

  const { pet, access_role } = data;
  const canEdit = access_role === "owner" || access_role === "co_owner";
  const isOwner = access_role === "owner";
  const nextVax = data.vaccinations
    .filter((v) => v.next_due_date)
    .sort((a, b) => a.next_due_date!.localeCompare(b.next_due_date!))[0];
  const status = derivePetStatus({
    next_vaccine_due_at: nextVax?.next_due_date ?? null,
    next_vaccine_name: nextVax?.vaccine_name ?? null,
    vaccine_count: String(data.vaccinations.length),
    last_visit_at: data.medical_records[0]?.visit_date ?? null,
  });
  const human = estimateHumanAge(pet.species as PetSpecies, pet.birth_date);

  return (
    <Screen
      header={
        <AppBar
          title={pet.name}
          subtitle={access_role === "viewer" ? "ดูอย่างเดียว" : access_role === "co_owner" ? "ดูแลร่วม" : null}
          back
          right={
            <>
              <IconButton icon={QrCode} label="QR ประจำตัวน้อง" onPress={() => setQrOpen(true)} />
              {isOwner && <IconButton icon={Share2} label="แชร์" onPress={() => router.push(`/pets/${id}/sharing`)} />}
              {canEdit && <IconButton icon={Pencil} label="แก้ไข" onPress={() => router.push(`/pets/${id}/edit`)} />}
            </>
          }
        />
      }
      refreshing={isRefetching}
      onRefresh={refetch}
      footer={
        canEdit ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button label="น้ำหนัก" icon={Scale} variant="outline" style={{ flex: 1 }} onPress={() => router.push(`/pets/${id}/measurement`)} />
            <Button label="วัคซีน" icon={Syringe} variant="outline" style={{ flex: 1 }} onPress={() => router.push(`/pets/${id}/vaccination`)} />
            <Button label="จองคิว" icon={CalendarPlus} style={{ flex: 1 }} onPress={() => router.navigate("/")} />
          </View>
        ) : undefined
      }
    >
      <Card style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
        <PetAvatar species={pet.species} seed={pet.id} url={pet.avatar_url} size={92} radius={28} />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt size={22} weight="bold">
            {pet.name}
          </Txt>
          <Txt size={14} tone="muted">
            {[getSpeciesLabel(pet.species), pet.breed].filter(Boolean).join(" · ")}
          </Txt>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {pet.gender && pet.gender !== "unknown" && (
              <Pill label={GENDER_LABEL[pet.gender]} color={c.textMuted} bg={c.surfaceAlt} />
            )}
            {pet.is_neutered && <Pill label="ทำหมันแล้ว" color={c.brandSoftText} bg={c.brandSoft} icon={ShieldCheck} />}
          </View>
        </View>
      </Card>

      <Card style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 12 }}>
        <Fact label="อายุ" value={pet.birth_date ? formatPetAge(pet.birth_date) : "ไม่ทราบ"} />
        <Fact label="น้ำหนัก" value={pet.weight_kg ? `${Number(pet.weight_kg)} กก.` : "—"} />
        <Fact label="สี" value={pet.color ?? "—"} />
        {human && <Fact label="เทียบอายุคน" value={human.label} />}
        {pet.microchip_id && <Fact label="ไมโครชิป" value={pet.microchip_id} />}
      </Card>

      {status.kind !== "none" && <StatusBar status={status} />}
      {pet.allergies && (
        <Notice tone="danger" icon={AlertTriangle}>
          <Txt size={13.5} weight="semibold" tone="danger">
            แพ้ / ข้อควรระวัง
          </Txt>
          <Txt size={13.5} tone="danger">
            {pet.allergies}
          </Txt>
        </Notice>
      )}

      <UpcomingAppointments data={data} />

      <SectionTitle
        action={
          canEdit ? (
            <Txt size={13.5} weight="semibold" tone="brand" onPress={() => router.push(`/pets/${id}/measurement`)}>
              + บันทึก
            </Txt>
          ) : undefined
        }
      >
        น้ำหนักและค่าวัด
      </SectionTitle>
      {data.measurements.length === 0 ? (
        <Card>
          <EmptyState icon={Ruler} title="ยังไม่มีค่าวัด" body="บันทึกน้ำหนักทุกเดือนเพื่อดูแนวโน้มสุขภาพ" />
        </Card>
      ) : (
        <Card style={{ gap: 12 }}>
          <WeightChart measurements={data.measurements} />
          <MeasurementList data={data} canEdit={canEdit} />
        </Card>
      )}

      <SectionTitle
        action={
          canEdit ? (
            <Txt size={13.5} weight="semibold" tone="brand" onPress={() => router.push(`/pets/${id}/vaccination`)}>
              + บันทึก
            </Txt>
          ) : undefined
        }
      >
        วัคซีน
      </SectionTitle>
      <VaccinationList data={data} canEdit={canEdit} />

      <SectionTitle>ประวัติการรักษา</SectionTitle>
      {data.medical_records.length === 0 ? (
        <Card>
          <EmptyState icon={Stethoscope} title="ยังไม่มีประวัติการรักษา" body="คุณหมอจะบันทึกให้หลังตรวจที่คลินิก" />
        </Card>
      ) : (
        data.medical_records.map((r) => (
          <Card key={r.id} style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <Txt weight="semibold" style={{ flex: 1 }}>
                {VISIT_TYPE[r.visit_type] ?? r.visit_type}
              </Txt>
              <Txt size={13} tone="muted">
                {formatDateShort(r.visit_date)}
              </Txt>
            </View>
            <Txt size={13} tone="muted">
              {[r.clinic_name, r.vet_name].filter(Boolean).join(" · ")}
            </Txt>
            {r.diagnosis && <Txt size={14}>วินิจฉัย: {r.diagnosis}</Txt>}
            {r.treatment && <Txt size={14}>การรักษา: {r.treatment}</Txt>}
            {r.notes && (
              <Txt size={13.5} tone="muted">
                {r.notes}
              </Txt>
            )}
            {r.follow_up_date && (
              <Txt size={13} tone="brand">
                นัดติดตาม {formatDateShort(r.follow_up_date)}
              </Txt>
            )}
          </Card>
        ))
      )}

      <Sheet open={qrOpen} onClose={() => setQrOpen(false)} title="QR ประจำตัวน้อง">
        <View style={{ alignItems: "center", gap: 12, paddingVertical: 8 }}>
          <View style={{ padding: 16, backgroundColor: "#fff", borderRadius: radius.lg }}>
            <QRCode value={`petcare:pet:${pet.id}`} size={200} />
          </View>
          <Txt tone="muted" align="center">
            ให้คลินิกสแกน QR นี้เพื่อเปิดแฟ้มของ{pet.name} — คลินิกจะเห็นเฉพาะน้องตัวนี้
          </Txt>
        </View>
      </Sheet>
    </Screen>
  );
}

function StatusBar({ status }: { status: ReturnType<typeof derivePetStatus> }) {
  const tone = usePetStatusTone(status);
  if (status.kind === "none") return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: tone.bg }}>
      <tone.Icon size={18} color={tone.fg} />
      <View style={{ flex: 1 }}>
        <Txt size={14} weight="semibold" color={tone.fg}>
          {status.text}
        </Txt>
        {status.kind === "overdue" && (
          <Txt size={12.5} color={tone.fg}>
            {status.note}
          </Txt>
        )}
      </View>
    </View>
  );
}

function UpcomingAppointments({ data }: { data: PetDetail }) {
  const c = useColors();
  const [now] = useState(() => Date.now());
  const upcoming = data.appointments.filter(
    (a) => ["requested", "proposed", "accepted", "pending", "confirmed", "in_progress"].includes(a.status) && new Date(a.scheduled_at).getTime() > now - 3600_000
  );
  if (!upcoming.length) return null;
  return (
    <>
      <SectionTitle>นัดที่กำลังจะถึง</SectionTitle>
      {upcoming.map((a) => {
        const tone = toneOf(a.status);
        const t = toneColors(tone, c.isDark);
        return (
          <Card key={a.id} onPress={() => router.push(`/appointments/${a.id}`)} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <tone.Icon size={20} color={t.ink} />
            <View style={{ flex: 1 }}>
              <Txt weight="semibold" numberOfLines={1}>
                {a.service_label ?? "นัดหมาย"} · {a.clinic_name}
              </Txt>
              <Txt size={13} tone="muted">
                {formatDateShort(a.scheduled_at)}
                {["requested", "proposed", "accepted"].includes(a.status) ? "" : ` ${formatTime(a.scheduled_at)} น.`} · {tone.label}
              </Txt>
            </View>
          </Card>
        );
      })}
    </>
  );
}

function MeasurementList({ data, canEdit }: { data: PetDetail; canEdit: boolean }) {
  const c = useColors();
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: (mid: string) => petApi.removeMeasurement(mid),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.pet(data.pet.id) });
      void qc.invalidateQueries({ queryKey: qk.pets });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <View>
      {data.measurements.slice(0, 6).map((m, i) => {
        const parts = [
          m.weight_kg && `${Number(m.weight_kg)} กก.`,
          m.height_cm && `สูง ${Number(m.height_cm)} ซม.`,
          m.temperature_c && `${Number(m.temperature_c)}°C`,
          m.body_condition_score && `BCS ${m.body_condition_score}`,
        ].filter(Boolean);
        return (
          <View
            key={m.id}
            style={{ flexDirection: "row", alignItems: "center", paddingVertical: 9, borderTopWidth: i ? 1 : 0, borderTopColor: c.border, gap: 8 }}
          >
            <Txt size={13} tone="muted" style={{ width: 96 }}>
              {formatDateShort(m.measured_at)}
            </Txt>
            <Txt size={14} style={{ flex: 1 }}>
              {parts.join(" · ")}
            </Txt>
            {canEdit && m.source === "owner" && (
              <Pressable
                hitSlop={8}
                accessibilityLabel="ลบค่าวัด"
                onPress={async () => {
                  if (await confirmAsync("ลบค่าวัดนี้?", parts.join(" · "), "ลบ")) del.mutate(m.id);
                }}
              >
                <Trash2 size={16} color={c.textFaint} />
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

function VaccinationList({ data, canEdit }: { data: PetDetail; canEdit: boolean }) {
  const c = useColors();
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: (vid: string) => petApi.removeVaccination(vid),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.pet(data.pet.id) });
      void qc.invalidateQueries({ queryKey: qk.pets });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (data.vaccinations.length === 0) {
    return (
      <Card>
        <EmptyState icon={Syringe} title="ยังไม่มีประวัติวัคซีน" body="บันทึกวัคซีนเพื่อให้เราเตือนก่อนครบกำหนดเข็มถัดไป" />
      </Card>
    );
  }
  return (
    <Card padded={false}>
      {data.vaccinations.map((v, i) => (
        <View
          key={v.id}
          style={{ flexDirection: "row", gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: c.border, alignItems: "center" }}
        >
          <Syringe size={18} color={c.brand} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Txt weight="medium" style={{ flexShrink: 1 }}>
                {v.vaccine_name}
              </Txt>
              {v.is_verified && <ShieldCheck size={14} color={c.brand} />}
            </View>
            <Txt size={13} tone="muted">
              ฉีด {formatDateShort(v.administered_date)}
              {v.clinic_name ? ` · ${v.clinic_name}` : ""}
            </Txt>
            {v.next_due_date && (
              <Txt size={13} tone="brand">
                เข็มถัดไป {formatDateShort(v.next_due_date)}
              </Txt>
            )}
          </View>
          {canEdit && !v.is_verified && (
            <Pressable
              hitSlop={8}
              accessibilityLabel="ลบวัคซีน"
              onPress={async () => {
                if (await confirmAsync("ลบประวัติวัคซีนนี้?", v.vaccine_name, "ลบ")) del.mutate(v.id);
              }}
            >
              <Trash2 size={16} color={c.textFaint} />
            </Pressable>
          )}
        </View>
      ))}
    </Card>
  );
}
