import { Tabs } from "expo-router";
import { Calendar, LayoutGrid, MessageCircle, Settings2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChatUnread } from "@/features/queries";
import { useClinicOverview } from "@/features/staffQueries";
import { font, useColors } from "@/theme";

/** แถบล่างของคลินิก — ลำดับเดียวกับ MobileClinicAdminView ของเว็บ: หน้าหลัก · นัด · แชท · จัดการ */
export default function ClinicTabs() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { data } = useClinicOverview();
  const { data: chatUnread } = useChatUnread();
  const requests = data?.stats?.pending_requests ?? 0;
  const pendingReviews = data?.stats?.pending_reply ?? 0;
  const badge = { backgroundColor: c.dangerSolid, fontFamily: font.bold, fontSize: 10 };

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
        options={{ title: "หน้าหลัก", tabBarIcon: ({ color, focused }) => <LayoutGrid color={color} size={23} strokeWidth={focused ? 2.2 : 1.9} /> }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "นัด",
          tabBarBadge: requests > 0 ? requests : undefined,
          tabBarBadgeStyle: badge,
          tabBarIcon: ({ color, focused }) => <Calendar color={color} size={23} strokeWidth={focused ? 2.2 : 1.9} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "แชท",
          tabBarBadge: chatUnread ? chatUnread : undefined,
          tabBarBadgeStyle: badge,
          tabBarIcon: ({ color, focused }) => <MessageCircle color={color} size={23} strokeWidth={focused ? 2.2 : 1.9} />,
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: "จัดการ",
          tabBarBadge: pendingReviews > 0 ? pendingReviews : undefined,
          tabBarBadgeStyle: badge,
          tabBarIcon: ({ color, focused }) => <Settings2 color={color} size={23} strokeWidth={focused ? 2.2 : 1.9} />,
        }}
      />
    </Tabs>
  );
}
