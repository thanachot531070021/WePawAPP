import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { ApiError } from "@/api/client";
import { authApi } from "@/api/endpoints";
import { AppBar, Button, Field, Notice, Screen, Txt } from "@/components/ui";
import { APP_ROLES, UNSUPPORTED_ROLE_MESSAGE, useSession, type AppRole } from "@/state/session";

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
      if (!APP_ROLES.includes(res.user.role as AppRole)) {
        setError(UNSUPPORTED_ROLE_MESSAGE);
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
        <Txt tone="muted">ใช้บัญชีเดียวกับเว็บ PetCare — เจ้าของสัตว์เลี้ยง คลินิก และสัตวแพทย์</Txt>
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
        <Txt tone="brand" weight="semibold" onPress={() => router.replace("/join")}>
          สมัครสมาชิก
        </Txt>
      </View>
    </Screen>
  );
}
