import { Stack } from "expo-router";
import { UserX } from "lucide-react-native";
import { ForceChangePassword } from "@/components/ForceChangePassword";
import { StaffSettings } from "@/components/staff/StaffSettings";
import { Card, ErrorView, LoadingView, Screen, Txt } from "@/components/ui";
import { useStaffMe } from "@/features/staffQueries";
import { useColors } from "@/theme";

/**
 * กลุ่มหน้าของสัตวแพทย์ — เงื่อนไขเดียวกับ requireVet() ของเว็บ:
 * รหัสชั่วคราว (must_change_password) → ต้องเปลี่ยนก่อน · บัญชียังไม่ activate → ใช้งานไม่ได้
 * ไม่มีคลินิกไม่ใช่เหตุให้ออก — ทุกหน้าแค่ว่าง และเห็นคำเชิญจากคลินิกที่แท็บวันนี้
 */
export default function VetLayout() {
  const c = useColors();
  const { data, isLoading, error, refetch } = useStaffMe();
  if (isLoading) return <LoadingView />;
  if (error || !data)
    return (
      <Screen>
        <ErrorView message={(error as Error)?.message ?? "โหลดข้อมูลไม่สำเร็จ"} onRetry={refetch} />
      </Screen>
    );
  if (data.must_change_password) return <ForceChangePassword />;
  if (!data.vet || data.vet.account_status !== "active") {
    return (
      <Screen>
        <Card style={{ alignItems: "center", gap: 10, paddingVertical: 32, marginTop: 40 }}>
          <UserX size={44} color={c.warn} />
          <Txt size={18} weight="bold" align="center">
            บัญชีสัตวแพทย์ยังไม่เปิดใช้งาน
          </Txt>
          <Txt tone="muted" align="center">
            เปิดใช้งานจากลิงก์ที่คลินิกส่งให้ก่อน แล้วเข้าสู่ระบบอีกครั้ง
          </Txt>
        </Card>
        <StaffSettings />
      </Screen>
    );
  }
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />;
}
