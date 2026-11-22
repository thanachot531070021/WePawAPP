import { Camera } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { uploadApi, type PetInput } from "@/api/endpoints";
import { CalendarPicker, Checkbox, Chip, Field, Notice, PetAvatar, SectionTitle, Sheet, toast, Txt, Button } from "@/components/ui";
import { formatDateLong, bkkDateKey } from "@/lib/format";
import { pickImageWithChoice } from "@/lib/images";
import { ALL_SPECIES, SPECIES_LABEL } from "@/shared/species";
import { breedHint, metricLevel, speciesProfile } from "@/shared/speciesProfile";
import { WeightField } from "./WeightField";
import { PetPhotoAlbumInput } from "./PetPhotoAlbum";
import { radius, useColors } from "@/theme";

export interface PetFormValue {
  name: string;
  species: string;
  breed: string;
  gender: "male" | "female" | "unknown";
  birth_date: string | null;
  /** กก. เสมอ — WeightField แปลงจากกรัมให้ */
  weight_kg: string;
  /** ซม. — ถามตอนเพิ่มปลา/สัตว์เลื้อยคลาน (ค่าวัดแรก) */
  body_length_cm: string;
  color: string;
  distinctive_marks: string;
  is_neutered: boolean;
  microchip_id: string;
  allergies: string;
  avatar_url: string | null;
  /** อัลบั้ม (ไม่รวมรูปหลัก) · null = ไม่แสดงอัลบั้ม (ตอนเพิ่มน้อง / เซิร์ฟเวอร์ยังไม่รองรับ) */
  photos: string[] | null;
}

export const EMPTY_PET: PetFormValue = {
  name: "",
  species: "dog",
  breed: "",
  gender: "unknown",
  birth_date: null,
  weight_kg: "",
  body_length_cm: "",
  color: "",
  distinctive_marks: "",
  is_neutered: false,
  microchip_id: "",
  allergies: "",
  avatar_url: null,
  photos: null,
};

/** แปลงเป็น body ของ API — ส่งครบทุกฟิลด์เสมอ (updatePet ของเว็บแทนที่ทั้งแถว) */
export function toPetInput(v: PetFormValue): PetInput {
  const s = (x: string) => x.trim() || null;
  return {
    name: v.name.trim(),
    species: v.species,
    breed: s(v.breed),
    gender: v.gender,
    birth_date: v.birth_date,
    weight_kg: s(v.weight_kg),
    body_length_cm: s(v.body_length_cm),
    color: s(v.color),
    distinctive_marks: s(v.distinctive_marks),
    is_neutered: v.is_neutered,
    microchip_id: s(v.microchip_id),
    allergies: s(v.allergies),
    avatar_url: v.avatar_url ?? "",
    ...(v.photos ? { photo_urls: v.photos } : {}),
  };
}

/** ฟอร์มข้อมูลน้อง — ฟิลด์ชุดเดียวกับ PetSchema ของเว็บ */
export function PetForm({
  value,
  onChange,
  errors,
  petId,
  onUploadingChange,
}: {
  value: PetFormValue;
  onChange: (v: PetFormValue) => void;
  errors: Record<string, string>;
  petId?: string;
  onUploadingChange?: (busy: boolean) => void;
}) {
  const c = useColors();
  const [uploading, setUploading] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const set = <K extends keyof PetFormValue>(k: K, v: PetFormValue[K]) => onChange({ ...value, [k]: v });
  // ฟอร์มปรับตามชนิด (lib/pets/speciesProfile.ts): หน่วยน้ำหนัก, ถามความยาว, ทำหมัน/ไมโครชิปเกี่ยวไหม
  const profile = speciesProfile(value.species);
  const askLength = !petId && metricLevel(value.species, "body_length_cm", "owner") === "primary";
  const weightOptional = metricLevel(value.species, "weight_kg", "owner") !== "primary";

  async function changePhoto() {
    const file = await pickImageWithChoice(true);
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadApi.pet(file);
      set("avatar_url", url);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={{ gap: 16 }}>
      <View style={{ alignItems: "center", gap: 8 }}>
        <Pressable onPress={changePhoto} disabled={uploading} accessibilityLabel="เปลี่ยนรูปน้อง">
          <PetAvatar species={value.species} seed={petId ?? value.name} url={value.avatar_url} size={104} radius={32} />
          <View
            style={{
              position: "absolute",
              right: -4,
              bottom: -4,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: c.brandSolid,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: c.bg,
            }}
          >
            <Camera size={17} color="#fff" />
          </View>
        </Pressable>
        <Txt size={13} tone="muted">
          {uploading ? "กำลังอัปโหลดรูป…" : "แตะเพื่อเปลี่ยนรูป"}
        </Txt>
      </View>

      {value.photos && (
        <PetPhotoAlbumInput
          main={value.avatar_url}
          extras={value.photos}
          onChange={(m, x) => onChange({ ...value, avatar_url: m, photos: x })}
          onUploadingChange={onUploadingChange}
        />
      )}

      <Field label="ชื่อน้อง" required value={value.name} onChangeText={(t) => set("name", t)} error={errors.name} maxLength={50} />

      <SectionTitle>ชนิดสัตว์</SectionTitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {ALL_SPECIES.map((s) => (
          <Chip key={s} label={SPECIES_LABEL[s]} selected={value.species === s} onPress={() => set("species", s)} />
        ))}
      </View>

      <Field label="สายพันธุ์" value={value.breed} onChangeText={(t) => set("breed", t)} placeholder={breedHint(value.species)} />

      <SectionTitle>เพศ</SectionTitle>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(
          [
            ["male", "ผู้"],
            ["female", "เมีย"],
            ["unknown", "ไม่ระบุ"],
          ] as const
        ).map(([k, l]) => (
          <Chip key={k} label={l} selected={value.gender === k} onPress={() => set("gender", k)} />
        ))}
      </View>
      {(profile.neuterRelevant || value.is_neutered) && (
        <Checkbox checked={value.is_neutered} onChange={(v) => set("is_neutered", v)}>
          ทำหมันแล้ว
        </Checkbox>
      )}

      <View style={{ gap: 6 }}>
        <Txt size={13.5} weight="medium" tone="muted">
          วันเกิด
        </Txt>
        <Pressable
          onPress={() => setDateOpen(true)}
          style={{
            minHeight: 48,
            borderWidth: 1,
            borderColor: errors.birth_date ? c.danger : c.borderStrong,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            justifyContent: "center",
            backgroundColor: c.isDark ? c.surfaceAlt : c.surface,
          }}
        >
          <Txt tone={value.birth_date ? "default" : "faint"}>{value.birth_date ? formatDateLong(value.birth_date) : "เลือกวันเกิด (ถ้าทราบ)"}</Txt>
        </Pressable>
        {value.birth_date && (
          <Txt size={13} tone="brand" onPress={() => set("birth_date", null)}>
            ล้างวันเกิด
          </Txt>
        )}
      </View>

      {askLength && (
        <Field
          label={profile.lengthLabel}
          value={value.body_length_cm}
          onChangeText={(t) => set("body_length_cm", t.replace(/[^\d.]/g, ""))}
          keyboardType="decimal-pad"
          suffix="ซม."
          error={errors.body_length_cm}
          hint={profile.lengthHint}
        />
      )}
      <WeightField
        species={value.species}
        kg={value.weight_kg}
        onChangeKg={(kg) => set("weight_kg", kg)}
        label={weightOptional ? "น้ำหนัก (ถ้าชั่งได้)" : "น้ำหนัก"}
        error={errors.weight_kg}
        hint={profile.weightHint}
      />
      <Field label="สี" value={value.color} onChangeText={(t) => set("color", t)} maxLength={50} />
      <Field label="ตำหนิ / จุดสังเกต" value={value.distinctive_marks} onChangeText={(t) => set("distinctive_marks", t)} maxLength={255} />
      {(profile.microchipRelevant || !!value.microchip_id) && (
        <Field label="เลขไมโครชิป" value={value.microchip_id} onChangeText={(t) => set("microchip_id", t)} maxLength={50} />
      )}
      <Field
        label="ประวัติแพ้ยา / อาหาร"
        value={value.allergies}
        onChangeText={(t) => set("allergies", t)}
        multiline
        maxLength={500}
        hint="คลินิกและคุณหมอจะเห็นข้อมูลนี้ก่อนรักษา"
      />
      {Object.keys(errors).length > 0 && <Notice tone="danger">กรุณาตรวจสอบข้อมูลที่กรอก</Notice>}

      <Sheet
        open={dateOpen}
        onClose={() => setDateOpen(false)}
        title="วันเกิดน้อง"
        footer={<Button label="เสร็จ" full onPress={() => setDateOpen(false)} />}
      >
        <CalendarPicker
          value={value.birth_date}
          onChange={(d) => set("birth_date", d)}
          max={bkkDateKey()}
        />
      </Sheet>
    </View>
  );
}
