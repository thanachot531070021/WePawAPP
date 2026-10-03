import { Stack } from "expo-router";
import { Clock3, Store } from "lucide-react-native";
import { View } from "react-native";
import { ApiError } from "@/api/client";
import { WEB_BASE_URL } from "@/api/config";
import { BrandMark, Button, Card, ErrorView, LoadingView, Screen, Txt } from "@/components/ui";
import { StaffSettings } from "@/components/staff/StaffSettings";
import { useClinicOverview } from "@/features/staffQueries";
import { useColors } from "@/theme";
import * as WebBrowser from "expo-web-browser";

/**
 * กลุ่มหน้าของบัญชีคลินิก — เงื่อนไขเดียวกับ requireClinicAdmin() ของเว็บ:
 * ยังไม่มีคลินิก → ให้สมัครบนเว็บ · ยังไม่อนุมัติ → หน้ารออนุมัติ (เหมือน /clinic-admin/pending)
 */
export default function ClinicLayout() {
  const c = useColors();
  const { data, error, isLoading, refetch } = useClinicOverview();

  if (isLoading) return <LoadingView />;
  if (error) {
    const noClinic = error instanceof ApiError && error.status === 404;
    return (
      <Screen>
        <View style={{ alignItems: "center", gap: 12, paddingTop: 60 }}>
          <BrandMark size={64} />
          {noClinic ? (
            <>
              <Txt size={19} weight="bold" align="center">
                บัญชีนี้ยังไม่มีคลินิก
              </Txt>
              <Txt tone="muted" align="center">
                สมัครคลินิกบนเว็บ PetCare ก่อน แล้วกลับมาใช้แอปได้เลย
              </Txt>
              <Button label="สมัครคลินิกบนเว็บ" icon={Store} full onPress={() => WebBrowser.openBrowserAsync(`${WEB_BASE_URL}/clinic-signup`)} />
            </>
          ) : (
            <ErrorView message={(error as Error).message} onRetry={refetch} />
          )}
        </View>
        <StaffSettings />
      </Screen>
    );
  }
  if (data?.pending) {
    return (
      <Screen onRefresh={refetch}>
        <Card style={{ alignItems: "center", gap: 10, paddingVertical: 32, marginTop: 40 }}>
          <Clock3 size={48} color={c.warn} />
          <Txt size={19} weight="bold" align="center">
            {data.clinic.name}
          </Txt>
          <Txt tone="muted" align="center">
            คลินิกกำลังรอการอนุมัติจากทีมงาน PetCare — อนุมัติแล้วจะเข้าใช้งานได้ทันที
          </Txt>
          <Button label="ตรวจสอบอีกครั้ง" variant="outline" onPress={() => refetch()} />
        </Card>
        <StaffSettings />
      </Screen>
    );
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />;
}
