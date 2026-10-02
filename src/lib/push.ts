import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";
import { meApi } from "@/api/endpoints";
import { storage } from "./storage";
import { webPathToApp } from "./links";

const PUSH_TOKEN_KEY = "wepaw.pushToken";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * ขอสิทธิ์แจ้งเตือน + ส่ง Expo push token ไปเก็บที่ user_devices
 * - ask=false: ลงทะเบียนเงียบ ๆ เฉพาะเมื่อเคยอนุญาตแล้ว (ตอนเปิดแอป)
 * - ask=true: ถามสิทธิ์ (เรียกหลังจองนัดครั้งแรก / จากหน้าตั้งค่า — ขอเมื่อผู้ใช้เห็นประโยชน์)
 * คืน true ถ้าลงทะเบียนสำเร็จ
 */
export async function registerPush(ask: boolean): Promise<boolean> {
  if (Platform.OS === "web" || !Device.isDevice) return false;
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "แจ้งเตือนทั่วไป",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#059669",
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted" && ask) status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return false;

    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await meApi.registerDevice({
      token,
      platform: Platform.OS,
      device_name: Device.modelName ?? undefined,
      app_version: Constants.expoConfig?.version,
      os_version: String(Platform.Version),
    });
    await storage.set(PUSH_TOKEN_KEY, token);
    return true;
  } catch (err) {
    console.warn("[push] register failed", err);
    return false;
  }
}

/** ออกจากระบบ → เลิกส่ง push มาเครื่องนี้ */
export async function unregisterPush(): Promise<void> {
  const token = await storage.get(PUSH_TOKEN_KEY);
  if (!token) return;
  await meApi.unregisterDevice(token).catch(() => null);
  await storage.remove(PUSH_TOKEN_KEY);
}

/** แตะแจ้งเตือน → เปิดหน้าที่เกี่ยวข้อง (action_url ของเว็บ → หน้าในแอป) */
export function listenNotificationTaps(): () => void {
  if (Platform.OS === "web") return () => {};
  const open = (data: unknown) => {
    const url = (data as { url?: string } | undefined)?.url;
    router.push(webPathToApp(url) ?? "/notifications");
  };
  const last = Notifications.getLastNotificationResponse();
  if (last) open(last.notification.request.content.data);
  const sub = Notifications.addNotificationResponseReceivedListener((r) => open(r.notification.request.content.data));
  return () => sub.remove();
}
