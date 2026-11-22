import { router } from "expo-router";
import { ChevronRight, NotebookPen, Plus } from "lucide-react-native";
import { Fragment } from "react";
import { Pressable, View } from "react-native";
import type { PetCustomField } from "@/api/types";
import { Button, Card, SectionTitle, Txt } from "@/components/ui";
import { CUSTOM_FIELD_SUGGESTIONS } from "@/shared/customFields";
import { radius, useColors } from "@/theme";

/**
 * "ข้อมูลเพิ่มเติม" บนหน้าน้อง — หัวข้อ + ข้อมูลที่เจ้าของตั้งเอง (PetCustomFieldsSection ของเว็บ)
 * แก้ไขที่หน้า /pets/[id]/custom-fields · ผู้ติดตามดูอย่างเดียว และไม่เห็นส่วนนี้ถ้ายังไม่มีข้อมูล
 */
export function PetCustomFieldsCard({
  petId,
  petName,
  fields,
  canEdit,
}: {
  petId: string;
  petName: string;
  fields: PetCustomField[];
  canEdit: boolean;
}) {
  const c = useColors();
  const edit = (add?: string) =>
    router.push({ pathname: "/pets/[id]/custom-fields", params: add !== undefined ? { id: petId, add } : { id: petId } });

  if (!fields.length && !canEdit) return null;

  return (
    <>
      <SectionTitle
        action={
          canEdit && fields.length > 0 ? (
            <Txt size={13.5} weight="semibold" tone="brand" onPress={() => edit()}>
              แก้ไข
            </Txt>
          ) : undefined
        }
      >
        ข้อมูลเพิ่มเติม
      </SectionTitle>

      {fields.length > 0 ? (
        <Card padded={false} onPress={canEdit ? () => edit() : undefined}>
          {fields.map((f, i) => (
            <Fragment key={f.id}>
              {i > 0 && <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: 16 }} />}
              <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 2 }}>
                <Txt size={12.5} weight="semibold" color={c.brandSoftText}>
                  {f.label}
                </Txt>
                <Txt size={15} weight="medium" lineHeight={22}>
                  {f.value}
                </Txt>
              </View>
            </Fragment>
          ))}
          {canEdit && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderTopWidth: 1,
                borderTopColor: c.border,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Plus size={16} color={c.brand} />
                <Txt size={14} weight="semibold" tone="brand">
                  เพิ่มหรือแก้ไขหัวข้อ
                </Txt>
              </View>
              <ChevronRight size={18} color={c.textFaint} />
            </View>
          )}
        </Card>
      ) : (
        <Card style={{ alignItems: "center", gap: 6, paddingVertical: 22 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: radius.md,
              backgroundColor: c.brandSoft,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 4,
            }}
          >
            <NotebookPen size={26} color={c.brand} />
          </View>
          <Txt size={15.5} weight="semibold" align="center">
            จดเรื่องของ{petName}ไว้ที่นี่
          </Txt>
          <Txt size={13.5} tone="muted" align="center">
            ตั้งหัวข้อเองได้ทุกเรื่อง หรือเริ่มจากหัวข้อตัวอย่าง
          </Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 10 }}>
            {CUSTOM_FIELD_SUGGESTIONS.slice(0, 4).map((s) => (
              <SuggestionChip key={s} label={s} onPress={() => edit(s)} />
            ))}
          </View>
          <Button label="ตั้งหัวข้อเอง" icon={Plus} size="sm" onPress={() => edit("")} style={{ marginTop: 12, paddingHorizontal: 18 }} />
        </Card>
      )}
    </>
  );
}

/** ชิปหัวข้อตัวอย่าง "+ อาหารที่กิน" — ใช้ทั้งการ์ดและหน้าแก้ไข */
export function SuggestionChip({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`เพิ่มหัวข้อ ${label}`}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        height: 34,
        paddingHorizontal: 12,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: pressed ? c.brand : c.borderStrong,
        backgroundColor: pressed ? c.brandSoft : c.surface,
      })}
    >
      <Plus size={14} color={c.textMuted} />
      <Txt size={13} weight="medium" tone="muted" lineHeight={18}>
        {label}
      </Txt>
    </Pressable>
  );
}
