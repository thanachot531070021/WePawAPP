import { useState } from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import type { Measurement } from "@/api/types";
import { Txt } from "@/components/ui";
import { formatDateShort } from "@/lib/format";
import { brand, useColors } from "@/theme";

/** กราฟน้ำหนัก — = HealthTrendChart ของเว็บแบบย่อ (เส้น brand + พื้นไล่สี) */
export function WeightChart({ measurements }: { measurements: Measurement[] }) {
  const c = useColors();
  const [w, setW] = useState(0);
  const pts = measurements
    .filter((m) => m.weight_kg != null)
    .map((m) => ({ t: new Date(m.measured_at).getTime(), v: Number(m.weight_kg), at: m.measured_at }))
    .sort((a, b) => a.t - b.t)
    .slice(-12);
  if (pts.length < 2) return null;

  const h = 120;
  const pad = 10;
  const min = Math.min(...pts.map((p) => p.v));
  const max = Math.max(...pts.map((p) => p.v));
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (pts.length - 1);
  const y = (v: number) => pad + (1 - (v - min) / span) * (h - pad * 2);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.v)}`).join(" ");
  const area = `${line} L${x(pts.length - 1)},${h} L${x(0)},${h} Z`;
  const last = pts[pts.length - 1];
  const diff = last.v - pts[pts.length - 2].v;

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Txt size={24} weight="bold">
          {last.v.toFixed(1)}
        </Txt>
        <Txt tone="muted">กก.</Txt>
        <Txt size={13} tone={diff === 0 ? "muted" : diff > 0 ? "warn" : "brand"}>
          {diff === 0 ? "คงที่" : `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff).toFixed(1)} กก.`}
        </Txt>
      </View>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: h }}>
        {w > 0 && (
          <Svg width={w} height={h}>
            <Defs>
              <LinearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={brand[500]} stopOpacity={0.25} />
                <Stop offset="1" stopColor={brand[500]} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path d={area} fill="url(#g)" />
            <Path d={line} stroke={c.brand} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => (
              <Circle key={p.t} cx={x(i)} cy={y(p.v)} r={i === pts.length - 1 ? 4.5 : 3} fill={c.surface} stroke={c.brand} strokeWidth={2} />
            ))}
          </Svg>
        )}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Txt size={11.5} tone="faint">
          {formatDateShort(pts[0].at)}
        </Txt>
        <Txt size={11.5} tone="faint">
          {formatDateShort(last.at)}
        </Txt>
      </View>
    </View>
  );
}
