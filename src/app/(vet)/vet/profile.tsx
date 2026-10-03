import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Camera } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { uploadApi } from "@/api/endpoints";
import type { VetProfile } from "@/api/staffTypes";
import { vetStaffApi } from "@/api/staffEndpoints";
import { AppBar, Avatar, Button, Chip, ErrorView, Field, LoadingView, Notice, Screen, SectionTitle, toast, Txt } from "@/components/ui";
import { useVetHome, useVetProfile } from "@/features/staffQueries";
import { pickImageWithChoice } from "@/lib/images";
import { formatThaiPhone, phoneDigits } from "@/shared/phone";
import { useColors } from "@/theme";

const GENDERS: { id: VetProfile["gender"]; label: string }[] = [
  { id: "female", label: "หญิง" },
  { id: "male", label: "ชาย" },
  { id: "unspecified", label: "ไม่ระบุ" },
];

/** แก้โปรไฟล์หมอ — updateMyVetProfile / updateMyVetAvatar ของเว็บ (เลขใบประกอบตรวจซ้ำที่ server) */
export default function VetProfileEdit() {
  const { data, isLoading, error, refetch } = useVetProfile();
  if (isLoading) return <LoadingView />;
  if (error || !data) return <ErrorView message={(error as Error)?.message ?? "โหลดไม่สำเร็จ"} onRetry={refetch} />;
  return <Form p={data} />;
}

function Form({ p }: { p: VetProfile }) {
  const c = useColors();
  const qc = useQueryClient();
  const { data: home } = useVetHome();
  const [f, setF] = useState({
    full_name: p.fullName,
    phone: p.phone ?? "",
    gender: p.gender,
    license_number: p.licenseNumber ?? "",
    years_of_experience: p.yearsOfExperience != null ? String(p.yearsOfExperience) : "",
    specialties: (p.specialties ?? []).join(", "),
    bio: p.bio ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const refresh = () => qc.invalidateQueries({ queryKey: ["vet"] });

  const save = useMutation({
    mutationFn: () => vetStaffApi.updateProfile({ ...f, phone: phoneDigits(f.phone) || null }),
    onSuccess: () => {
      toast.success("บันทึกโปรไฟล์แล้ว");
      void refresh();
      router.back();
    },
    onError: (e: Error) => setError(e.message),
  });

  async function changeAvatar() {
    const file = await pickImageWithChoice(true);
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadApi.avatar(file);
      await vetStaffApi.setAvatar(url);
      toast.success("เปลี่ยนรูปแล้ว");
      void refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Screen header={<AppBar title="แก้ไขโปรไฟล์" back />} footer={<Button label="บันทึก" size="lg" full loading={save.isPending} onPress={() => save.mutate()} />}>
      <View style={{ alignItems: "center", gap: 6 }}>
        <Pressable onPress={changeAvatar} disabled={uploading} accessibilityLabel="เปลี่ยนรูปโปรไฟล์">
          <Avatar url={home?.vet?.avatar_url ?? p.avatarUrl} name={p.fullName} size={92} />
          <View style={{ position: "absolute", right: -2, bottom: -2, width: 34, height: 34, borderRadius: 17, backgroundColor: c.brandSolid, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: c.bg }}>
            <Camera size={16} color="#fff" />
          </View>
        </Pressable>
        <Txt size={13} tone="muted">
          {uploading ? "กำลังอัปโหลด…" : p.email}
        </Txt>
      </View>
      {error && <Notice tone="danger">{error}</Notice>}
      <Field label="ชื่อ-นามสกุล" required value={f.full_name} onChangeText={set("full_name")} />
      <Field label="เบอร์โทร" value={formatThaiPhone(f.phone)} onChangeText={set("phone")} keyboardType="phone-pad" />
      <SectionTitle>เพศ (ใช้เลือกภาพโปรไฟล์ตั้งต้น)</SectionTitle>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {GENDERS.map((g) => (
          <Chip key={g.id} label={g.label} selected={f.gender === g.id} onPress={() => setF((x) => ({ ...x, gender: g.id }))} />
        ))}
      </View>
      <Field
        label="เลขใบประกอบวิชาชีพ"
        value={f.license_number}
        onChangeText={set("license_number")}
        hint={p.licenseVerified ? "ยืนยันแล้ว" : "ใช้จับคู่บัญชี ไม่แสดงต่อสาธารณะ"}
      />
      <Field label="ประสบการณ์ (ปี)" value={f.years_of_experience} onChangeText={(v) => set("years_of_experience")(v.replace(/\D/g, ""))} keyboardType="number-pad" />
      <Field label="ความเชี่ยวชาญ" value={f.specialties} onChangeText={set("specialties")} hint="คั่นด้วยเครื่องหมายจุลภาค เช่น อายุรกรรม, ผิวหนัง" />
      <Field label="แนะนำตัว" value={f.bio} onChangeText={set("bio")} multiline maxLength={1000} />
    </Screen>
  );
}
