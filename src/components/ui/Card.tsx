import { Pressable, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { radius, useColors } from "@/theme";

/** shadow-card ของเว็บ: 0 1px 2px rgba(16,24,40,.06), 0 6px 18px rgba(16,24,40,.08) */
export function useCardStyle(): ViewStyle {
  const c = useColors();
  return {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: c.shadow,
    shadowOpacity: c.isDark ? 0.4 : 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  };
}

interface CardProps extends ViewProps {
  padded?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** bg-white dark:bg-stone-900 border rounded-2xl shadow-card */
export function Card({ padded = true, onPress, style, children, ...rest }: CardProps) {
  const base = useCardStyle();
  const s: StyleProp<ViewStyle> = [base, padded && { padding: 16 }, style];
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [s, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={s} {...rest}>
      {children}
    </View>
  );
}
