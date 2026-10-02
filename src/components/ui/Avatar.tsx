import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { absoluteUrl } from "@/api/config";
import { brand, useColors } from "@/theme";
import { getSpeciesPhoto, normalizeSpecies, SPECIES_TINT, type PetSpecies } from "@/shared/species";
import { Txt } from "./Txt";

/** อวาตาร์คน — รูปจริง หรือวงกลม gradient brand + ตัวอักษรแรก */
export function Avatar({ url, name, size = 40 }: { url?: string | null; name?: string | null; size?: number }) {
  const c = useColors();
  const src = absoluteUrl(url);
  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.surfaceAlt }}
        contentFit="cover"
      />
    );
  }
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <LinearGradient
      colors={[brand[400], brand[600]]}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }}
    >
      <Txt size={size * 0.42} weight="bold" color="#fff" lineHeight={size * 0.6}>
        {initial}
      </Txt>
    </LinearGradient>
  );
}

/**
 * อวาตาร์น้อง — ลำดับเดียวกับ PetAvatar ของเว็บ:
 * รูปที่เจ้าของอัปโหลด → ภาพประจำชนิด (seed ด้วย pet id) → pictogram บนพื้น pastel
 */
export function PetAvatar({
  species,
  seed,
  url,
  size = 48,
  radius,
}: {
  species: string | null | undefined;
  seed?: string | null;
  url?: string | null;
  size?: number;
  radius?: number;
}) {
  const c = useColors();
  const r = radius ?? size / 2;
  const uploaded = absoluteUrl(url?.trim() || null);
  const stock = uploaded ? null : getSpeciesPhoto(species, seed);
  if (uploaded || stock) {
    return (
      <Image
        source={uploaded ? { uri: uploaded } : stock!}
        style={{ width: size, height: size, borderRadius: r, backgroundColor: c.surfaceAlt }}
        contentFit="cover"
      />
    );
  }
  const sp = normalizeSpecies(species);
  const tint = SPECIES_TINT[sp];
  return (
    <LinearGradient
      colors={[tint.from, tint.to]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: r, alignItems: "center", justifyContent: "center" }}
    >
      <SpeciesIcon species={sp} size={size * 0.55} color={tint.fg} />
    </LinearGradient>
  );
}

/** pictogram ชนิดสัตว์ — path ชุดเดียวกับ components/pets/SpeciesIcon.tsx ของเว็บ */
export function SpeciesIcon({ species, size = 18, color }: { species: string | null | undefined; size?: number; color: string }) {
  const sp: PetSpecies = normalizeSpecies(species);
  const common = { fill: "none", stroke: color, strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const dot = (cx: number, cy: number, r = 0.7) => <Circle cx={cx} cy={cy} r={r} fill={color} />;
  const body: Record<PetSpecies, React.ReactNode> = {
    dog: (
      <>
        <Path d="M7 9 5 5l4 1 .5-1h5L15 6l4-1-2 4" {...common} />
        <Path d="M5 11c0 5 3 8 7 8s7-3 7-8" {...common} />
        {dot(10, 13)}
        {dot(14, 13)}
        <Path d="M11.5 16h1" {...common} />
      </>
    ),
    cat: (
      <>
        <Path d="M5 5v4c0 5 3 8 7 8s7-3 7-8V5l-3 3h-8L5 5Z" {...common} />
        {dot(10, 12)}
        {dot(14, 12)}
        <Path d="M11 15h2" {...common} />
      </>
    ),
    bird: (
      <>
        <Path d="M16 7a4 4 0 1 0-7 2.5L4 14l5-1c1.5 2 4 3 7 2l-1-3 3-2-2-3Z" {...common} />
        {dot(16, 7)}
        <Path d="m20 7 2-1-2-1" {...common} />
      </>
    ),
    rabbit: (
      <>
        <Path d="M9 4c-.5 3 0 5 1 6M15 4c.5 3 0 5-1 6" {...common} />
        <Path d="M6 14a6 6 0 1 1 12 0c0 3-3 5-6 5s-6-2-6-5Z" {...common} />
        {dot(10, 14)}
        {dot(14, 14)}
      </>
    ),
    rodent: (
      <>
        <Circle cx={6.9} cy={7.6} r={2.2} {...common} />
        <Circle cx={17.1} cy={7.6} r={2.2} {...common} />
        <Path d="M5 13.8c0-3.7 3.1-6.2 7-6.2s7 2.5 7 6.2-3.1 5.8-7 5.8-7-2.1-7-5.8Z" {...common} />
        {dot(9.9, 13.2, 0.65)}
        {dot(14.1, 13.2, 0.65)}
        <Path d="M12 15.4v1M3 14.6l3-.6M3.4 17.2l2.8-1.4M21 14.6l-3-.6M20.6 17.2l-2.8-1.4" {...common} />
      </>
    ),
    reptile: (
      <>
        <Path d="M3.8 16.4C3.8 11.9 7.5 9 12 9s7.2 2.9 7.2 6.4" {...common} />
        <Path d="M3.8 16.4h15.4" {...common} />
        <Path d="M12 9.2v7M7.4 10.8l1.6 5.6M16.6 10.8 15 16.4" {...common} />
        <Path d="M19.2 15.2c1.5 0 2.6.9 2.6 2s-1 1.6-2.2 1.6" {...common} />
        {dot(20.6, 16.6, 0.6)}
        <Path d="M6.5 16.6v2M14.5 16.6v2" {...common} />
      </>
    ),
    fish: (
      <>
        <Path d="M6.5 12C9.5 7.5 13.5 5.8 16.8 6.4c2.5.5 3.9 2.4 4.2 5.6-.3 3.2-1.7 5.1-4.2 5.6C13.5 18.2 9.5 16.5 6.5 12Z" {...common} />
        <Path d="M6.5 12 2.8 8.4v7.2L6.5 12Z" {...common} />
        {dot(17.4, 10.5)}
      </>
    ),
    exotic: (
      <>
        <Path
          d="M3.5 18.4 5.2 13.6 6.6 15.6 8 11.4 9.4 13.6 11 10 12.4 12.4 14.2 10.2 15.4 12.8 17.2 12.2 17.9 14.6 20.4 16 21.8 17.6 19.8 18.4Z"
          {...common}
        />
        {dot(18.7, 15.9)}
      </>
    ),
    other: (
      <>
        <Ellipse cx={5.9} cy={10.4} rx={1.8} ry={2.1} {...common} />
        <Ellipse cx={9.7} cy={7.2} rx={1.9} ry={2.3} {...common} />
        <Ellipse cx={14.3} cy={7.2} rx={1.9} ry={2.3} {...common} />
        <Ellipse cx={18.1} cy={10.4} rx={1.8} ry={2.1} {...common} />
        <Ellipse cx={12} cy={16.4} rx={5.2} ry={4.1} {...common} />
      </>
    ),
  };
  return (
    <View>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {body[sp]}
      </Svg>
    </View>
  );
}
