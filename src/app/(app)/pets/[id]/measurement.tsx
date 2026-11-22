import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { ApiError } from "@/api/client";
import { petApi } from "@/api/endpoints";
import { WeightField } from "@/components/WeightField";
import { AppBar, Button, CalendarPicker, Card, ErrorView, Field, LoadingView, Notice, Screen, SectionTitle, toast, Txt } from "@/components/ui";
import { usePet } from "@/features/queries";
import { bkkDateKey } from "@/lib/format";
import { qk } from "@/lib/queryClient";
import {
  INTEGER_METRICS,
  metricLabel,
  metricsByLevel,
  metricUnit,
  speciesProfile,
  type MetricKey,
} from "@/shared/speciesProfile";
import { useColors } from "@/theme";

const EMPTY: Record<MetricKey, string> = {
  weight_kg: "",
  body_length_cm: "",
  height_cm: "",
  body_condition_score: "",
  temperature_c: "",
  heart_rate_bpm: "",
  respiratory_rate_bpm: "",
};

/**
 * บันทึกค่าวัด — addPetMeasurement() ของเว็บ (ต้องมีอย่างน้อย 1 ค่า)
 * ช่องที่ถามตามชนิดสัตว์ = MeasurementsSection ของเว็บ (lib/pets/speciesProfile.ts ระดับ "owner"):
 * primary โชว์ทันที · optional อยู่ใต้ "ค่าอื่น ๆ" · hidden ไม่ถาม
 */
export default function MeasurementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = usePet(id);
  if (isLoading) return <LoadingView />;
  if (error || !data)
    return (
      <Screen header={<AppBar title="บันทึกค่าวัด" back />}>
        <ErrorView message={(error as Error)?.message ?? "โหลดข้อมูลไม่สำเร็จ"} onRetry={refetch} />
      </Screen>
    );
  return <MeasurementForm petId={id} petName={data.pet.name} species={data.pet.species} />;
}

function MeasurementForm({ petId, petName, species }: { petId: string; petName: string; species: string }) {
  const c = useColors();
  const qc = useQueryClient();
  const profile = speciesProfile(species);
  const groups = metricsByLevel(species, "owner");
  const [date, setDate] = useState(bkkDateKey());
  const [f, setF] = useState(EMPTY);
  const [notes, setNotes] = useState("");
  const [more, setMore] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: MetricKey) => (v: string) =>
    setF((x) => ({ ...x, [k]: INTEGER_METRICS.has(k) ? v.replace(/[^\d]/g, "") : v.replace(/[^\d.]/g, "") }));

  const m = useMutation({
    mutationFn: () =>
      petApi.addMeasurement(petId, {
        measured_at: date,
        ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v || null])),
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.pet(petId) });
      void qc.invalidateQueries({ queryKey: qk.pets });
      toast.success("บันทึกค่าวัดแล้ว");
      router.back();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fieldErrors) {
        setErrors(e.fieldErrors);
        // error อยู่ในช่องที่พับไว้ → เปิดให้เห็น
        if (groups.optional.some((k) => e.fieldErrors?.[k])) setMore(true);
      }
      toast.error(e.message);
    },
  });

  const field = (k: MetricKey, autoFocus = false) =>
    k === "weight_kg" ? (
      <WeightField
        key={k}
        species={species}
        kg={f.weight_kg}
        onChangeKg={set("weight_kg")}
        error={errors.weight_kg}
        hint={profile.weightHint ?? profile.normal?.weight_kg}
        autoFocus={autoFocus}
      />
    ) : (
      <Field
        key={k}
        label={metricLabel(k, species)}
        value={f[k]}
        onChangeText={set(k)}
        keyboardType={INTEGER_METRICS.has(k) ? "number-pad" : "decimal-pad"}
        suffix={k === "body_condition_score" ? undefined : metricUnit(k)}
        error={errors[k]}
        hint={
          k === "body_condition_score"
            ? "5 = สมส่วน ต่ำกว่า = ผอม สูงกว่า = อ้วน"
            : k === "body_length_cm"
              ? profile.lengthHint
              : profile.normal?.[k]
                ? `ค่าปกติโดยประมาณ ${profile.normal[k]}`
                : undefined
        }
        autoFocus={autoFocus}
      />
    );

  const moreFilled = groups.optional.some((k) => f[k]);

  return (
    <Screen
      header={<AppBar title="บันทึกค่าวัด" subtitle={petName} back />}
      footer={<Button label="บันทึก" size="lg" full loading={m.isPending} onPress={() => m.mutate()} />}
    >
      {groups.primary.map((k, i) => field(k, i === 0))}

      {groups.optional.length > 0 && (
        <>
          <Pressable
            onPress={() => setMore((x) => !x)}
            accessibilityRole="button"
            accessibilityState={{ expanded: more }}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 }}
          >
            {more ? <ChevronUp size={18} color={c.brand} /> : <ChevronDown size={18} color={c.brand} />}
            <Txt size={14} weight="semibold" tone="brand">
              ค่าอื่น ๆ
            </Txt>
            <Txt size={13} tone="faint" style={{ flex: 1 }} numberOfLines={1}>
              {moreFilled && !more ? "· กรอกไว้แล้ว" : groups.optional.map((k) => metricLabel(k, species, true)).join(" · ")}
            </Txt>
          </Pressable>
          {more && <View style={{ gap: 14 }}>{groups.optional.map((k) => field(k))}</View>}
        </>
      )}

      <Field label="หมายเหตุ" value={notes} onChangeText={setNotes} multiline maxLength={1000} />
      <SectionTitle>วันที่วัด</SectionTitle>
      <Card>
        <CalendarPicker value={date} onChange={setDate} max={bkkDateKey()} />
      </Card>
      {Object.keys(errors).length > 0 && <Notice tone="danger">{Object.values(errors)[0]}</Notice>}
    </Screen>
  );
}
