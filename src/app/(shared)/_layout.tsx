import { Stack } from "expo-router";
import { useColors } from "@/theme";

/** หน้าที่ทุก role ใช้ร่วมกัน — แชท, แจ้งเตือน, เปลี่ยนรหัสผ่าน, ตั้งค่าการแจ้งเตือน */
export default function SharedLayout() {
  const c = useColors();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />;
}
