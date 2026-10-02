import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { radius, useColors } from "@/theme";
import { Txt } from "./Txt";

/** bottom sheet — = sheet rounded-t-3xl ของ mobile web (เพิ่มสัตว์ / แก้โปรไฟล์ / รายงาน) */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={{ flex: 1, backgroundColor: c.overlay }} onPress={onClose} accessibilityLabel="ปิด" />
        <View
          style={{
            backgroundColor: c.surface,
            borderTopLeftRadius: radius.xxl,
            borderTopRightRadius: radius.xxl,
            maxHeight: "88%",
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          <View style={{ alignItems: "center", paddingTop: 8 }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.borderStrong }} />
          </View>
          {title && (
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 }}>
              <Txt size={17} weight="bold" style={{ flex: 1 }}>
                {title}
              </Txt>
              <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="ปิด">
                <X size={22} color={c.textMuted} />
              </Pressable>
            </View>
          )}
          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10, gap: 14 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer && <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
