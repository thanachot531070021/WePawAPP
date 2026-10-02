import { LinearGradient } from "expo-linear-gradient";
import { PawPrint } from "lucide-react-native";
import { brand } from "@/theme";

/** โลโก้ที่เปิดทุก app bar — = components/BrandMark.tsx ของเว็บ (gradient brand-500 → brand-700) */
export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <LinearGradient
      colors={[brand[500], brand[700]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.35,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: brand[600],
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }}
    >
      <PawPrint size={Math.round(size * 0.56)} color="#ffffff" />
    </LinearGradient>
  );
}
