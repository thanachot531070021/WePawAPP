import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { ApiError } from "@/api/client";
import { petApi } from "@/api/endpoints";
import { AppBar, Button, CalendarPicker, Card, Chip, Field, Notice, Screen, SectionTitle, toast, Txt } from "@/components/ui";
import { addDays, bkkDateKey, formatDateLong } from "@/lib/format";
import { qk } from "@/lib/queryClient";

/** วัคซีนที่เจ้าของบันทึกบ่อย — กดแล้วเติมชื่อให้ */
const COMMON = ["วัคซีนรวม", "พิษสุนัขบ้า", "ไข้หัดแมว", "ลิวคีเมียแมว", "พยาธิหนอนหัวใจ", "ถ่ายพยาธิ"];

/** บันทึกวัคซีน — addPetVaccination() ของเว็บ (เข็มถัดไปต้องไม่ก่อนวันฉีด) */
export default function VaccinationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [given, setGiven] = useState(bkkDateKey());
  const [next, setNext] = useState<string | null>(null);
  const [clinic, setClinic] = useState("");
  const [dose, setDose] = useState("");
  const [notes, setNotes] = useState("");
  const [picking, setPicking] = useState<"given" | "next">("given");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const m = useMutation({
    mutationFn: () =>
      petApi.addVaccination(id, {
        vaccine_name: name.trim(),
        administered_date: given,
        next_due_date: next,
        clinic_name: clinic.trim() || null,
        dose_number: dose || null,
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.pet(id) });
      void qc.invalidateQueries({ queryKey: qk.pets });
      toast.success("บันทึกวัคซีนแล้ว");
      router.back();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
      toast.error(e.message);
    },
  });

  return (
    <Screen
      header={<AppBar title="บันทึกวัคซีน" back />}
      footer={
        <Button
          label="บันทึก"
          size="lg"
          full
          loading={m.isPending}
          onPress={() => {
            if (!name.trim()) {
              setErrors({ vaccine_name: "กรุณากรอกชื่อวัคซีน" });
              return;
            }
            m.mutate();
          }}
        />
      }
    >
      <Field label="ชื่อวัคซีน" required value={name} onChangeText={setName} error={errors.vaccine_name} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {COMMON.map((v) => (
          <Chip key={v} label={v} selected={name === v} onPress={() => setName(v)} />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Chip label={`วันที่ฉีด: ${formatDateLong(given)}`} selected={picking === "given"} onPress={() => setPicking("given")} />
      </View>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Chip label={next ? `เข็มถัดไป: ${formatDateLong(next)}` : "ตั้งวันเข็มถัดไป"} selected={picking === "next"} onPress={() => setPicking("next")} />
        <Chip label="+1 ปี" onPress={() => setNext(addDays(given, 365))} />
        <Chip label="+1 เดือน" onPress={() => setNext(addDays(given, 30))} />
        {next && <Chip label="ไม่มีเข็มถัดไป" onPress={() => setNext(null)} />}
      </View>
      <Card>
        {picking === "given" ? (
          <CalendarPicker value={given} onChange={setGiven} max={bkkDateKey()} />
        ) : (
          <CalendarPicker value={next} onChange={setNext} min={given} />
        )}
      </Card>
      {errors.next_due_date && <Notice tone="danger">{errors.next_due_date}</Notice>}
      <SectionTitle>รายละเอียดเพิ่มเติม</SectionTitle>
      <Field label="ฉีดที่คลินิก" value={clinic} onChangeText={setClinic} maxLength={150} />
      <Field label="เข็มที่" value={dose} onChangeText={(t) => setDose(t.replace(/\D/g, ""))} keyboardType="number-pad" />
      <Field label="หมายเหตุ" value={notes} onChangeText={setNotes} multiline />
      <Txt size={12.5} tone="faint">
        วัคซีนที่คุณบันทึกเองจะแสดงว่า “เจ้าของบันทึก” — คลินิกยืนยันได้เมื่อพาน้องไปตรวจ
      </Txt>
    </Screen>
  );
}
