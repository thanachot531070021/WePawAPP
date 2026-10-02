import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { brand, radius, useColors } from "@/theme";
import { Txt } from "./Txt";

type Variant = "primary" | "outline" | "soft" | "ghost" | "danger" | "dangerOutline";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const HEIGHT: Record<Size, number> = { sm: 36, md: 46, lg: 52 };
const FONT: Record<Size, number> = { sm: 13, md: 15, lg: 16 };

/**
 * ปุ่มชุดเดียวกับเว็บ (BTN_SOLID / BTN_OUTLINE / BTN_SOFT / BTN_GHOST ใน MobileAccountView)
 * เขียวทึบสงวนไว้ให้งานหลักของหน้าจอเท่านั้น
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon: Icon,
  loading,
  disabled,
  full,
  style,
  testID,
}: ButtonProps) {
  const c = useColors();
  const palette: Record<Variant, { bg: string; pressed: string; fg: string; border?: string }> = {
    primary: { bg: brand[600], pressed: brand[700], fg: "#ffffff" },
    outline: { bg: c.surface, pressed: c.surfaceAlt, fg: c.isDark ? "#e7e5e4" : "#44403c", border: c.borderStrong },
    soft: {
      bg: c.brandSoft,
      pressed: c.isDark ? "rgba(16,185,129,0.25)" : brand[100],
      fg: c.brandSoftText,
      border: c.isDark ? "rgba(16,185,129,0.3)" : brand[200],
    },
    ghost: { bg: "transparent", pressed: c.surfaceAlt, fg: c.textMuted },
    danger: { bg: c.dangerSolid, pressed: "#e11d48", fg: "#ffffff" },
    dangerOutline: { bg: c.surface, pressed: c.dangerSoft, fg: c.danger, border: c.isDark ? "rgba(244,63,94,0.4)" : "#fecdd3" },
  };
  const p = palette[variant];
  const off = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        {
          height: HEIGHT[size],
          paddingHorizontal: size === "sm" ? 12 : 18,
          borderRadius: size === "sm" ? radius.md : radius.lg,
          backgroundColor: pressed && !off ? p.pressed : p.bg,
          borderWidth: p.border ? 1 : 0,
          borderColor: p.border,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          alignSelf: full ? "stretch" : "auto",
          opacity: off && !loading ? 0.55 : 1,
        },
        variant === "primary" && {
          shadowColor: brand[600],
          shadowOpacity: 0.3,
          shadowRadius: 9,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {Icon && <Icon size={FONT[size] + 3} color={p.fg} strokeWidth={2.2} />}
          <Txt size={FONT[size]} weight="semibold" color={p.fg} lineHeight={FONT[size] + 6}>
            {label}
          </Txt>
        </View>
      )}
    </Pressable>
  );
}

/** ปุ่มไอคอนกลม — ปุ่มบน app bar (แชท / กระดิ่ง / ย้อนกลับ) */
export function IconButton({
  icon: Icon,
  onPress,
  badge,
  label,
  color,
  size = 40,
}: {
  icon: LucideIcon;
  onPress?: () => void;
  badge?: number;
  label: string;
  color?: string;
  size?: number;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? c.surfaceAlt : "transparent",
      })}
    >
      <Icon size={22} color={color ?? c.textMuted} strokeWidth={1.9} />
      {!!badge && badge > 0 && (
        <View
          style={{
            position: "absolute",
            top: 4,
            right: 2,
            minWidth: 17,
            height: 17,
            paddingHorizontal: 4,
            borderRadius: 9,
            backgroundColor: c.dangerSolid,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: c.surface,
          }}
        >
          <Txt size={9.5} weight="bold" color="#fff" lineHeight={12}>
            {badge > 99 ? "99+" : badge}
          </Txt>
        </View>
      )}
    </Pressable>
  );
}
