import { ChevronRight, ReceiptText } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Txt } from "@/components/ui";
import type { ReceiptCard } from "@/shared/receiptCard";
import { radius, useColors } from "@/theme";

export const money = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** การ์ดใบเสร็จในห้องแชท = ReceiptBubbleCard ของเว็บ (components/chat/ChatThread.tsx) */
export function ReceiptChatCard({ receipt, onPress }: { receipt: ReceiptCard; onPress?: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`ใบเสร็จ ${receipt.receipt_no} ยอด ${money(receipt.total)} บาท`}
      style={({ pressed }) => ({
        width: 260,
        maxWidth: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: pressed ? c.brand : c.borderStrong,
        backgroundColor: c.surface,
        shadowColor: c.shadow,
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      })}
    >
      <View style={{ width: 44, height: 44, borderRadius: radius.lg, backgroundColor: c.brandSolid, alignItems: "center", justifyContent: "center" }}>
        <ReceiptText size={22} color="#fff" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt size={11.5} tone="muted" numberOfLines={1}>
          ใบเสร็จ · {receipt.receipt_no}
        </Txt>
        <Txt size={18} weight="bold" lineHeight={24}>
          ฿{money(receipt.total)}
        </Txt>
        <Txt size={11.5} tone="muted" numberOfLines={1}>
          {receipt.item_count} รายการ · {receipt.clinic_name}
        </Txt>
      </View>
      {onPress && <ChevronRight size={18} color={c.textFaint} />}
    </Pressable>
  );
}
