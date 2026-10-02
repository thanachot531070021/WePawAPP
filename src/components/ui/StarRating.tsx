import { Star } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useColors } from "@/theme";

/** ดาวแสดงคะแนน (amber-500 = ดาวรีวิวของเว็บ) */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          color={c.star}
          fill={i <= Math.round(value) ? c.star : "transparent"}
          strokeWidth={1.8}
        />
      ))}
    </View>
  );
}

/** ดาวกดเลือกคะแนน 1–5 */
export function StarInput({
  value,
  onChange,
  size = 34,
  label,
}: {
  value: number | null;
  onChange: (v: number) => void;
  size?: number;
  label?: string;
}) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", gap: 6 }} accessibilityLabel={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} onPress={() => onChange(i)} hitSlop={4} accessibilityLabel={`${i} ดาว`}>
          <Star
            size={size}
            color={value && i <= value ? c.star : c.borderStrong}
            fill={value && i <= value ? c.star : "transparent"}
            strokeWidth={1.6}
          />
        </Pressable>
      ))}
    </View>
  );
}
