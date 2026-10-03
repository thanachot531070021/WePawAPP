import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { KeyRound, UserX } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { meApi } from "@/api/endpoints";
import { StaffSettings } from "@/components/staff/StaffSettings";
import { BrandMark, Button, Card, ErrorView, Field, LoadingView, Notice, Screen, Txt } from "@/components/ui";
import { staffKeys, useStaffMe } from "@/features/staffQueries";
import { useColors } from "@/theme";

/**
 * กลุ่มหน้าของสัตวแพทย์ — เงื่อนไขเดียวกับ requireVet() ของเว็บ:
 * รหัสชั่วคราว (must_change_password) → ต้องเปลี่ยนก่อน · บัญชียังไม่ activate → ใช้งานไม่ได้
 * ไม่มีคลินิกไม่ใช่เหตุให้ออก — ทุกหน้าแค่ว่าง และเห็นคำเชิญจากคลินิกที่แท็บวันนี้
 */
export default function VetLayout() {
  const c = useColors();
  const { data, isLoading, error, refetch } = useStaffMe();
  if (isLoading) return <LoadingView />;
  if (error || !data)
    return (
      <Screen>
        <ErrorView message={(error as Error)?.message ?? "โหลดข้อมูลไม่สำเร็จ"} onRetry={refetch} />
      </Screen>
    );
  if (data.must_change_password) return <ForceChangePassword />;
  if (!data.vet || data.vet.account_status !== "active") {
    return (
      <Screen>
        <Card style={{ alignItems: "center", gap: 10, paddingVertical: 32, marginTop: 40 }}>
          <UserX size={44} color={c.warn} />
          <Txt size={18} weight="bold" align="center">
            บัญชีสัตวแพทย์ยังไม่เปิดใช้งาน
          </Txt>
          <Txt tone="muted" align="center">
            เปิดใช้งานจากลิงก์ที่คลินิกส่งให้ก่อน แล้วเข้าสู่ระบบอีกครั้ง
          </Txt>
        </Card>
        <StaffSettings />
      </Screen>
    );
  }
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />;
}

/** บัญชีที่คลินิกสร้างให้ (รหัสชั่วคราว) — ต้องตั้งรหัสใหม่ก่อนเข้าใช้งาน เหมือน /auth/change-password ของเว็บ */
function ForceChangePassword() {
  const qc = useQueryClient();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () => meApi.changePassword(current, next),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.me }),
    onError: (e: Error) => setError(e.message),
  });
  return (
    <Screen
      footer={
        <Button
          label="ตั้งรหัสผ่านใหม่"
          icon={KeyRound}
          size="lg"
          full
          loading={m.isPending}
          onPress={() => {
            if (next.length < 8) return setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
            if (next !== confirm) return setError("รหัสผ่านยืนยันไม่ตรงกัน");
            setError(null);
            m.mutate();
          }}
        />
      }
    >
      <View style={{ alignItems: "center", gap: 10, paddingTop: 40 }}>
        <BrandMark size={60} />
        <Txt size={20} weight="bold" align="center">
          ตั้งรหัสผ่านใหม่ก่อนเริ่มใช้งาน
        </Txt>
        <Txt tone="muted" align="center">
          บัญชีนี้ใช้รหัสผ่านชั่วคราวที่คลินิกตั้งให้
        </Txt>
      </View>
      {error && <Notice tone="danger">{error}</Notice>}
      <Field label="รหัสผ่านชั่วคราว" value={current} onChangeText={setCurrent} secure />
      <Field label="รหัสผ่านใหม่" value={next} onChangeText={setNext} secure hint="อย่างน้อย 8 ตัวอักษร" />
      <Field label="ยืนยันรหัสผ่านใหม่" value={confirm} onChangeText={setConfirm} secure />
    </Screen>
  );
}
