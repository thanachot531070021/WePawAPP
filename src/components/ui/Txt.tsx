import { Text, type TextProps, type TextStyle } from "react-native";
import { font, useColors } from "@/theme";
import type { FontWeight } from "@/theme/fonts";

type Tone = "default" | "muted" | "faint" | "brand" | "danger" | "warn" | "inverse";

export interface TxtProps extends TextProps {
  size?: number;
  weight?: FontWeight;
  tone?: Tone;
  color?: string;
  align?: TextStyle["textAlign"];
  lineHeight?: number;
}

/**
 * ข้อความทั้งแอป — ฟอนต์ Sarabun ตามน้ำหนัก + สีตามธีม
 * ขนาดตั้งต้น 15 (= text-[15px] ที่ mobile web ใช้เป็นเนื้อหาหลัก)
 */
export function Txt({ size = 15, weight = "regular", tone = "default", color, align, lineHeight, style, ...rest }: TxtProps) {
  const c = useColors();
  const toneColor: Record<Tone, string> = {
    default: c.text,
    muted: c.textMuted,
    faint: c.textFaint,
    brand: c.brand,
    danger: c.danger,
    warn: c.warnText,
    inverse: "#ffffff",
  };
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: font[weight],
          fontSize: size,
          // ภาษาไทยมีสระบน/ล่าง ต้องเผื่อบรรทัดมากกว่าภาษาอังกฤษ
          lineHeight: lineHeight ?? Math.round(size * 1.5),
          color: color ?? toneColor[tone],
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
