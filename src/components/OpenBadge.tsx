import { View } from "react-native";
import type { OpenStatus } from "@/api/types";
import { Txt } from "@/components/ui";
import { useColors } from "@/theme";

/** ป้าย "เปิดอยู่ · ปิด 20:00 น." / "ปิดอยู่ · เปิดพรุ่งนี้ 09:00 น." — สถานะมาจาก server (เวลาไทย) ไม่คิดจากนาฬิกาเครื่อง */
export function OpenBadge({ status, size = 13 }: { status: OpenStatus | null | undefined; size?: number }) {
  const c = useColors();
  if (!status?.known) return null;
  const color = status.open ? c.brand : c.textMuted;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: status.open ? c.brand : c.textFaint }} />
      <Txt size={size} weight="semibold" color={color}>
        {status.open ? "เปิดอยู่" : "ปิดอยู่"}
      </Txt>
      {status.detail && (
        <Txt size={size} tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
          · {status.detail}
        </Txt>
      )}
    </View>
  );
}
