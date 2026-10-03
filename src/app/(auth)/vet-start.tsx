import { router } from "expo-router";
import { Building2, KeyRound, Link2, Send, Stethoscope, type LucideIcon } from "lucide-react-native";
import { Share, View } from "react-native";
import { AppBar, Button, Card, Notice, Screen, Txt } from "@/components/ui";
import { useColors } from "@/theme";

const STEPS: { Icon: LucideIcon; title: string; body: string }[] = [
  { Icon: Building2, title: "ให้คลินิกเพิ่มคุณในแอป", body: "ที่แอป WePaw ของคลินิก: จัดการ → สัตวแพทย์ → เพิ่มสัตวแพทย์" },
  { Icon: Link2, title: "รับลิงก์เปิดใช้งาน", body: "คลินิกส่งลิงก์ให้คุณทาง LINE หรือข้อความ (ใช้ได้ 14 วัน)" },
  { Icon: KeyRound, title: "ตั้งรหัสผ่าน แล้วเข้าสู่ระบบ", body: "เปิดลิงก์ ตั้งรหัสผ่าน แล้วกลับมาเข้าสู่ระบบที่แอปนี้ด้วยอีเมลเดียวกัน" },
];

const INVITE_MESSAGE =
  "รบกวนเพิ่มฉันเป็นสัตวแพทย์ของคลินิกในแอป WePaw หน่อยนะ\n(จัดการ → สัตวแพทย์ → เพิ่มสัตวแพทย์) แล้วส่งลิงก์เปิดใช้งานกลับมาให้ด้วย ขอบคุณมาก";

/**
 * สัตวแพทย์เริ่มใช้งาน — บัญชีหมอเปิดได้ผ่านคลินิก (createVet → ลิงก์ /activate/vet/<token>)
 * ไม่มีฟอร์มหมอสมัครเอง เพราะ startVetSelfSignup ส่งลิงก์ยืนยันทางอีเมล ซึ่งเว็บยังไม่มีระบบส่ง
 */
export default function VetStart() {
  const c = useColors();
  return (
    <Screen
      header={<AppBar title="สำหรับสัตวแพทย์" back />}
      footer={
        <View style={{ gap: 10 }}>
          <Button label="มีลิงก์แล้ว — เข้าสู่ระบบ" size="lg" full onPress={() => router.replace("/sign-in")} />
          <Button
            label="ส่งข้อความขอให้คลินิกเพิ่มฉัน"
            icon={Send}
            variant="outline"
            full
            onPress={() => Share.share({ message: INVITE_MESSAGE })}
          />
        </View>
      }
    >
      <View style={{ alignItems: "center", gap: 10, paddingVertical: 8 }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: c.brandSoft, alignItems: "center", justifyContent: "center" }}>
          <Stethoscope size={32} color={c.brand} />
        </View>
        <Txt size={21} weight="bold" align="center">
          เริ่มใช้งานใน 3 ขั้นตอน
        </Txt>
        <Txt tone="muted" align="center">
          บัญชีสัตวแพทย์เปิดผ่านคลินิกที่คุณทำงาน เพื่อให้เห็นนัดและแฟ้มน้องของคลินิกได้ทันที
        </Txt>
      </View>
      <Card padded={false}>
        {STEPS.map(({ Icon, title, body }, i) => (
          <View key={title} style={{ flexDirection: "row", gap: 14, padding: 16, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.brandSolid, alignItems: "center", justifyContent: "center" }}>
              <Txt weight="bold" color="#fff">
                {i + 1}
              </Txt>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                <Icon size={16} color={c.brand} />
                <Txt weight="semibold">{title}</Txt>
              </View>
              <Txt size={13.5} tone="muted">
                {body}
              </Txt>
            </View>
          </View>
        ))}
      </Card>
      <Notice tone="brand" icon={Building2}>
        {"เป็นเจ้าของคลินิกและตรวจเองคนเดียว? สมัครคลินิกแล้วใส่ชื่อคุณเป็นสัตวแพทย์ — บัญชีคลินิกเริ่มตรวจและจบเคสได้เลย"}
      </Notice>
      <Txt tone="brand" weight="semibold" align="center" onPress={() => router.replace("/clinic-sign-up")}>
        สมัครคลินิก
      </Txt>
    </Screen>
  );
}
