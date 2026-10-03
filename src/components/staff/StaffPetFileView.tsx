import { AlertTriangle, EyeOff, Phone, ShieldCheck, Stethoscope, Syringe } from "lucide-react-native";
import type { ReactNode } from "react";
import { Linking, View } from "react-native";
import type { Measurement } from "@/api/types";
import type { StaffPetFile } from "@/api/staffTypes";
import { WeightChart } from "@/components/WeightChart";
import { Button, Card, EmptyState, Notice, PetAvatar, Pill, SectionTitle, Txt } from "@/components/ui";
import { formatDateShort } from "@/lib/format";
import { formatPetAge } from "@/shared/petAge";
import { formatThaiPhone } from "@/shared/phone";
import { GENDER_LABEL, getSpeciesLabel } from "@/shared/species";
import { VISIT_TYPE_LABEL } from "@/shared/visitType";
import { useColors } from "@/theme";

/**
 * แฟ้มสัตว์แบบอ่านอย่างเดียวของคลินิก/หมอ — ข้อมูลที่ส่งมาถูกกรองตามสิทธิ์ที่ server แล้ว
 * (คลินิก: lib/clinic/visibility.ts · หมอ: กติกาเดียวกับ /vet/pets/[id])
 */
export function StaffPetFileView({ data, top }: { data: StaffPetFile; top?: ReactNode }) {
  const c = useColors();
  const { pet } = data;
  return (
    <>
      <Card style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
        <PetAvatar species={pet.species} seed={pet.id} url={pet.avatar_url} size={80} radius={24} />
        <View style={{ flex: 1, gap: 3 }}>
          <Txt size={20} weight="bold">
            {pet.name}
          </Txt>
          <Txt size={13.5} tone="muted">
            {[getSpeciesLabel(pet.species), pet.breed, pet.birth_date ? formatPetAge(pet.birth_date) : null].filter(Boolean).join(" · ")}
          </Txt>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {pet.gender && pet.gender !== "unknown" && <Pill label={GENDER_LABEL[pet.gender]} color={c.textMuted} bg={c.surfaceAlt} />}
            {pet.is_neutered && <Pill label="ทำหมันแล้ว" color={c.brandSoftText} bg={c.brandSoft} icon={ShieldCheck} />}
            {pet.weight_kg && <Pill label={`${Number(pet.weight_kg)} กก.`} color={c.textMuted} bg={c.surfaceAlt} />}
          </View>
        </View>
      </Card>

      {(pet.owner_name || pet.owner_phone) && (
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Txt size={12.5} tone="faint">
              เจ้าของ
            </Txt>
            <Txt weight="medium">{pet.owner_name ?? "—"}</Txt>
            {pet.owner_phone && (
              <Txt size={13.5} tone="muted">
                {formatThaiPhone(pet.owner_phone)}
              </Txt>
            )}
          </View>
          {pet.owner_phone && (
            <Button label="โทร" icon={Phone} variant="outline" size="sm" onPress={() => Linking.openURL(`tel:${pet.owner_phone}`)} />
          )}
        </Card>
      )}

      {(pet.allergies || pet.chronic_conditions) && (
        <Notice tone="danger" icon={AlertTriangle}>
          <Txt size={13.5} weight="semibold" tone="danger">
            แพ้ / ข้อควรระวัง
          </Txt>
          {pet.allergies && (
            <Txt size={13.5} tone="danger">
              แพ้: {pet.allergies}
            </Txt>
          )}
          {pet.chronic_conditions && (
            <Txt size={13.5} tone="danger">
              โรคประจำตัว: {pet.chronic_conditions}
            </Txt>
          )}
        </Notice>
      )}

      {top}

      {!!data.hidden_history_count && (
        <Notice tone="info" icon={EyeOff}>
          {`มีประวัติจากคลินิกอื่น ${data.hidden_history_count} รายการที่คลินิกนี้ไม่เห็น — เห็นได้เมื่อเจ้าของแชร์น้องให้คลินิก`}
        </Notice>
      )}

      <SectionTitle>ประวัติการรักษา</SectionTitle>
      {data.medical_records.length === 0 ? (
        <Card>
          <EmptyState icon={Stethoscope} title="ยังไม่มีประวัติการรักษา" />
        </Card>
      ) : (
        data.medical_records.map((r) => (
          <Card key={r.id} style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <Txt weight="semibold" style={{ flex: 1 }}>
                {r.service_label ?? VISIT_TYPE_LABEL[r.visit_type] ?? r.visit_type}
              </Txt>
              <Txt size={13} tone="muted">
                {formatDateShort(r.visit_date)}
              </Txt>
            </View>
            <Txt size={13} tone="muted">
              {[r.clinic_name, r.vet_name].filter(Boolean).join(" · ")}
              {r.is_verified ? " · บันทึกโดยคุณหมอ" : ""}
            </Txt>
            {r.diagnosis && <Txt size={14}>วินิจฉัย: {r.diagnosis}</Txt>}
            {r.treatment && <Txt size={14}>การรักษา: {r.treatment}</Txt>}
            {r.medications && <Txt size={14}>ยา: {r.medications}</Txt>}
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

      <SectionTitle>วัคซีน</SectionTitle>
      {data.vaccinations.length === 0 ? (
        <Card>
          <EmptyState icon={Syringe} title="ยังไม่มีประวัติวัคซีน" />
        </Card>
      ) : (
        <Card padded={false}>
          {data.vaccinations.map((v, i) => (
            <View key={v.id} style={{ flexDirection: "row", gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}>
              <Syringe size={18} color={c.brand} style={{ marginTop: 3 }} />
              <View style={{ flex: 1 }}>
                <Txt weight="medium">
                  {v.vaccine_name}
                  {v.is_verified ? " ✓" : ""}
                </Txt>
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
            </View>
          ))}
        </Card>
      )}

      {data.measurements.some((m) => m.weight_kg) && (
        <>
          <SectionTitle>น้ำหนัก</SectionTitle>
          <Card>
            <WeightChart measurements={data.measurements as unknown as Measurement[]} />
          </Card>
        </>
      )}
    </>
  );
}
