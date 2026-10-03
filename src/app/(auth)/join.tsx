import { router, type Href } from "expo-router";
import { Building2, ChevronRight, PawPrint, Stethoscope, type LucideIcon } from "lucide-react-native";
import { View } from "react-native";
import { AppBar, Card, Screen, Txt } from "@/components/ui";
import { useColors } from "@/theme";

const ROLES: { href: Href; Icon: LucideIcon; title: string; body: string }[] = [
  { href: "/sign-up", Icon: PawPrint, title: "เจ้าของสัตว์เลี้ยง", body: "จองคิวคลินิก เก็บแฟ้มสุขภาพน้อง คุยกับคลินิก" },
  { href: "/clinic-sign-up", Icon: Building2, title: "คลินิก / โรงพยาบาลสัตว์", body: "รับคำขอจอง จัดการเคสและรีวิว · ทีมงานตรวจสอบก่อนเปิดใช้" },
  { href: "/vet-start", Icon: Stethoscope, title: "สัตวแพทย์", body: "ทำงานกับคลินิกที่ใช้ WePaw — คลินิกเพิ่มคุณแล้วส่งลิงก์ให้" },
];

/** เลือกประเภทบัญชีก่อนสมัคร — ทางเดียวกับ /auth/choose-role ของเว็บ */
export default function Join() {
  const c = useColors();
  return (
    <Screen header={<AppBar title="สมัครใช้งาน" back />}>
      <View style={{ gap: 4 }}>
        <Txt size={22} weight="bold">
          คุณคือใคร?
        </Txt>
        <Txt tone="muted">เลือกประเภทบัญชี — บัญชีเดียวใช้ได้ทั้งแอปและเว็บ PetCare</Txt>
      </View>
      {ROLES.map(({ href, Icon, title, body }) => (
        <Card key={title} onPress={() => router.push(href)} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 18 }}>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: c.brandSoft, alignItems: "center", justifyContent: "center" }}>
            <Icon size={26} color={c.brand} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt size={16.5} weight="bold">
              {title}
            </Txt>
            <Txt size={13} tone="muted">
              {body}
            </Txt>
          </View>
          <ChevronRight size={20} color={c.textFaint} />
        </Card>
      ))}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 4, marginTop: 4 }}>
        <Txt tone="muted">มีบัญชีแล้ว?</Txt>
        <Txt tone="brand" weight="semibold" onPress={() => router.replace("/sign-in")}>
          เข้าสู่ระบบ
        </Txt>
      </View>
    </Screen>
  );
}
