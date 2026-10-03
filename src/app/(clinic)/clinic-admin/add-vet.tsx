import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { CheckCircle2, MailCheck, UserPlus } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { ApiError } from "@/api/client";
import { clinicStaffApi } from "@/api/staffEndpoints";
import { ActivationLinkCard } from "@/components/staff/ActivationLinkCard";
import { AppBar, Button, Card, Chip, Field, Notice, Screen, Txt } from "@/components/ui";
import { useClinicOverview } from "@/features/staffQueries";
import { formatThaiPhone, phoneDigits, PHONE_PLACEHOLDER, thaiPhoneError } from "@/shared/phone";
import { useColors } from "@/theme";

const ROLES = [
  { id: "full_time", label: "ประจำ" },
  { id: "part_time", label: "บางเวลา" },
  { id: "freelance", label: "อิสระ" },
] as const;

type Result = { name: string; outcome: "created_pending" | "linked_existing"; activationPath?: string };

/**
 * เพิ่มสัตวแพทย์ — createVet() ของเว็บ (/clinic-admin/vets/new)
 * หมอใหม่ → ได้ลิงก์เปิดใช้งานให้ส่งต่อทาง LINE · หมอที่มีบัญชีอยู่แล้ว → ได้คำเชิญในแอปของหมอ
 * แอปบังคับอีเมล (เว็บรับเบอร์อย่างเดียวได้) เพราะเข้าสู่ระบบด้วยอีเมลเท่านั้น
 */
export default function AddVet() {
  const c = useColors();
  const qc = useQueryClient();
  const { data: overview } = useClinicOverview();
  const [f, setF] = useState({ full_name: "", email: "", phone: "", license_number: "", years: "" });
  const [role, setRole] = useState<(typeof ROLES)[number]["id"]>("full_time");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const m = useMutation({
    mutationFn: () =>
      clinicStaffApi.addVet({
        full_name: f.full_name.trim(),
        email: f.email.trim().toLowerCase(),
        phone: phoneDigits(f.phone) || null,
        license_number: f.license_number.trim() || null,
        years_of_experience: f.years || null,
        role_at_clinic: role,
      }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["clinic"] });
      setResult({ name: f.full_name.trim(), outcome: res.data.outcome, activationPath: res.data.activationPath });
    },
    onError: (e: Error) => {
      setError(e.message);
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
    },
  });

  function submit() {
    const e: Record<string, string> = {};
    if (f.full_name.trim().length < 2) e.full_name = "กรุณากรอกชื่อ-นามสกุล";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "กรอกอีเมลของหมอ — ใช้เข้าสู่ระบบแอป";
    const pe = thaiPhoneError(f.phone);
    if (pe) e.phone = pe;
    setErrors(e);
    setError(null);
    if (!Object.keys(e).length) m.mutate();
  }

  if (result) {
    return (
      <Screen header={<AppBar title="เพิ่มสัตวแพทย์" back />} footer={<Button label="เสร็จแล้ว" size="lg" full onPress={() => router.back()} />}>
        {result.outcome === "created_pending" && result.activationPath ? (
          <>
            <View style={{ alignItems: "center", gap: 8, paddingTop: 12 }}>
              <CheckCircle2 size={60} color={c.brand} />
              <Txt size={20} weight="bold" align="center">
                เพิ่ม {result.name} แล้ว
              </Txt>
              <Txt tone="muted" align="center">
                ส่งลิงก์นี้ให้หมอ — เปิดแล้วตั้งรหัสผ่าน จากนั้นเข้าสู่ระบบแอป WePaw ด้วยอีเมล {f.email.trim().toLowerCase()}
              </Txt>
            </View>
            <ActivationLinkCard vetName={result.name} clinicName={overview?.clinic.name ?? ""} path={result.activationPath} />
          </>
        ) : (
          <View style={{ alignItems: "center", gap: 8, paddingTop: 12 }}>
            <MailCheck size={60} color={c.brand} />
            <Txt size={20} weight="bold" align="center">
              ส่งคำเชิญแล้ว
            </Txt>
            <Txt tone="muted" align="center">
              {result.name} มีบัญชี WePaw อยู่แล้ว — หมอจะเห็นคำเชิญที่หน้า “วันนี้” ในแอป กดตอบรับแล้วเริ่มทำงานกับคลินิกได้ทันที
            </Txt>
          </View>
        )}
      </Screen>
    );
  }

  return (
    <Screen
      header={<AppBar title="เพิ่มสัตวแพทย์" back />}
      footer={<Button label="เพิ่มสัตวแพทย์" icon={UserPlus} size="lg" full loading={m.isPending} onPress={submit} testID="add-vet" />}
    >
      <Txt tone="muted">กรอกข้อมูลหมอ แล้วส่งลิงก์เปิดใช้งานให้หมอทาง LINE — ถ้าหมอมีบัญชี WePaw อยู่แล้ว ระบบจะส่งคำเชิญแทน</Txt>
      {error && <Notice tone="danger">{error}</Notice>}
      <Field label="ชื่อ-นามสกุล" required value={f.full_name} onChangeText={set("full_name")} error={errors.full_name} placeholder="เช่น สพ.ญ. มาลี รักสัตว์" />
      <Field
        label="อีเมลของหมอ"
        required
        value={f.email}
        onChangeText={set("email")}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        hint="หมอใช้อีเมลนี้เข้าสู่ระบบ"
      />
      <Field label="เบอร์โทร" value={formatThaiPhone(f.phone)} onChangeText={set("phone")} error={errors.phone} keyboardType="phone-pad" placeholder={PHONE_PLACEHOLDER} hint="ไม่บังคับ" />
      <Field
        label="เลขใบประกอบวิชาชีพ"
        value={f.license_number}
        onChangeText={set("license_number")}
        error={errors.license_number}
        hint="ไม่บังคับ — ใช้จับคู่ถ้าหมอมีบัญชีอยู่แล้ว"
      />
      <Field label="ประสบการณ์ (ปี)" value={f.years} onChangeText={(v) => set("years")(v.replace(/\D/g, "").slice(0, 2))} error={errors.years_of_experience} keyboardType="number-pad" />
      <Card style={{ gap: 8 }}>
        <Txt size={13.5} weight="medium" tone="muted">
          รูปแบบการทำงาน
        </Txt>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {ROLES.map((r) => (
            <Chip key={r.id} label={r.label} selected={role === r.id} onPress={() => setRole(r.id)} />
          ))}
        </View>
      </Card>
    </Screen>
  );
}
