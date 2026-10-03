import * as Notifications from "expo-notifications";
import { BellRing } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Linking, Platform, View } from "react-native";
import { AppBar, Button, Card, Notice, Screen, toast, Txt } from "@/components/ui";
import { registerPush } from "@/lib/push";
import { useColors } from "@/theme";

/** เปิดการแจ้งเตือนแบบ push — นัดถูกรับ/เปลี่ยนแปลง วัคซีนใกล้ครบ ข้อความใหม่จากคลินิก */
export default function NotificationSettings() {
  const c = useColors();
  const [status, setStatus] = useState<string>("undetermined");

  useEffect(() => {
    if (Platform.OS === "web") return;
    void Notifications.getPermissionsAsync().then((p) => setStatus(p.status));
  }, []);

  async function enable() {
    const ok = await registerPush(true);
    const p = await Notifications.getPermissionsAsync();
    setStatus(p.status);
    if (ok) toast.success("เปิดการแจ้งเตือนแล้ว");
    else if (p.status === "denied") toast.error("ระบบปิดการแจ้งเตือนของแอปไว้ — เปิดได้ที่การตั้งค่าเครื่อง");
  }

  return (
    <Screen header={<AppBar title="ตั้งค่าการแจ้งเตือน" back />}>
      <Card style={{ alignItems: "center", gap: 10, paddingVertical: 24 }}>
        <BellRing size={40} color={c.brand} />
        <Txt size={17} weight="bold" align="center">
          {status === "granted" ? "เปิดการแจ้งเตือนอยู่" : "เปิดการแจ้งเตือนในเครื่อง"}
        </Txt>
        <Txt tone="muted" align="center">
          รู้ทันทีเมื่อคลินิกรับคำขอจอง วัคซีนของน้องใกล้ครบกำหนด หรือมีข้อความใหม่
        </Txt>
      </Card>
      {Platform.OS === "web" ? (
        <Notice tone="info">การแจ้งเตือนแบบ push ใช้ได้บนแอป Android / iOS</Notice>
      ) : status === "granted" ? (
        <Button label="ลงทะเบียนเครื่องนี้อีกครั้ง" variant="outline" full onPress={enable} />
      ) : status === "denied" ? (
        <View style={{ gap: 8 }}>
          <Notice tone="warn">ระบบปิดการแจ้งเตือนของแอปไว้</Notice>
          <Button label="เปิดการตั้งค่าเครื่อง" full onPress={() => Linking.openSettings()} />
        </View>
      ) : (
        <Button label="เปิดการแจ้งเตือน" size="lg" full onPress={enable} />
      )}
      <Txt size={12.5} tone="faint" align="center">
        การแจ้งเตือนในแอป (กระดิ่ง) ยังแสดงครบทุกรายการแม้ปิด push
      </Txt>
    </Screen>
  );
}
