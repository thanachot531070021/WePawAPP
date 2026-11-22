import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { View } from "react-native";
import { meApi } from "@/api/endpoints";
import { BrandMark, Button, Field, LoadingView, Notice, Screen, Txt } from "@/components/ui";
import { staffKeys, useStaffMe } from "@/features/staffQueries";
import { qk } from "@/lib/queryClient";

/**
 * บัญชีที่ใช้รหัสผ่านชั่วคราว (must_change_password) ต้องตั้งรหัสใหม่ก่อนใช้งาน — เหมือน /auth/change-password ของเว็บ
 * รหัสชั่วคราวมาจาก: คลินิกสร้างบัญชีหมอให้ / แอดมินออกรหัสชั่วคราวตอนลืมรหัสผ่าน (ทุก role)
 */
export function PasswordGate({ children }: { children: ReactNode }) {
  const { data, isLoading } = useStaffMe();
  if (isLoading) return <LoadingView />;
  if (data?.must_change_password) return <ForceChangePassword />;
  return <>{children}</>;
}

/** บัญชีที่คลินิกสร้างให้ (รหัสชั่วคราว) — ต้องตั้งรหัสใหม่ก่อนเข้าใช้งาน เหมือน /auth/change-password ของเว็บ */
export function ForceChangePassword() {
  const qc = useQueryClient();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () => meApi.changePassword(current, next),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: staffKeys.me });
      void qc.invalidateQueries({ queryKey: qk.me });
    },
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
          บัญชีนี้ใช้รหัสผ่านชั่วคราว — ตั้งรหัสใหม่ที่จำได้ก่อนเริ่มใช้งาน
        </Txt>
      </View>
      {error && <Notice tone="danger">{error}</Notice>}
      <Field label="รหัสผ่านชั่วคราว" value={current} onChangeText={setCurrent} secure />
      <Field label="รหัสผ่านใหม่" value={next} onChangeText={setNext} secure hint="อย่างน้อย 8 ตัวอักษร" />
      <Field label="ยืนยันรหัสผ่านใหม่" value={confirm} onChangeText={setConfirm} secure />
    </Screen>
  );
}
