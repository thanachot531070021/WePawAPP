import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ApiError } from "@/api/client";
import { petApi } from "@/api/endpoints";
import { AppBar, Button, CalendarPicker, Card, Field, Notice, Screen, SectionTitle, toast } from "@/components/ui";
import { bkkDateKey } from "@/lib/format";
import { qk } from "@/lib/queryClient";

const num = (t: string) => t.replace(/[^\d.]/g, "");

/** บันทึกค่าวัด — addPetMeasurement() ของเว็บ (ต้องมีอย่างน้อย 1 ค่า) */
export default function MeasurementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [date, setDate] = useState(bkkDateKey());
  const [f, setF] = useState({ weight_kg: "", height_cm: "", body_length_cm: "", temperature_c: "", heart_rate_bpm: "", body_condition_score: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: k === "notes" ? v : num(v) }));

  const m = useMutation({
    mutationFn: () =>
      petApi.addMeasurement(id, {
        measured_at: date,
        weight_kg: f.weight_kg || null,
        height_cm: f.height_cm || null,
        body_length_cm: f.body_length_cm || null,
        temperature_c: f.temperature_c || null,
        heart_rate_bpm: f.heart_rate_bpm || null,
        body_condition_score: f.body_condition_score || null,
        notes: f.notes.trim() || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.pet(id) });
      void qc.invalidateQueries({ queryKey: qk.pets });
      toast.success("บันทึกค่าวัดแล้ว");
      router.back();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
      toast.error(e.message);
    },
  });

  return (
    <Screen
      header={<AppBar title="บันทึกน้ำหนัก / ค่าวัด" back />}
      footer={<Button label="บันทึก" size="lg" full loading={m.isPending} onPress={() => m.mutate()} />}
    >
      <Field label="น้ำหนัก" value={f.weight_kg} onChangeText={set("weight_kg")} keyboardType="decimal-pad" suffix="กก." error={errors.weight_kg} autoFocus />
      <Field label="ความสูง" value={f.height_cm} onChangeText={set("height_cm")} keyboardType="decimal-pad" suffix="ซม." error={errors.height_cm} />
      <Field label="ความยาวลำตัว" value={f.body_length_cm} onChangeText={set("body_length_cm")} keyboardType="decimal-pad" suffix="ซม." />
      <Field label="อุณหภูมิ" value={f.temperature_c} onChangeText={set("temperature_c")} keyboardType="decimal-pad" suffix="°C" error={errors.temperature_c} />
      <Field label="ชีพจร" value={f.heart_rate_bpm} onChangeText={set("heart_rate_bpm")} keyboardType="number-pad" suffix="ครั้ง/นาที" />
      <Field
        label="คะแนนรูปร่าง (BCS 1–9)"
        value={f.body_condition_score}
        onChangeText={set("body_condition_score")}
        keyboardType="number-pad"
        hint="5 = สมส่วน, ต่ำกว่า = ผอม, สูงกว่า = อ้วน"
      />
      <Field label="หมายเหตุ" value={f.notes} onChangeText={set("notes")} multiline />
      <SectionTitle>วันที่วัด</SectionTitle>
      <Card>
        <CalendarPicker value={date} onChange={setDate} max={bkkDateKey()} />
      </Card>
      {Object.keys(errors).length > 0 && <Notice tone="danger">{Object.values(errors)[0]}</Notice>}
    </Screen>
  );
}
