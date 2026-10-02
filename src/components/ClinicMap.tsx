import { router } from "expo-router";
import MapView, { Callout, Marker } from "react-native-maps";
import { View } from "react-native";
import type { ClinicListItem } from "@/api/types";
import { Txt } from "@/components/ui";
import { brand } from "@/theme";

/**
 * แผนที่ผลค้นหา (native) — iOS ใช้ Apple Maps, Android ใช้ Google Maps (ต้องตั้ง GOOGLE_MAPS_ANDROID_KEY)
 * เว็บใช้ ClinicMap.web.tsx แทน
 */
export function ClinicMap({
  clinics,
  center,
}: {
  clinics: ClinicListItem[];
  center: { lat: number; lng: number } | null;
}) {
  const withPos = clinics.filter((c) => c.lat != null && c.lng != null);
  const first = center ?? (withPos[0] ? { lat: withPos[0].lat!, lng: withPos[0].lng! } : { lat: 13.7383, lng: 100.5798 });
  return (
    <MapView
      style={{ flex: 1 }}
      showsUserLocation={!!center}
      initialRegion={{ latitude: first.lat, longitude: first.lng, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
    >
      {withPos.map((c) => (
        <Marker key={c.id} coordinate={{ latitude: c.lat!, longitude: c.lng! }} pinColor={brand[600]}>
          <Callout onPress={() => router.push(`/clinic/${c.slug}`)}>
            <View style={{ maxWidth: 220, padding: 4 }}>
              <Txt weight="semibold" color="#1c1917">
                {c.name}
              </Txt>
              <Txt size={12} color="#78716c">
                ⭐ {c.rating_avg ? Number(c.rating_avg).toFixed(1) : "ใหม่"} · แตะเพื่อดูคลินิก
              </Txt>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}
