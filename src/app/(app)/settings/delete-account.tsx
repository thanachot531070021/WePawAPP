import { useMutation } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react-native";
import { useState } from "react";
import { meApi } from "@/api/endpoints";
import { AppBar, Button, Card, Checkbox, Field, Notice, Screen, Txt } from "@/components/ui";
import { useMe } from "@/features/queries";
import { unregisterPush } from "@/lib/push";
import { useSession } from "@/state/session";

/**
 * ลบบัญชี (App Store / Google Play บังคับให้ทำได้ในแอป) — DELETE /api/mobile/me
 * บัญชีอีเมลยืนยันด้วยรหัสผ่าน · บัญชี social ยืนยันด้วยการติ๊ก
 */
export default function DeleteAccount() {
  const signOut = useSession((s) => s.signOut);
  const me = useMe();
  const social = !!me.data?.profile?.has_social;
  const [password, setPassword] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: async () => {
      await unregisterPush();
      return meApi.deleteAccount(password ? { password } : { confirm: true });
    },
    onSuccess: () => signOut(),
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Screen
      header={<AppBar title="ลบบัญชี" back />}
      footer={
        <Button
          label="ลบบัญชีถาวร"
          variant="danger"
          size="lg"
          full
          loading={m.isPending}
          disabled={!understood || (!social && !password)}
          onPress={() => m.mutate()}
        />
      }
    >
      <Notice tone="danger" icon={AlertTriangle}>
        การลบบัญชีย้อนกลับไม่ได้
      </Notice>
      <Card style={{ gap: 6 }}>
        <Txt weight="semibold">สิ่งที่จะเกิดขึ้น</Txt>
        <Txt size={14} tone="muted">• นัดที่ยังไม่ถึงจะถูกยกเลิก และคลินิกได้รับแจ้ง</Txt>
        <Txt size={14} tone="muted">• สัตว์เลี้ยงและประวัติของคุณจะถูกลบออกจากบัญชี</Txt>
        <Txt size={14} tone="muted">• สิทธิ์ดูแลน้องที่คนอื่นแชร์ให้จะถูกเพิกถอน</Txt>
        <Txt size={14} tone="muted">• ข้อมูลส่วนตัว (ชื่อ อีเมล เบอร์ รูป) จะถูกล้าง — รีวิวที่เคยเขียนจะแสดงเป็นผู้ใช้ที่ลบบัญชีแล้ว</Txt>
        <Txt size={14} tone="muted">• ใช้ได้ทั้งแอปและเว็บ PetCare</Txt>
      </Card>
      {error && <Notice tone="danger">{error}</Notice>}
      {!social || password ? (
        <Field label="ยืนยันด้วยรหัสผ่าน" value={password} onChangeText={setPassword} secure />
      ) : null}
      <Checkbox checked={understood} onChange={setUnderstood}>
        ฉันเข้าใจว่าการลบบัญชีย้อนกลับไม่ได้
      </Checkbox>
    </Screen>
  );
}
