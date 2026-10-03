import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { ApiError } from "@/api/client";
import { authApi } from "@/api/endpoints";
import { AppBar, Button, Card, Checkbox, Field, Notice, Screen, Txt } from "@/components/ui";
import { formatThaiPhone, phoneDigits, PHONE_PLACEHOLDER, thaiPhoneError } from "@/shared/phone";
import { useSession } from "@/state/session";
import { useColors } from "@/theme";

/** สมัครเจ้าของสัตว์ — ฟิลด์ + consent PDPA ชุดเดียวกับ /auth/signup (ห้ามตัด field consent ออก) */
export default function SignUp() {
  const c = useColors();
  const signIn = useSession((s) => s.signIn);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [share, setShare] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    const e: Record<string, string> = {};
    if (form.full_name.trim().length < 2) e.full_name = "กรุณากรอกชื่อ-นามสกุล";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (form.password.length < 8) e.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    const pe = thaiPhoneError(form.phone);
    if (pe) e.phone = pe;
    if (!terms) e.consent_terms = "ต้องยอมรับเงื่อนไขการใช้งาน";
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    setError(null);
    try {
      const res = await authApi.signup({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: phoneDigits(form.phone) || null,
        consent_terms: true,
        consent_marketing: marketing,
        consent_data_sharing: share,
      });
      await signIn(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fieldErrors) setErrors(err.fieldErrors);
      } else setError("สมัครไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      header={<AppBar title="สมัครสมาชิก" back />}
      footer={<Button label="สร้างบัญชี" size="lg" full loading={busy} onPress={submit} testID="submit" />}
    >
      <View style={{ gap: 4 }}>
        <Txt size={22} weight="bold">
          เริ่มดูแลน้องกับ WePaw
        </Txt>
        <Txt tone="muted">บัญชีเจ้าของสัตว์เลี้ยง — สมัครครั้งเดียว ใช้ได้ทั้งแอปและเว็บ</Txt>
      </View>
      {error && <Notice tone="danger">{error}</Notice>}
      <Field label="ชื่อ-นามสกุล" required value={form.full_name} onChangeText={set("full_name")} error={errors.full_name} autoComplete="name" />
      <Field
        label="อีเมล"
        required
        value={form.email}
        onChangeText={set("email")}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Field
        label="รหัสผ่าน"
        required
        value={form.password}
        onChangeText={set("password")}
        error={errors.password}
        secure
        hint="อย่างน้อย 8 ตัวอักษร"
        autoComplete="new-password"
      />
      <Field
        label="เบอร์โทร"
        value={formatThaiPhone(form.phone)}
        onChangeText={set("phone")}
        error={errors.phone}
        keyboardType="phone-pad"
        placeholder={PHONE_PLACEHOLDER}
        hint="ใช้ติดต่อเรื่องนัดหมาย และจำเป็นสำหรับการขอหมอเยี่ยมบ้าน"
      />
      <Card style={{ gap: 6, borderColor: terms ? c.brand : c.border }}>
        <Checkbox checked={terms} onChange={setTerms}>
          <Txt size={14}>
            ฉันยอมรับ <Txt size={14} tone="brand">ข้อกำหนดการใช้งาน</Txt> และ{" "}
            <Txt size={14} tone="brand">นโยบายความเป็นส่วนตัว</Txt> ของ PetCare
          </Txt>
        </Checkbox>
        {errors.consent_terms && (
          <Txt size={12.5} tone="danger">
            {errors.consent_terms}
          </Txt>
        )}
      </Card>
      <Card style={{ gap: 6 }}>
        <Txt size={13} weight="semibold" tone="muted">
          ไม่บังคับ
        </Txt>
        <Checkbox checked={marketing} onChange={setMarketing}>
          รับข่าวสาร โปรโมชั่น และคำแนะนำการดูแลสัตว์ทางอีเมล
        </Checkbox>
        <Checkbox checked={share} onChange={setShare}>
          อนุญาตให้แชร์ข้อมูลทั่วไป (ไม่รวมข้อมูลส่วนตัว) กับพาร์ทเนอร์
        </Checkbox>
        <Txt size={12} tone="faint">
          ยกเลิก consent ได้ทุกเมื่อในหน้าตั้งค่า
        </Txt>
      </Card>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
        <Txt tone="muted">มีบัญชีแล้ว?</Txt>
        <Txt tone="brand" weight="semibold" onPress={() => router.replace("/sign-in")}>
          เข้าสู่ระบบ
        </Txt>
      </View>
    </Screen>
  );
}
