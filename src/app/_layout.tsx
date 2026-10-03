import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastHost } from "@/components/ui";
import { listenNotificationTaps, registerPush } from "@/lib/push";
import { queryClient } from "@/lib/queryClient";
import { usePrefs } from "@/state/prefs";
import { homeFor, useSession } from "@/state/session";
import { brand, useColors } from "@/theme";
import { fontAssets } from "@/theme/fonts";

SplashScreen.preventAutoHideAsync().catch(() => null);

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);
  const status = useSession((s) => s.status);
  const role = useSession((s) => s.user?.role);
  const segments = useSegments();
  const c = useColors();

  useEffect(() => {
    void usePrefs.getState().hydrate();
    void useSession.getState().bootstrap();
  }, []);

  const ready = fontsLoaded && status !== "loading";
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => null);
  }, [ready]);

  // เข้าสู่ระบบแล้ว: ลงทะเบียน push เงียบ ๆ (ถ้าเคยอนุญาต) + ฟังการแตะแจ้งเตือน
  useEffect(() => {
    if (status !== "signedIn") return;
    void registerPush(false);
    return listenNotificationTaps();
  }, [status]);

  // แต่ละ role มีกลุ่มหน้าของตัวเอง (เจ้าของ "/", คลินิก "/clinic-admin", หมอ "/vet") — ถ้าเปิดแอปแล้ว
  // อยู่ผิดกลุ่ม (เช่น เปลี่ยนบัญชี / ลิงก์ของ role อื่น) พาไปหน้าแรกของ role ตัวเอง
  useEffect(() => {
    if (status !== "signedIn" || !role) return;
    const group = segments[0];
    const expected = role === "clinic_admin" ? "(clinic)" : role === "vet" ? "(vet)" : "(app)";
    if (group !== expected && group !== "(shared)") router.replace(homeFor(role));
  }, [status, role, segments]);

  const navTheme = useMemo(() => {
    const base = c.isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, primary: brand[600], background: c.bg, card: c.surface, text: c.text, border: c.borderStrong },
    };
  }, [c]);

  if (!ready) return null;

  const signedIn = status === "signedIn";
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={navTheme}>
            <StatusBar style={c.isDark ? "light" : "dark"} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
              <Stack.Protected guard={!signedIn}>
                <Stack.Screen name="(auth)" />
              </Stack.Protected>
              <Stack.Protected guard={signedIn && role === "clinic_admin"}>
                <Stack.Screen name="(clinic)" />
              </Stack.Protected>
              <Stack.Protected guard={signedIn && role === "vet"}>
                <Stack.Screen name="(vet)" />
              </Stack.Protected>
              <Stack.Protected guard={signedIn && role !== "clinic_admin" && role !== "vet"}>
                <Stack.Screen name="(app)" />
              </Stack.Protected>
              <Stack.Protected guard={signedIn}>
                <Stack.Screen name="(shared)" />
              </Stack.Protected>
            </Stack>
            <ToastHost />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
