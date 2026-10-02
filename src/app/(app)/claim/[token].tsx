import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ClipboardList, ExternalLink } from "lucide-react-native";
import { WEB_BASE_URL } from "@/api/config";
import { AppBar, Button, Card, Screen, Txt } from "@/components/ui";
import { useColors } from "@/theme";

/**
 * ลิงก์รับน้องจากคลินิก (/claim/[token]) — flow นี้ยืนยันตัวตนและตั้งบัญชีด้วยกติกาที่ซับซ้อน
 * (บัญชีที่คลินิกสร้าง vs บัญชีที่สมัครเอง — app/actions/pet-claim.ts) จึงเปิดหน้าเว็บตัวจริงให้ทำต่อ
 * เสร็จแล้วกลับมาแอป น้องจะขึ้นในแท็บ "น้องของฉัน"
 */
export default function ClaimScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const c = useColors();
  return (
    <Screen header={<AppBar title="รับน้องเข้าบัญชี" back />}>
      <Card style={{ alignItems: "center", gap: 10, paddingVertical: 28 }}>
        <ClipboardList size={42} color={c.brand} />
        <Txt size={18} weight="bold" align="center">
          คลินิกส่งแฟ้มของน้องมาให้คุณ
        </Txt>
        <Txt tone="muted" align="center">
          ยืนยันรับน้องผ่านหน้าเว็บ PetCare (ใช้บัญชีเดียวกับแอป) แล้วกลับมาที่แอป — ประวัติวัคซีน น้ำหนัก และการรักษาจะติดมาครบ
        </Txt>
      </Card>
      <Button
        label="เปิดหน้ายืนยัน"
        icon={ExternalLink}
        size="lg"
        full
        onPress={() => WebBrowser.openBrowserAsync(`${WEB_BASE_URL}/claim/${encodeURIComponent(token)}`)}
      />
    </Screen>
  );
}
