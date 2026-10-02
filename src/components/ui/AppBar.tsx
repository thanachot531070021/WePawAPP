import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/theme";
import { BrandMark } from "./BrandMark";
import { Txt } from "./Txt";

interface AppBarProps {
  title: string;
  subtitle?: string | null;
  /** แท็บหลักแสดงโลโก้ ส่วนหน้าย่อยแสดงปุ่มย้อนกลับ */
  back?: boolean;
  onBack?: () => void;
  right?: ReactNode;
}

/**
 * แถบบน h-14 bg-white border-b — = top app bar ของ MobileAccountView บนเว็บ
 * (BrandMark + ชื่อหน้า 18px ตัวหนา + ปุ่มขวา)
 */
export function AppBar({ title, subtitle, back, onBack, right }: AppBarProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: c.surface,
        borderBottomWidth: 1,
        borderBottomColor: c.borderStrong,
      }}
    >
      <View style={{ height: 56, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ย้อนกลับ"
            hitSlop={8}
            onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/")))}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              marginLeft: -6,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? c.surfaceAlt : "transparent",
            })}
          >
            <ChevronLeft size={26} color={c.text} />
          </Pressable>
        ) : (
          <BrandMark size={34} />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt size={18} weight="bold" numberOfLines={1} lineHeight={24}>
            {title}
          </Txt>
          {subtitle ? (
            <Txt size={11.5} tone="faint" numberOfLines={1} lineHeight={15}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
        {right && <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>{right}</View>}
      </View>
    </View>
  );
}
