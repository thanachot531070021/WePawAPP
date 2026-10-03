import * as Clipboard from "expo-clipboard";
import { Copy, Send } from "lucide-react-native";
import { Share, View } from "react-native";
import { WEB_BASE_URL } from "@/api/config";
import { Button, Card, toast, Txt } from "@/components/ui";
import { useColors } from "@/theme";

/** ลิงก์เปิดใช้งานบัญชีหมอ (/activate/vet/<token> ของเว็บ อายุ 14 วัน) + ปุ่มส่งทาง LINE / คัดลอก */
export function ActivationLinkCard({ vetName, clinicName, path }: { vetName: string; clinicName: string; path: string }) {
  const c = useColors();
  const url = `${WEB_BASE_URL}${path}`;
  const message = [
    `สวัสดี ${vetName}`,
    `${clinicName || "คลินิก"} เพิ่มคุณเป็นสัตวแพทย์ในแอป WePaw แล้ว`,
    `1) เปิดลิงก์นี้เพื่อตั้งรหัสผ่าน (ใช้ได้ 14 วัน): ${url}`,
    "2) เปิดแอป WePaw แล้วเข้าสู่ระบบด้วยอีเมลของคุณ",
  ].join("\n");
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ padding: 12, borderRadius: 12, backgroundColor: c.surfaceAlt }}>
        <Txt size={13} selectable numberOfLines={2}>
          {url}
        </Txt>
      </View>
      <Button label="ส่งให้หมอ (LINE / ข้อความ)" icon={Send} full onPress={() => Share.share({ message })} />
      <Button
        label="คัดลอกลิงก์"
        icon={Copy}
        variant="outline"
        full
        onPress={async () => {
          await Clipboard.setStringAsync(url);
          toast.success("คัดลอกลิงก์แล้ว");
        }}
      />
    </Card>
  );
}
