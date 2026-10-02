import { Check } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useColors } from "@/theme";
import { Txt } from "./Txt";

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", paddingVertical: 4 }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          marginTop: 1,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: checked ? c.brandSolid : c.borderStrong,
          backgroundColor: checked ? c.brandSolid : c.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && <Check size={15} color="#fff" strokeWidth={3} />}
      </View>
      <View style={{ flex: 1 }}>
        {typeof children === "string" ? <Txt size={14}>{children}</Txt> : children}
      </View>
    </Pressable>
  );
}

/** สวิตช์เปิด/ปิด แบบ toggle ของเว็บ (พื้น brand เมื่อเปิด) */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const c = useColors();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      style={{
        width: 46,
        height: 28,
        borderRadius: 14,
        padding: 3,
        backgroundColor: value ? c.brandSolid : c.borderStrong,
        alignItems: value ? "flex-end" : "flex-start",
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: "#fff",
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      />
    </Pressable>
  );
}
