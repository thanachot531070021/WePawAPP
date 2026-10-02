import type { LucideIcon } from "lucide-react-native";
import { ChevronRight, CloudOff, PawPrint } from "lucide-react-native";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, useColors } from "@/theme";
import { Button } from "./Button";
import { Txt } from "./Txt";

/** หัวข้อส่วน — text-[13px] font-semibold text-stone-500 */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
      <Txt size={13.5} weight="semibold" tone="muted">
        {children}
      </Txt>
      {action}
    </View>
  );
}

export function LoadingView({ label }: { label?: string }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 10 }}>
      <ActivityIndicator color={c.brand} size="large" />
      {label && <Txt tone="muted">{label}</Txt>}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = useColors();
  return (
    <View style={{ alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.lg,
          backgroundColor: c.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CloudOff size={28} color={c.textFaint} />
      </View>
      <Txt tone="muted" align="center">
        {message}
      </Txt>
      {onRetry && <Button label="ลองใหม่" variant="outline" size="sm" onPress={onRetry} />}
    </View>
  );
}

/** หน้าว่าง — กล่องไอคอน stone-100 + หัวข้อ + คำอธิบาย + ปุ่ม (แบบ empty state ของเว็บ) */
export function EmptyState({
  icon: Icon = PawPrint,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  const c = useColors();
  return (
    <View style={{ alignItems: "center", paddingVertical: 36, paddingHorizontal: 16, gap: 8 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.lg,
          backgroundColor: c.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 6,
        }}
      >
        <Icon size={30} color={c.textFaint} />
      </View>
      <Txt size={16.5} weight="semibold" align="center">
        {title}
      </Txt>
      {body && (
        <Txt tone="muted" align="center" size={14}>
          {body}
        </Txt>
      )}
      {action && <View style={{ marginTop: 10, alignSelf: "stretch" }}>{action}</View>}
    </View>
  );
}

/** แถวในการ์ดตั้งค่า/ข้อมูล — ไอคอน + ป้าย + ค่า + ลูกศร */
export function ListRow({
  icon: Icon,
  label,
  value,
  onPress,
  last,
  danger,
  right,
}: {
  icon?: LucideIcon;
  label: string;
  value?: string | null;
  onPress?: () => void;
  last?: boolean;
  danger?: boolean;
  right?: ReactNode;
}) {
  const c = useColors();
  const content = (pressed: boolean) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.border,
        backgroundColor: pressed ? c.surfaceAlt : "transparent",
      }}
    >
      {Icon && <Icon size={20} color={danger ? c.danger : c.textMuted} strokeWidth={1.9} />}
      <Txt style={{ flex: 1 }} tone={danger ? "danger" : "default"} weight="medium" numberOfLines={1}>
        {label}
      </Txt>
      {value ? (
        <Txt tone="muted" size={14} numberOfLines={1} style={{ maxWidth: "55%" }}>
          {value}
        </Txt>
      ) : null}
      {right}
      {onPress && <ChevronRight size={18} color={c.textFaint} />}
    </View>
  );
  if (!onPress) return content(false);
  return <Pressable onPress={onPress}>{({ pressed }) => content(pressed)}</Pressable>;
}

/** ป้ายเล็ก (pill) */
export function Pill({
  label,
  color,
  bg,
  icon: Icon,
  style,
}: {
  label: string;
  color: string;
  bg: string;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          alignSelf: "flex-start",
          paddingHorizontal: 9,
          paddingVertical: 3,
          borderRadius: radius.full,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      {Icon && <Icon size={12} color={color} strokeWidth={2.3} />}
      <Txt size={11.5} weight="semibold" color={color} lineHeight={16}>
        {label}
      </Txt>
    </View>
  );
}

/** chip เลือกได้ (filter / ตัวเลือก) — เลือกแล้ว: พื้น brand-600 ตัวขาว */
export function Chip({
  label,
  selected,
  onPress,
  icon: Icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        height: 36,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: selected ? c.brandSolid : c.borderStrong,
        backgroundColor: selected ? c.brandSolid : pressed ? c.surfaceAlt : c.surface,
      })}
    >
      {Icon && <Icon size={15} color={selected ? "#fff" : c.textMuted} />}
      <Txt size={13.5} weight={selected ? "semibold" : "medium"} color={selected ? "#fff" : c.text} lineHeight={18}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** แท็บแบ่งส่วน (กำลังจะถึง / ผ่านไปแล้ว) */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (v: T) => void;
}) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", backgroundColor: c.surfaceAlt, borderRadius: radius.md, padding: 4 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 9,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? c.surface : "transparent",
              shadowColor: "#000",
              shadowOpacity: active ? 0.08 : 0,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: active ? 1 : 0,
            }}
          >
            <Txt size={14} weight={active ? "semibold" : "medium"} tone={active ? "default" : "muted"} lineHeight={20}>
              {o.label}
              {o.count ? ` (${o.count})` : ""}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** กล่องข้อความแจ้ง (สีตามระดับ) */
export function Notice({
  tone = "info",
  icon: Icon,
  children,
}: {
  tone?: "info" | "warn" | "danger" | "brand";
  icon?: LucideIcon;
  children: ReactNode;
}) {
  const c = useColors();
  const map = {
    info: { bg: c.infoSoft, fg: c.info },
    warn: { bg: c.warnSoft, fg: c.warnText },
    danger: { bg: c.dangerSoft, fg: c.danger },
    brand: { bg: c.brandSoft, fg: c.brandSoftText },
  }[tone];
  return (
    <View style={{ flexDirection: "row", gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: map.bg }}>
      {Icon && <Icon size={18} color={map.fg} style={{ marginTop: 2 }} />}
      <View style={{ flex: 1 }}>
        {typeof children === "string" ? (
          <Txt size={13.5} color={map.fg}>
            {children}
          </Txt>
        ) : (
          children
        )}
      </View>
    </View>
  );
}
