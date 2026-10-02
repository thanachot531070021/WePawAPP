import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { ApiError } from "@/api/client";
import { authApi } from "@/api/endpoints";
import { AppBar, Button, Field, Notice, Screen, Txt } from "@/components/ui";
import { OWNER_ONLY_MESSAGE, useSession } from "@/state/session";

export default function SignIn() {
  const signIn = useSession((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await authApi.login(email.trim().toLowerCase(), password);
      if (res.user.role !== "pet_owner") {
        setError(OWNER_ONLY_MESSAGE);
        return;
      }
      await signIn(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen header={<AppBar title="เข้าสู่ระบบ" back />} contentStyle={{ gap: 18, paddingTop: 24 }}>
      <View style={{ gap: 4 }}>
        <Txt size={22} weight="bold">
          ยินดีต้อนรับกลับมา
        </Txt>
        <Txt tone="muted">ใช้อีเมลเดียวกับที่สมัครบนเว็บ PetCare ได้เลย</Txt>
      </View>
      {error && <Notice tone="danger">{error}</Notice>}
      <Field
        label="อีเมล"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        placeholder="you@example.com"
        testID="email"
      />
      <Field
        label="รหัสผ่าน"
        value={password}
        onChangeText={setPassword}
        secure
        autoComplete="password"
        textContentType="password"
        onSubmitEditing={submit}
        testID="password"
      />
      <Button label="เข้าสู่ระบบ" size="lg" full loading={busy} onPress={submit} testID="submit" />
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
        <Txt tone="muted">ยังไม่มีบัญชี?</Txt>
        <Txt tone="brand" weight="semibold" onPress={() => router.replace("/sign-up")}>
          สมัครสมาชิก
        </Txt>
      </View>
    </Screen>
  );
}
