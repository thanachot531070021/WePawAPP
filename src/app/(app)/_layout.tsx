import { Stack } from "expo-router";
import { useColors } from "@/theme";

/** ทุกหน้าที่ต้องเข้าสู่ระบบ — แท็บหลัก + หน้ารายละเอียดที่เปิดซ้อนจากแท็บ */
export default function AppLayout() {
  const c = useColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="pets/new" options={{ presentation: "modal" }} />
      <Stack.Screen name="community/ask" options={{ presentation: "modal" }} />
    </Stack>
  );
}
