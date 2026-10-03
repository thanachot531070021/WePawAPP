import { Tabs } from "expo-router";
import { Calendar, LayoutGrid, MessageCircle, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChatUnread } from "@/features/queries";
import { font, useColors } from "@/theme";

/** แถบล่างของหมอ — เมนูของหมอเท่านั้น: วันนี้ · ตาราง · แชท · ฉัน (เหมือน MobileVetView ของเว็บ) */
export default function VetTabs() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { data: chatUnread } = useChatUnread();
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
        options={{ title: "วันนี้", tabBarIcon: ({ color, focused }) => <LayoutGrid color={color} size={23} strokeWidth={focused ? 2.2 : 1.9} /> }}
      />
      <Tabs.Screen
        name="week"
        options={{ title: "ตาราง", tabBarIcon: ({ color, focused }) => <Calendar color={color} size={23} strokeWidth={focused ? 2.2 : 1.9} /> }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "แชท",
          tabBarBadge: chatUnread ? chatUnread : undefined,
          tabBarBadgeStyle: { backgroundColor: c.dangerSolid, fontFamily: font.bold, fontSize: 10 },
          tabBarIcon: ({ color, focused }) => <MessageCircle color={color} size={23} strokeWidth={focused ? 2.2 : 1.9} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{ title: "ฉัน", tabBarIcon: ({ color, focused }) => <User color={color} size={23} strokeWidth={focused ? 2.2 : 1.9} /> }}
      />
    </Tabs>
  );
}
