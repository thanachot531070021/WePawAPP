import { Tabs } from "expo-router";
import { CalendarDays, PawPrint, Search, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppointments } from "@/features/queries";
import { font, useColors } from "@/theme";

/**
 * แถบล่าง 4 แท็บ ลำดับเดียวกับ mobile web: ค้นหา · นัด · น้องของฉัน · ฉัน
 * (TABS ใน MobileAccountView) — active = brand-600, ไม่ active = stone-400
 */
export default function TabsLayout() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { data: upcoming } = useAppointments("upcoming");
  const pendingCount = (upcoming ?? []).filter((a) => a.status !== "cancelled").length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.textFaint,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.isDark ? c.borderStrong : "rgba(0,0,0,0.06)",
          height: 60 + Math.max(insets.bottom, 8),
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "ค้นหา", tabBarIcon: ({ color, focused }) => <Search color={color} size={23} strokeWidth={focused ? 2.2 : 1.9} /> }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "นัด",
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: c.dangerSolid, fontFamily: font.bold, fontSize: 10 },
          tabBarIcon: ({ color, focused }) => <CalendarDays color={color} size={23} strokeWidth={focused ? 2.2 : 1.9} />,
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{ title: "น้องของฉัน", tabBarIcon: ({ color, focused }) => <PawPrint color={color} size={23} strokeWidth={focused ? 2.2 : 1.9} /> }}
      />
      <Tabs.Screen
        name="me"
        options={{ title: "ฉัน", tabBarIcon: ({ color, focused }) => <User color={color} size={23} strokeWidth={focused ? 2.2 : 1.9} /> }}
      />
    </Tabs>
  );
}
