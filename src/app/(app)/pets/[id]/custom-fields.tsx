import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { ApiError } from "@/api/client";
import { petApi } from "@/api/endpoints";
import type { PetCustomField, PetDetail } from "@/api/types";
import { SuggestionChip } from "@/components/PetCustomFields";
import { AppBar, Button, ErrorView, LoadingView, Notice, Screen, toast, Txt, useCardStyle } from "@/components/ui";
import { usePet } from "@/features/queries";
import { qk } from "@/lib/queryClient";
import { CUSTOM_FIELD_LIMITS, CUSTOM_FIELD_SUGGESTIONS } from "@/shared/customFields";
import { font, radius, useColors } from "@/theme";

type Row = { key: string; id: string | null; label: string; value: string };

let seq = 0;
const toRow = (f: { id: string | null; label: string; value: string }): Row => ({ key: `r${++seq}`, ...f });

/** แก้ "ข้อมูลเพิ่มเติม" ของน้อง — savePetCustomFields() ตัวเดียวกับหน้าน้องบนเว็บ · `?add=<หัวข้อ>` = เปิดมาพร้อมแถวใหม่ */
export default function CustomFieldsScreen() {
  const { id, add } = useLocalSearchParams<{ id: string; add?: string }>();
  const { data, isLoading, error, refetch } = usePet(id);
  if (isLoading) return <LoadingView />;
  if (error || !data)
    return (
      <Screen header={<AppBar title="ข้อมูลเพิ่มเติม" back />}>
        <ErrorView message={(error as Error)?.message ?? "โหลดข้อมูลไม่สำเร็จ"} onRetry={refetch} />
      </Screen>
    );
  return <Editor petId={id} petName={data.pet.name} initial={data.custom_fields ?? []} add={add} />;
}

function Editor({ petId, petName, initial, add }: { petId: string; petName: string; initial: PetCustomField[]; add?: string }) {
  const c = useColors();
  const qc = useQueryClient();
  const card = useCardStyle();
  const [rows, setRows] = useState<Row[]>(() => {
    const r = initial.map(toRow);
    if (add !== undefined || r.length === 0) r.push(toRow({ id: null, label: add ?? "", value: "" }));
    return r;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const inputs = useRef(new Map<string, TextInput | null>());

  const focusLater = (key: string) => setTimeout(() => inputs.current.get(key)?.focus(), 80);
  const update = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  function addRow(label = "") {
    if (rows.length >= CUSTOM_FIELD_LIMITS.maxFields) {
      setFormError(`เพิ่มได้สูงสุด ${CUSTOM_FIELD_LIMITS.maxFields} หัวข้อ`);
      return;
    }
    // กดหัวข้อตัวอย่างตอนมีแถวว่าง → เติมแถวนั้นแทนเพิ่มใหม่
    const blank = label ? rows.find((r) => !r.label.trim() && !r.value.trim()) : undefined;
    if (blank) {
      update(blank.key, { label });
      focusLater(`${blank.key}:value`);
      return;
    }
    const row = toRow({ id: null, label, value: "" });
    setRows((rs) => [...rs, row]);
    focusLater(`${row.key}:${label ? "value" : "label"}`);
  }

  const payload = rows.filter((r) => r.label.trim() || r.value.trim());
  const save = useMutation({
    mutationFn: () => petApi.saveCustomFields(petId, payload.map(({ id, label, value }) => ({ id, label, value }))),
    onSuccess: (r) => {
      // ใส่ผลจาก server ลงแฟ้มน้องทันที — หน้าที่ย้อนกลับไปไม่ต้องรอโหลดใหม่
      qc.setQueryData<PetDetail>(qk.pet(petId), (old) => (old ? { ...old, custom_fields: r.data.fields } : old));
      void qc.invalidateQueries({ queryKey: qk.pet(petId) });
      toast.success("บันทึกข้อมูลเพิ่มเติมแล้ว");
      if (router.canGoBack()) router.back();
      else router.replace({ pathname: "/pets/[id]", params: { id: petId } });
    },
    onError: (e) => {
      setFormError(e.message);
      // error รายแถวอ้างลำดับของชุดที่ส่ง → แปลงกลับเป็น key ของแถวบนจอ
      const byKey: Record<string, string> = {};
      if (e instanceof ApiError && e.fieldErrors) {
        for (const [k, msg] of Object.entries(e.fieldErrors)) {
          const m = k.match(/^(label|value)_(\d+)$/);
          const row = m ? payload[Number(m[2])] : undefined;
          if (m && row) byKey[`${row.key}:${m[1]}`] = msg;
        }
      }
      setErrors(byKey);
    },
  });

  const used = new Set(rows.map((r) => r.label.trim()));
  const suggestions = CUSTOM_FIELD_SUGGESTIONS.filter((s) => !used.has(s));

  return (
    <Screen
      header={<AppBar title="ข้อมูลเพิ่มเติม" subtitle={petName} back />}
      footer={
        <Button
          label="บันทึก"
          size="lg"
          full
          loading={save.isPending}
          onPress={() => {
            setErrors({});
            setFormError(null);
            save.mutate();
          }}
        />
      }
    >
      <Txt size={13.5} tone="muted">
        จดเรื่องของ{petName}ที่อยากเก็บไว้ ตั้งหัวข้อเองได้ทุกเรื่อง เช่น อาหารที่กิน นิสัย ประกันสัตว์เลี้ยง
      </Txt>

      {rows.map((r, i) => {
        const labelErr = errors[`${r.key}:label`];
        const valueErr = errors[`${r.key}:value`];
        return (
          <View key={r.key} style={[card, { padding: 12, gap: 8 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View
                style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.brandSoft, alignItems: "center", justifyContent: "center" }}
              >
                <Txt size={12.5} weight="bold" color={c.brandSoftText}>
                  {i + 1}
                </Txt>
              </View>
              <TextInput
                ref={(el) => {
                  inputs.current.set(`${r.key}:label`, el);
                }}
                value={r.label}
                onChangeText={(t) => update(r.key, { label: t })}
                maxLength={CUSTOM_FIELD_LIMITS.label}
                placeholder="ตั้งหัวข้อ เช่น อาหารที่กิน"
                placeholderTextColor={c.textFaint}
                returnKeyType="next"
                onSubmitEditing={() => inputs.current.get(`${r.key}:value`)?.focus()}
                accessibilityLabel={`หัวข้อที่ ${i + 1}`}
                style={{
                  flex: 1,
                  minHeight: 42,
                  paddingHorizontal: 10,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: labelErr ? c.danger : "transparent",
                  fontFamily: font.semibold,
                  fontSize: 16,
                  color: c.text,
                  outlineWidth: 0,
                }}
              />
              <Pressable
                onPress={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`ลบหัวข้อ ${r.label || i + 1}`}
                style={({ pressed }) => ({
                  width: 38,
                  height: 38,
                  borderRadius: radius.md,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed ? c.dangerSoft : "transparent",
                })}
              >
                <Trash2 size={18} color={c.textFaint} />
              </Pressable>
            </View>
            {labelErr && (
              <Txt size={12.5} tone="danger" style={{ marginLeft: 36 }}>
                {labelErr}
              </Txt>
            )}
            <TextInput
              ref={(el) => {
                inputs.current.set(`${r.key}:value`, el);
              }}
              value={r.value}
              onChangeText={(t) => update(r.key, { value: t })}
              maxLength={CUSTOM_FIELD_LIMITS.value}
              placeholder="รายละเอียด"
              placeholderTextColor={c.textFaint}
              multiline
              accessibilityLabel={`ข้อมูลของหัวข้อที่ ${i + 1}`}
              style={{
                minHeight: 72,
                paddingHorizontal: 12,
                paddingTop: 10,
                paddingBottom: 10,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: valueErr ? c.danger : c.border,
                backgroundColor: c.isDark ? c.surfaceAlt : c.bg,
                fontFamily: font.regular,
                fontSize: 15.5,
                lineHeight: 22,
                color: c.text,
                textAlignVertical: "top",
                outlineWidth: 0,
              }}
            />
            {valueErr && (
              <Txt size={12.5} tone="danger">
                {valueErr}
              </Txt>
            )}
          </View>
        );
      })}

      <Pressable
        onPress={() => addRow()}
        accessibilityRole="button"
        style={({ pressed }) => ({
          height: 50,
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: pressed ? c.brand : c.borderStrong,
          backgroundColor: pressed ? c.brandSoft : "transparent",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        })}
      >
        <Plus size={18} color={c.textMuted} />
        <Txt weight="semibold" tone="muted">
          เพิ่มหัวข้อ
        </Txt>
      </Pressable>

      {suggestions.length > 0 && (
        <View style={{ gap: 8 }}>
          <Txt size={12.5} weight="semibold" tone="muted">
            หรือเลือกหัวข้อตัวอย่าง
          </Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {suggestions.map((s) => (
              <SuggestionChip key={s} label={s} onPress={() => addRow(s)} />
            ))}
          </View>
        </View>
      )}

      {formError && <Notice tone="danger">{formError}</Notice>}
    </Screen>
  );
}
