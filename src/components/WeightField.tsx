import { useState } from "react";
import { Pressable, View } from "react-native";
import { Field, Txt } from "@/components/ui";
import { displayWeightUnit, fromKg, toKg, weightUnitFor, type WeightUnit } from "@/shared/speciesProfile";
import { radius, useColors } from "@/theme";

/**
 * ช่องน้ำหนักที่เปิดมาเป็นหน่วยเหมาะกับชนิดสัตว์ (นก/หนู/ปลา = กรัม, สุนัข/แมว = กก.) และสลับหน่วยเองได้
 * = WeightInput ของเว็บ · ค่าที่ส่งออก (`onChangeKg`) เป็น กก. เสมอ ("" = ไม่กรอก)
 */
export function WeightField({
  species,
  kg,
  onChangeKg,
  label = "น้ำหนัก",
  error,
  hint,
  autoFocus,
}: {
  species: string | null | undefined;
  kg: string;
  onChangeKg: (kg: string) => void;
  label?: string;
  error?: string;
  hint?: string;
  autoFocus?: boolean;
}) {
  const c = useColors();
  const initial = kg === "" ? null : Number(kg);
  const [unit, setUnit] = useState<WeightUnit>(() =>
    initial !== null && Number.isFinite(initial) ? displayWeightUnit(initial, species) : weightUnitFor(species)
  );
  const [text, setText] = useState(() =>
    initial !== null && Number.isFinite(initial) ? String(fromKg(initial, unit)) : ""
  );
  const [lastSpecies, setLastSpecies] = useState(species);

  const show = (nextUnit: WeightUnit) => {
    const n = kg === "" ? null : Number(kg);
    setText(n === null || !Number.isFinite(n) ? "" : String(fromKg(n, nextUnit)));
  };

  // เปลี่ยนชนิดสัตว์ → หน่วยตั้งต้นของชนิดใหม่ (ค่าที่กรอกไว้แปลงหน่วยให้ ไม่หาย)
  if (lastSpecies !== species) {
    setLastSpecies(species);
    const next = weightUnitFor(species);
    setUnit(next);
    show(next);
  }

  function onText(t: string) {
    const clean = t.replace(/[^\d.]/g, "");
    setText(clean);
    const n = Number(clean);
    onChangeKg(clean === "" || !Number.isFinite(n) ? "" : String(toKg(n, unit)));
  }

  function pickUnit(next: WeightUnit) {
    if (next === unit) return;
    setUnit(next);
    show(next);
  }

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Txt size={13.5} weight="medium" tone="muted">
          {label}
        </Txt>
        <View style={{ flexDirection: "row", padding: 3, borderRadius: radius.full, backgroundColor: c.surfaceAlt }}>
          {(["kg", "g"] as const).map((u) => {
            const on = u === unit;
            return (
              <Pressable
                key={u}
                onPress={() => pickUnit(u)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={u === "kg" ? "หน่วยกิโลกรัม" : "หน่วยกรัม"}
                style={{
                  paddingHorizontal: 12,
                  height: 26,
                  borderRadius: radius.full,
                  justifyContent: "center",
                  backgroundColor: on ? c.surface : "transparent",
                  shadowColor: c.shadow,
                  shadowOpacity: on ? 0.08 : 0,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: on ? 1 : 0,
                }}
              >
                <Txt size={12.5} weight={on ? "semibold" : "medium"} color={on ? c.brandSoftText : c.textMuted} lineHeight={16}>
                  {u === "kg" ? "กก." : "กรัม"}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Field
        value={text}
        onChangeText={onText}
        keyboardType="decimal-pad"
        suffix={unit === "kg" ? "กก." : "กรัม"}
        error={error}
        hint={hint}
        autoFocus={autoFocus}
        accessibilityLabel={label}
      />
    </View>
  );
}
