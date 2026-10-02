import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { meApi } from "@/api/endpoints";
import { AppBar, Button, Field, Notice, Screen, toast } from "@/components/ui";

/** เปลี่ยนรหัสผ่าน — changeOwnPassword() ตัวเดียวกับ /auth/change-password */
export default function PasswordSettings() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () => meApi.changePassword(current, next),
    onSuccess: () => {
      toast.success("เปลี่ยนรหัสผ่านแล้ว");
      router.back();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Screen
      header={<AppBar title="เปลี่ยนรหัสผ่าน" back />}
      footer={
        <Button
          label="เปลี่ยนรหัสผ่าน"
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
      {error && <Notice tone="danger">{error}</Notice>}
      <Field label="รหัสผ่านปัจจุบัน" value={current} onChangeText={setCurrent} secure autoComplete="current-password" />
      <Field label="รหัสผ่านใหม่" value={next} onChangeText={setNext} secure hint="อย่างน้อย 8 ตัวอักษร" autoComplete="new-password" />
      <Field label="ยืนยันรหัสผ่านใหม่" value={confirm} onChangeText={setConfirm} secure autoComplete="new-password" />
    </Screen>
  );
}
