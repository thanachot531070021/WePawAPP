import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { CalendarCheck2, HeartPulse, MessageCircle } from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandMark, Button, Txt } from "@/components/ui";
import { brand, gutter, useColors } from "@/theme";

const POINTS = [
  { Icon: HeartPulse, title: "แฟ้มสุขภาพน้องในมือคุณ", body: "วัคซีน น้ำหนัก ประวัติรักษา ครบในที่เดียว" },
  { Icon: CalendarCheck2, title: "จองคิวคลินิกใกล้บ้าน", body: "ดูรีวิวจริง เลือกวันและช่วงเวลาที่สะดวก" },
  { Icon: MessageCircle, title: "คุยกับคลินิกได้ทันที", body: "สอบถามก่อนพาน้องไป ไม่ต้องรอสาย" },
];

/** หน้าแรกก่อนเข้าสู่ระบบ — โทน hero-bg ของเว็บ (brand-100 → ขาว) */
export default function Welcome() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={c.isDark ? [brand[900], c.bg] : [brand[100], "#ffffff"]}
      style={{ flex: 1, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24, paddingHorizontal: gutter + 8 }}
    >
      <View style={{ flex: 1, gap: 28 }}>
        <View style={{ alignItems: "center", gap: 14 }}>
          <BrandMark size={72} />
          <Txt size={30} weight="bold" lineHeight={40}>
            WePaw
          </Txt>
          <Txt size={16} tone="muted" align="center">
            ดูแลน้องได้ครบ ตั้งแต่หาคลินิกจนถึงแฟ้มสุขภาพ
          </Txt>
        </View>
        <View style={{ gap: 16, marginTop: 8 }}>
          {POINTS.map(({ Icon, title, body }) => (
            <View key={title} style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: c.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Icon size={22} color={c.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="semibold">{title}</Txt>
                <Txt size={13.5} tone="muted">
                  {body}
                </Txt>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={{ gap: 12 }}>
        <Button label="สมัครสมาชิก" size="lg" full onPress={() => router.push("/join")} />
        <Button label="เข้าสู่ระบบ" size="lg" variant="outline" full onPress={() => router.push("/sign-in")} />
        <Txt size={13} tone="muted" align="center">
          สำหรับเจ้าของสัตว์เลี้ยง คลินิก และสัตวแพทย์
        </Txt>
      </View>
    </LinearGradient>
  );
}
