import { router } from "expo-router";
import {
  Bell,
  CalendarDays,
  Heart,
  KeyRound,
  LogOut,
  MessageCircle,
  MessagesSquare,
  Moon,
  PawPrint,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react-native";
import { View } from "react-native";
import { TopActions } from "@/components/TopActions";
import { AppBar, Avatar, Card, Chip, confirmAsync, ListRow, Screen, SectionTitle, Txt } from "@/components/ui";
import { useAppointments, useChatUnread, useFavorites, usePets } from "@/features/queries";
import { unregisterPush } from "@/lib/push";
import { formatThaiPhone } from "@/shared/phone";
import { usePrefs, type ThemePref } from "@/state/prefs";
import { useSession } from "@/state/session";
import { useColors } from "@/theme";

/** แท็บฉัน — = ProfileTab ของ MobileAccountView (การ์ดโปรไฟล์ + ตัวเลข + ทางลัด + ตั้งค่า) */
export default function MeTab() {
  const c = useColors();
  const user = useSession((s) => s.user);
  const signOut = useSession((s) => s.signOut);
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  const { data: pets } = usePets();
  const { data: appts } = useAppointments("upcoming");
  const { data: favs } = useFavorites();
  const { data: chatUnread } = useChatUnread();

  const stats = [
    { label: "สัตว์เลี้ยง", value: pets?.length ?? 0, Icon: PawPrint, onPress: () => router.navigate("/pets") },
    { label: "นัดที่จะถึง", value: (appts ?? []).filter((a) => a.status !== "cancelled").length, Icon: CalendarDays, onPress: () => router.navigate("/appointments") },
    { label: "บันทึกไว้", value: favs?.length ?? 0, Icon: Heart, onPress: () => router.push("/favorites") },
  ];

  const themes: { id: ThemePref; label: string }[] = [
    { id: "system", label: "ตามระบบ" },
    { id: "light", label: "สว่าง" },
    { id: "dark", label: "มืด" },
  ];

  return (
    <Screen inTabs header={<AppBar title="โปรไฟล์ของฉัน" right={<TopActions />} />}>
      <Card style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 18 }} onPress={() => router.push("/settings/profile")}>
        <Avatar url={user?.avatar_url} name={user?.full_name} size={60} />
        <View style={{ flex: 1 }}>
          <Txt size={18} weight="bold" numberOfLines={1}>
            {user?.full_name}
          </Txt>
          <Txt size={13.5} tone="muted" numberOfLines={1}>
            {user?.email}
          </Txt>
          {user?.phone && (
            <Txt size={13.5} tone="muted">
              {formatThaiPhone(user.phone)}
            </Txt>
          )}
        </View>
        <Pencil size={18} color={c.textFaint} />
      </Card>

      <View style={{ flexDirection: "row", gap: 10 }}>
        {stats.map(({ label, value, Icon, onPress }) => (
          <Card key={label} onPress={onPress} style={{ flex: 1, alignItems: "center", padding: 12, gap: 2 }}>
            <Icon size={20} color={c.brand} />
            <Txt size={20} weight="bold">
              {value}
            </Txt>
            <Txt size={12} tone="muted">
              {label}
            </Txt>
          </Card>
        ))}
      </View>

      <SectionTitle>ทางลัด</SectionTitle>
      <Card padded={false}>
        <ListRow icon={MessageCircle} label="ข้อความ" value={chatUnread ? `${chatUnread} ใหม่` : null} onPress={() => router.push("/chat")} />
        <ListRow icon={Bell} label="การแจ้งเตือน" onPress={() => router.push("/notifications")} />
        <ListRow icon={Heart} label="คลินิกที่บันทึกไว้" onPress={() => router.push("/favorites")} />
        <ListRow icon={MessagesSquare} label="ชุมชนถาม-ตอบ" onPress={() => router.push("/community")} last />
      </Card>

      <SectionTitle>บัญชี</SectionTitle>
      <Card padded={false}>
        <ListRow icon={UserRound} label="แก้ไขโปรไฟล์" onPress={() => router.push("/settings/profile")} />
        <ListRow icon={KeyRound} label="เปลี่ยนรหัสผ่าน" onPress={() => router.push("/settings/password")} />
        <ListRow icon={Bell} label="ตั้งค่าการแจ้งเตือน" onPress={() => router.push("/settings/notifications")} last />
      </Card>

      <SectionTitle>
        <Moon size={13} color={c.textMuted} /> ธีม
      </SectionTitle>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {themes.map((t) => (
          <Chip key={t.id} label={t.label} selected={theme === t.id} onPress={() => setTheme(t.id)} />
        ))}
      </View>

      <Card padded={false} style={{ marginTop: 6 }}>
        <ListRow
          icon={LogOut}
          label="ออกจากระบบ"
          onPress={async () => {
            if (await confirmAsync("ออกจากระบบ?", "คุณจะต้องเข้าสู่ระบบใหม่ในครั้งถัดไป", "ออกจากระบบ")) {
              await unregisterPush();
              await signOut();
            }
          }}
        />
        <ListRow icon={Trash2} label="ลบบัญชี" danger onPress={() => router.push("/settings/delete-account")} last />
      </Card>
      <Txt size={12} tone="faint" align="center">
        WePaw สำหรับเจ้าของสัตว์เลี้ยง · ใช้บัญชีเดียวกับเว็บ PetCare
      </Txt>
    </Screen>
  );
}
