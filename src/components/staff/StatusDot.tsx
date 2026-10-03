import { View } from "react-native";
import { Txt } from "@/components/ui";
import { useColors } from "@/theme";
import { toneBg, type CaseTone } from "./caseTones";

/** ป้ายสถานะเคส: จุดสี + คำ บนพื้นอ่อนของสีเดียวกัน */
export function StatusPill({ tone }: { tone: CaseTone }) {
  const c = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: toneBg(tone.dot, c.isDark),
        alignSelf: "flex-start",
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: tone.dot }} />
      <Txt size={11.5} weight="semibold" color={c.isDark ? c.text : tone.dot} lineHeight={16}>
        {tone.label}
      </Txt>
    </View>
  );
}
