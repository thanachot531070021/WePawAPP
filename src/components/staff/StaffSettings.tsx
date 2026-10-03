import { router } from "expo-router";
import { Bell, KeyRound, LogOut, Moon } from "lucide-react-native";
import { View } from "react-native";
import { Card, Chip, confirmAsync, ListRow, SectionTitle, Txt } from "@/components/ui";
import { unregisterPush } from "@/lib/push";
import { usePrefs, type ThemePref } from "@/state/prefs";
import { useSession } from "@/state/session";
import { useColors } from "@/theme";

const THEMES: { id: ThemePref; label: string }[] = [
  { id: "system", label: "ตามระบบ" },
  { id: "light", label: "สว่าง" },
  { id: "dark", label: "มืด" },
];

/** ส่วนตั้งค่าบัญชีที่หมอกับคลินิกใช้ร่วมกัน — การแจ้งเตือน, รหัสผ่าน, ธีม, ออกจากระบบ */
export function StaffSettings() {
  const c = useColors();
  const signOut = useSession((s) => s.signOut);
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  return (
    <>
      <SectionTitle>บัญชี</SectionTitle>
      <Card padded={false}>
        <ListRow icon={Bell} label="การแจ้งเตือน" onPress={() => router.push("/notifications")} />
        <ListRow icon={Bell} label="ตั้งค่าการแจ้งเตือนบนเครื่อง" onPress={() => router.push("/settings/notifications")} />
        <ListRow icon={KeyRound} label="เปลี่ยนรหัสผ่าน" onPress={() => router.push("/settings/password")} last />
      </Card>
      <SectionTitle>
        <Moon size={13} color={c.textMuted} /> ธีม
      </SectionTitle>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {THEMES.map((t) => (
          <Chip key={t.id} label={t.label} selected={theme === t.id} onPress={() => setTheme(t.id)} />
        ))}
      </View>
      <Card padded={false} style={{ marginTop: 6 }}>
        <ListRow
          icon={LogOut}
          label="ออกจากระบบ"
          last
          onPress={async () => {
            if (await confirmAsync("ออกจากระบบ?", "คุณจะต้องเข้าสู่ระบบใหม่ในครั้งถัดไป", "ออกจากระบบ")) {
              await unregisterPush();
              await signOut();
            }
          }}
        />
      </Card>
      <Txt size={12} tone="faint" align="center">
        ใช้บัญชีเดียวกับเว็บ PetCare · งานหลังบ้านเต็มรูปแบบ (POS สต็อก รายงาน) ใช้บนเว็บ
      </Txt>
    </>
  );
}
