import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { BadgeCheck, Heart, MapPin, Star } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { absoluteUrl } from "@/api/config";
import { clinicApi } from "@/api/endpoints";
import type { ClinicListItem } from "@/api/types";
import { Card, SpeciesIcon, toast, Txt } from "@/components/ui";
import { formatDistance } from "@/lib/format";
import { qk } from "@/lib/queryClient";
import { getSpeciesLabel } from "@/shared/species";
import { brand, radius, useColors } from "@/theme";

/** ปุ่มหัวใจบันทึกคลินิก — toggle เดียวกับ FavoriteButton ของเว็บ */
export function FavoriteButton({ clinicId, favorited, size = 36 }: { clinicId: string; favorited: boolean; size?: number }) {
  const c = useColors();
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => clinicApi.toggleFavorite(clinicId),
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: qk.favorites });
      toast.success(r.favorited ? "บันทึกคลินิกแล้ว" : "เอาออกจากที่บันทึกแล้ว");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const on = m.isPending ? !favorited : favorited;
  return (
    <Pressable
      onPress={() => m.mutate()}
      accessibilityRole="button"
      accessibilityLabel={on ? "เลิกบันทึกคลินิก" : "บันทึกคลินิก"}
      hitSlop={6}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.surface,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      }}
    >
      <Heart size={size * 0.5} color="#f43f5e" fill={on ? "#f43f5e" : "transparent"} />
    </Pressable>
  );
}

/** การ์ดคลินิกในผลค้นหา — ปกคลินิก (หรือ ph-cover gradient ของเว็บ) + ชื่อ ดาว ย่าน ระยะ ชนิดสัตว์ */
export function ClinicCard({ clinic, favorited }: { clinic: ClinicListItem; favorited: boolean }) {
  const c = useColors();
  const cover = absoluteUrl(clinic.cover_image_url);
  const logo = absoluteUrl(clinic.logo_url);
  const rating = clinic.rating_avg ? Number(clinic.rating_avg) : 0;
  const distance = formatDistance(clinic.distance_meters);

  return (
    <Card padded={false} onPress={() => router.push(`/clinic/${clinic.slug}`)} style={{ overflow: "hidden" }}>
      <View style={{ height: 118 }}>
        {cover ? (
          <Image source={{ uri: cover }} style={{ flex: 1 }} contentFit="cover" />
        ) : (
          <LinearGradient colors={[brand[800], brand[600], brand[400]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
        )}
        {clinic.is_verified && (
          <View
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: radius.full,
              backgroundColor: c.surface,
            }}
          >
            <BadgeCheck size={13} color={c.brand} />
            <Txt size={11} weight="medium" tone="brand" lineHeight={15}>
              ยืนยันแล้ว
            </Txt>
          </View>
        )}
        <View style={{ position: "absolute", bottom: 10, right: 10 }}>
          <FavoriteButton clinicId={clinic.id} favorited={favorited} />
        </View>
      </View>
      <View style={{ padding: 14, gap: 6, flexDirection: "row" }}>
        {logo && (
          <Image
            source={{ uri: logo }}
            style={{ width: 44, height: 44, borderRadius: 12, marginTop: -30, borderWidth: 2, borderColor: c.surface, backgroundColor: c.surface }}
          />
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <Txt size={16} weight="semibold" numberOfLines={1}>
            {clinic.name}
          </Txt>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Star size={14} color={c.star} fill={rating ? c.star : "transparent"} />
              <Txt size={13.5} weight="semibold">
                {rating ? rating.toFixed(1) : "ใหม่"}
              </Txt>
              <Txt size={13} tone="faint">
                ({clinic.rating_count})
              </Txt>
            </View>
            {(clinic.district || distance) && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 1 }}>
                <MapPin size={13} color={c.textFaint} />
                <Txt size={13} tone="muted" numberOfLines={1}>
                  {[clinic.district, distance].filter(Boolean).join(" · ")}
                </Txt>
              </View>
            )}
          </View>
          {clinic.species_list.length > 0 && (
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
              {clinic.species_list.slice(0, 4).map((s) => (
                <View
                  key={s}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: radius.full,
                    backgroundColor: c.surfaceAlt,
                  }}
                >
                  <SpeciesIcon species={s} size={12} color={c.textMuted} />
                  <Txt size={11.5} tone="muted" lineHeight={16}>
                    {getSpeciesLabel(s)}
                  </Txt>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}
