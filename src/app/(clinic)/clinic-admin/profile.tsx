import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import type { ClinicProfile } from "@/api/staffTypes";
import { clinicStaffApi } from "@/api/staffEndpoints";
import { AppBar, Button, ErrorView, Field, LoadingView, Notice, Screen, SectionTitle, toast } from "@/components/ui";
import { useClinicProfile } from "@/features/staffQueries";
import { formatThaiPhone, phoneDigits } from "@/shared/phone";

type Form = Record<
  "name" | "description" | "phone" | "email" | "line_id" | "website" | "facebook_url" | "address_line" | "sub_district" | "district" | "province" | "postal_code",
  string
>;

const toForm = (p: ClinicProfile): Form => ({
  name: p.name ?? "",
  description: p.description ?? "",
  phone: p.phone ?? "",
  email: p.email ?? "",
  line_id: p.line_id ?? "",
  website: p.website ?? "",
  facebook_url: p.facebook_url ?? "",
  address_line: p.address_line ?? "",
  sub_district: p.sub_district ?? "",
  district: p.district ?? "",
  province: p.province ?? "",
  postal_code: p.postal_code ?? "",
});

/** ข้อมูลคลินิก — updateClinicProfile() ของเว็บ (ส่งครบทุกฟิลด์) · ปก/โลโก้/แกลเลอรี/ตำแหน่งบนแผนที่ แก้บนเว็บ */
export default function ClinicProfileScreen() {
  const { data, isLoading, error, refetch } = useClinicProfile();
  if (isLoading) return <LoadingView />;
  if (error || !data) return <ErrorView message={(error as Error)?.message ?? "โหลดไม่สำเร็จ"} onRetry={refetch} />;
  return <ProfileForm initial={toForm(data)} />;
}

function ProfileForm({ initial }: { initial: Form }) {
  const qc = useQueryClient();
  const [f, setF] = useState<Form>(initial);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof Form) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const m = useMutation({
    mutationFn: () => clinicStaffApi.updateProfile({ ...f, phone: phoneDigits(f.phone) || "" } as never),
    onSuccess: () => {
      toast.success("บันทึกข้อมูลคลินิกแล้ว");
      void qc.invalidateQueries({ queryKey: ["clinic"] });
      router.back();
    },
    onError: (e: Error) => setError(e.message),
  });
  return (
    <Screen header={<AppBar title="ข้อมูลคลินิก" back />} footer={<Button label="บันทึก" size="lg" full loading={m.isPending} onPress={() => m.mutate()} />}>
      {error && <Notice tone="danger">{error}</Notice>}
      <Field label="ชื่อคลินิก" required value={f.name} onChangeText={set("name")} />
      <Field label="คำอธิบาย" value={f.description} onChangeText={set("description")} multiline />
      <SectionTitle>ติดต่อ</SectionTitle>
      <Field label="เบอร์โทร" value={formatThaiPhone(f.phone)} onChangeText={set("phone")} keyboardType="phone-pad" />
      <Field label="อีเมล" value={f.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
      <Field label="LINE ID" value={f.line_id} onChangeText={set("line_id")} autoCapitalize="none" />
      <Field label="เว็บไซต์" value={f.website} onChangeText={set("website")} autoCapitalize="none" />
      <Field label="Facebook" value={f.facebook_url} onChangeText={set("facebook_url")} autoCapitalize="none" />
      <SectionTitle>ที่อยู่</SectionTitle>
      <Field label="ที่อยู่" required value={f.address_line} onChangeText={set("address_line")} multiline />
      <Field label="แขวง / ตำบล" value={f.sub_district} onChangeText={set("sub_district")} />
      <Field label="เขต / อำเภอ" required value={f.district} onChangeText={set("district")} />
      <Field label="จังหวัด" required value={f.province} onChangeText={set("province")} />
      <Field label="รหัสไปรษณีย์" value={f.postal_code} onChangeText={set("postal_code")} keyboardType="number-pad" />
    </Screen>
  );
}
