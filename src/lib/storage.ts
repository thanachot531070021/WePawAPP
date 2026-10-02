import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * key-value ที่จำค่าข้ามการเปิดแอป — native ใช้ Keychain/Keystore (expo-secure-store)
 * เว็บ (ใช้ตอน dev/ทดสอบใน browser เท่านั้น) fallback เป็น localStorage
 */
export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web") return globalThis.localStorage?.getItem(key) ?? null;
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === "web") globalThis.localStorage?.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
    } catch {
      // เก็บไม่ได้ก็ใช้งานต่อได้ แค่ต้อง login ใหม่ครั้งหน้า
    }
  },
  async remove(key: string): Promise<void> {
    try {
      if (Platform.OS === "web") globalThis.localStorage?.removeItem(key);
      else await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  },
};
