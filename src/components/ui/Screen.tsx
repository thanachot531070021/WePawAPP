import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { gutter, useColors } from "@/theme";

interface ScreenProps {
  header?: ReactNode;
  children: ReactNode;
  /** false = จัดวางเอง (เช่น FlatList) */
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** แถบปุ่มติดล่าง (sticky action bar) */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** หน้าที่อยู่ในแท็บ — แถบแท็บกินพื้นที่ล่างให้แล้ว */
  inTabs?: boolean;
}

/** โครงหน้าจอ: พื้น stone-50/950 + แถบบน + เนื้อหา scroll + แถบล่าง (ถ้ามี) */
export function Screen({ header, children, scroll = true, refreshing, onRefresh, footer, contentStyle, inTabs }: ScreenProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = footer || inTabs ? 24 : insets.bottom + 24;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {header}
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[{ padding: gutter, paddingBottom: bottomPad, gap: 14 }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.brand} colors={[c.brandSolid]} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
      {footer && (
        <View
          style={{
            backgroundColor: c.surface,
            borderTopWidth: 1,
            borderTopColor: c.borderStrong,
            paddingHorizontal: gutter,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          {footer}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
