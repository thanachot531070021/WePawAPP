import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { bkkDateKey, monthLabel, TH_DAYS_SHORT } from "@/lib/format";
import { radius, useColors } from "@/theme";
import { Txt } from "./Txt";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * ปฏิทินเลือกวัน (YYYY-MM-DD) — คู่กับ CalendarDatePicker ของเว็บ:
 * วันที่ปิด (closedDays = เลขวันในสัปดาห์, closedDates = วันหยุดเฉพาะกิจ) เป็นสีเทากดไม่ได้
 */
export function CalendarPicker({
  value,
  onChange,
  min,
  max,
  closedDays = [],
  closedDates = [],
}: {
  value: string | null;
  onChange: (d: string) => void;
  min?: string;
  max?: string;
  closedDays?: number[];
  closedDates?: string[];
}) {
  const c = useColors();
  const start = value ?? min ?? bkkDateKey();
  const [ym, setYm] = useState(() => ({ y: Number(start.slice(0, 4)), m: Number(start.slice(5, 7)) - 1 }));
  const closedSet = useMemo(() => new Set(closedDates), [closedDates]);

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(ym.y, ym.m, 1)).getUTCDay();
    const days = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate();
    const out: (string | null)[] = Array(first).fill(null);
    for (let d = 1; d <= days; d++) out.push(`${ym.y}-${pad(ym.m + 1)}-${pad(d)}`);
    while (out.length % 7) out.push(null);
    return out;
  }, [ym]);

  const shift = (delta: number) =>
    setYm((p) => {
      const m = p.m + delta;
      return { y: p.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });

  const minMonth = min ? min.slice(0, 7) : null;
  const curMonth = `${ym.y}-${pad(ym.m + 1)}`;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable
          onPress={() => shift(-1)}
          disabled={!!minMonth && curMonth <= minMonth}
          hitSlop={8}
          style={{ padding: 6, opacity: minMonth && curMonth <= minMonth ? 0.3 : 1 }}
          accessibilityLabel="เดือนก่อน"
        >
          <ChevronLeft size={22} color={c.text} />
        </Pressable>
        <Txt weight="semibold" align="center" style={{ flex: 1 }}>
          {monthLabel(ym.y, ym.m)}
        </Txt>
        <Pressable onPress={() => shift(1)} hitSlop={8} style={{ padding: 6 }} accessibilityLabel="เดือนถัดไป">
          <ChevronRight size={22} color={c.text} />
        </Pressable>
      </View>
      <View style={{ flexDirection: "row" }}>
        {TH_DAYS_SHORT.map((d) => (
          <Txt key={d} size={12} tone="faint" align="center" style={{ flex: 1 }}>
            {d}
          </Txt>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          const dow = i % 7;
          const disabled =
            (min && d < min) || (max && d > max) || closedDays.includes(dow) || closedSet.has(d);
          const selected = d === value;
          const today = d === bkkDateKey();
          return (
            <View key={d} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
              <Pressable
                disabled={!!disabled}
                onPress={() => onChange(d)}
                accessibilityLabel={d}
                accessibilityState={{ selected, disabled: !!disabled }}
                style={{
                  flex: 1,
                  borderRadius: radius.md,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: selected ? c.brandSolid : "transparent",
                  borderWidth: today && !selected ? 1 : 0,
                  borderColor: c.brand,
                }}
              >
                <Txt
                  size={15}
                  weight={selected ? "bold" : "medium"}
                  color={selected ? "#fff" : disabled ? c.textFaint : c.text}
                  style={disabled ? { textDecorationLine: "line-through", opacity: 0.6 } : undefined}
                >
                  {Number(d.slice(8))}
                </Txt>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
