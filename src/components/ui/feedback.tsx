import { CheckCircle2, CircleAlert } from "lucide-react-native";
import { useEffect } from "react";
import { Alert, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { create } from "zustand";
import { radius, useColors } from "@/theme";
import { Txt } from "./Txt";

interface ToastState {
  message: string | null;
  tone: "success" | "error";
  show: (message: string, tone?: "success" | "error") => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  tone: "success",
  show: (message, tone = "success") => set({ message, tone }),
  hide: () => set({ message: null }),
}));

export const toast = {
  success: (m: string) => useToast.getState().show(m, "success"),
  error: (m: string) => useToast.getState().show(m, "error"),
};

/** แถบแจ้งผลสั้น ๆ ด้านบน หายเองใน 2.6 วิ */
export function ToastHost() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { message, tone, hide } = useToast();
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, 2600);
    return () => clearTimeout(t);
  }, [message, hide]);
  if (!message) return null;
  const Icon = tone === "success" ? CheckCircle2 : CircleAlert;
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: insets.top + 8, left: 16, right: 16, alignItems: "center", zIndex: 1000 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 11,
          borderRadius: radius.lg,
          backgroundColor: c.isDark ? "#292524" : "#1c1917",
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
          maxWidth: 480,
        }}
      >
        <Icon size={18} color={tone === "success" ? "#34d399" : "#fb7185"} />
        <Txt size={14} weight="medium" color="#fafaf9" style={{ flexShrink: 1 }}>
          {message}
        </Txt>
      </View>
    </View>
  );
}

/**
 * ถามยืนยันก่อนทำสิ่งที่ย้อนไม่ได้ (ลบ / ยกเลิกนัด)
 * native ใช้ Alert ของระบบ · เว็บ (ใช้ตอนทดสอบ) ใช้ window.confirm เพราะ Alert ของ RN-web ไม่ทำอะไร
 */
export function confirmAsync(title: string, message: string, confirmLabel = "ยืนยัน", destructive = true): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(globalThis.confirm ? globalThis.confirm(`${title}\n\n${message}`) : true);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "ยกเลิก", style: "cancel", onPress: () => resolve(false) },
      { text: confirmLabel, style: destructive ? "destructive" : "default", onPress: () => resolve(true) },
    ]);
  });
}
