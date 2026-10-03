import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { CheckCircle2, Stethoscope } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { ApiError } from "@/api/client";
import { caseApi } from "@/api/staffEndpoints";
import {
  AppBar,
  Button,
  CalendarPicker,
  Card,
  Chip,
  Field,
  Notice,
  Screen,
  SectionTitle,
  Sheet,
  Txt,
} from "@/components/ui";
import { addDays, bkkDateKey, formatDateLong } from "@/lib/format";
import { ALL_VISIT_TYPES, VISIT_TYPE_LABEL, visitTypeFromService, type VisitType } from "@/shared/visitType";
import { useColors } from "@/theme";

/** วลีที่หมอพิมพ์บ่อย — ชุดเดียวกับ PHRASES ใน MobileVetCaseForm ของเว็บ */
const PHRASES = {
  dx: ["ท้องเสีย", "ซึม ไม่กินอาหาร", "อาเจียน", "คัน / ผิวหนังอักเสบ", "ปกติ"],
  tx: ["ให้น้ำเกลือ", "ฉีดยาแก้อักเสบ", "ล้างแผล", "ตรวจร่างกายทั่วไป"],
};
const NEXT_QUICK: [string, number][] = [
  ["+7 วัน", 7],
  ["+14 วัน", 14],
  ["+1 เดือน", 30],
];

const append = (cur: string, add: string) => (cur.trim() ? `${cur.trim()}, ${add}` : add);

/**
 * จบเคส + บันทึกเวชระเบียน — = MobileVetCaseForm ของเว็บ (หน้า /vet/appointments/[id]/complete)
 * hasRecord = นัดนี้มีเวชระเบียนแล้ว (บันทึกจาก POS/visit ของคลินิก) → เขียนซ้ำไม่ได้ เหลือแค่ปิดเคส
 */
export function CaseCompleteForm({
  appointmentId,
  petName,
  service,
  hasRecord,
  hasPet,
}: {
  appointmentId: string;
  petName: string;
  service: string | null;
  hasRecord: boolean;
  hasPet: boolean;
}) {
  const c = useColors();
  const qc = useQueryClient();
  const [visitType, setVisitType] = useState<VisitType>(() => visitTypeFromService(service));
  const [visitDate, setVisitDate] = useState(bkkDateKey());
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [medications, setMedications] = useState("");
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [dateSheet, setDateSheet] = useState<"visit" | "follow" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["vet"] });
    void qc.invalidateQueries({ queryKey: ["clinic"] });
  };

  const save = useMutation({
    mutationFn: () =>
      hasRecord || !hasPet
        ? caseApi.setStatus(appointmentId, "completed")
        : caseApi.complete(appointmentId, {
            visit_date: visitDate,
            visit_type: visitType,
            diagnosis: diagnosis.trim() || null,
            treatment: treatment.trim() || null,
            medications: medications.trim() || null,
            notes: notes.trim() || null,
            follow_up_date: followUp,
          }),
    onSuccess: () => {
      invalidate();
      setDone(true);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "บันทึกไม่สำเร็จ"),
  });

  if (done) {
    return (
      <Screen header={<AppBar title="จบเคส" back />} contentStyle={{ paddingTop: 40 }}>
        <Card style={{ alignItems: "center", gap: 10, paddingVertical: 32 }}>
          <CheckCircle2 size={64} color={c.brand} />
          <Txt size={20} weight="bold" align="center">
            ปิดเคสของน้อง{petName}แล้ว
          </Txt>
          <Txt tone="muted" align="center">
            {hasRecord || !hasPet ? "สถานะนัดเปลี่ยนเป็นเสร็จสิ้น" : "บันทึกเวชระเบียนเข้าแฟ้มน้องแล้ว เจ้าของจะเห็นในแอป"}
          </Txt>
          <Button label="กลับ" full style={{ marginTop: 12 }} onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      header={<AppBar title="จบเคส" subtitle={[`น้อง${petName}`, service].filter(Boolean).join(" · ")} back />}
      footer={
        <Button
          label={hasRecord || !hasPet ? "ปิดเคส" : "บันทึกและจบเคส"}
          icon={Stethoscope}
          size="lg"
          full
          loading={save.isPending}
          onPress={() => {
            setError(null);
            save.mutate();
          }}
        />
      }
    >
      {error && <Notice tone="danger">{error}</Notice>}
      {hasRecord ? (
        <Notice tone="info">นัดนี้มีเวชระเบียนแล้ว (บันทึกจากคลินิก) — กดปิดเคสได้เลย</Notice>
      ) : !hasPet ? (
        <Notice tone="info">เคส walk-in ที่ไม่มีแฟ้มสัตว์ในระบบ — ปิดเคสได้แต่ไม่มีเวชระเบียนให้บันทึก</Notice>
      ) : (
        <>
          <SectionTitle>ประเภทการตรวจ</SectionTitle>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {ALL_VISIT_TYPES.map((t) => (
              <Chip key={t} label={VISIT_TYPE_LABEL[t]} selected={visitType === t} onPress={() => setVisitType(t)} />
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Chip label={`วันที่ตรวจ: ${formatDateLong(visitDate)}`} onPress={() => setDateSheet("visit")} />
          </View>
          <Field label="การวินิจฉัย" value={diagnosis} onChangeText={setDiagnosis} multiline />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {PHRASES.dx.map((p) => (
              <Chip key={p} label={p} onPress={() => setDiagnosis((d) => append(d, p))} />
            ))}
          </View>
          <Field label="การรักษา" value={treatment} onChangeText={setTreatment} multiline />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {PHRASES.tx.map((p) => (
              <Chip key={p} label={p} onPress={() => setTreatment((d) => append(d, p))} />
            ))}
          </View>
          <Field label="ยาที่ให้" value={medications} onChangeText={setMedications} multiline />
          <Field label="บันทึกเพิ่มเติม" value={notes} onChangeText={setNotes} multiline />
          <SectionTitle>นัดติดตามอาการ</SectionTitle>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {NEXT_QUICK.map(([label, days]) => (
              <Chip
                key={label}
                label={label}
                selected={followUp === addDays(visitDate, days)}
                onPress={() => setFollowUp(addDays(visitDate, days))}
              />
            ))}
            <Chip label={followUp ? formatDateLong(followUp) : "เลือกวัน"} selected={!!followUp && !NEXT_QUICK.some(([, d]) => followUp === addDays(visitDate, d))} onPress={() => setDateSheet("follow")} />
            {followUp && <Chip label="ไม่นัด" onPress={() => setFollowUp(null)} />}
          </View>
        </>
      )}
      <Sheet
        open={!!dateSheet}
        onClose={() => setDateSheet(null)}
        title={dateSheet === "visit" ? "วันที่ตรวจ" : "วันนัดติดตามอาการ"}
        footer={<Button label="เสร็จ" full onPress={() => setDateSheet(null)} />}
      >
        {dateSheet === "visit" ? (
          <CalendarPicker value={visitDate} onChange={setVisitDate} max={bkkDateKey()} />
        ) : (
          <CalendarPicker value={followUp} onChange={setFollowUp} min={addDays(visitDate, 1)} />
        )}
      </Sheet>
    </Screen>
  );
}
