import { useMutation } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  BadgeCheck,
  CalendarPlus,
  ChevronLeft,
  Clock,
  Globe,
  Home,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  PenLine,
  Star,
} from "lucide-react-native";
import { Linking, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { absoluteUrl } from "@/api/config";
import { chatApi } from "@/api/endpoints";
import type { ClinicHour, Review } from "@/api/types";
import { FavoriteButton } from "@/components/ClinicCard";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorView,
  LoadingView,
  SectionTitle,
  SpeciesIcon,
  Stars,
  toast,
  Txt,
} from "@/components/ui";
import { useBookingData, useClinic, useFavorites } from "@/features/queries";
import { formatPrice, TH_DAYS, timeAgo } from "@/lib/format";
import { formatThaiPhone } from "@/shared/phone";
import { getSpeciesLabel } from "@/shared/species";
import { brand, gutter, radius, useColors } from "@/theme";

function hoursLabel(h: ClinicHour | undefined): string {
  if (!h || h.is_closed || !h.open_time || !h.close_time) return "ปิด";
  return `${h.open_time.slice(0, 5)} – ${h.close_time.slice(0, 5)}`;
}

function todayDow(): number {
  return new Date(Date.now() + 7 * 3600_000).getUTCDay();
}

function ReviewItem({ r, first }: { r: Review; first: boolean }) {
  const c = useColors();
  return (
    <View style={{ gap: 6, paddingVertical: 12, borderTopWidth: first ? 0 : 1, borderTopColor: c.border }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Avatar url={r.user_avatar_url} name={r.user_full_name} size={34} />
        <View style={{ flex: 1 }}>
          <Txt size={14} weight="semibold" numberOfLines={1}>
            {r.user_full_name}
          </Txt>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Stars value={r.rating} size={12} />
            <Txt size={12} tone="faint">
              {timeAgo(r.created_at)}
              {r.pet_name ? ` · น้อง${r.pet_name}` : ""}
            </Txt>
          </View>
        </View>
      </View>
      {r.title && <Txt weight="semibold">{r.title}</Txt>}
      {r.comment && (
        <Txt size={14} tone="muted">
          {r.comment}
        </Txt>
      )}
      {r.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {r.images.map((u) => (
            <Image key={u} source={{ uri: absoluteUrl(u)! }} style={{ width: 72, height: 72, borderRadius: 10 }} />
          ))}
        </ScrollView>
      )}
      {r.clinic_reply && (
        <View style={{ marginTop: 4, padding: 10, borderRadius: radius.md, backgroundColor: c.surfaceAlt }}>
          <Txt size={12.5} weight="semibold" tone="brand">
            คลินิกตอบกลับ
          </Txt>
          <Txt size={13.5} tone="muted">
            {r.clinic_reply}
          </Txt>
        </View>
      )}
    </View>
  );
}

export default function ClinicScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useClinic(slug);
  const booking = useBookingData(data?.clinic.id);
  const { data: favs } = useFavorites();

  const startChat = useMutation({
    mutationFn: () => chatApi.start(data!.clinic.id),
    onSuccess: (r) => router.push(`/chat/${r.thread.id}`),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <LoadingView />;
  if (error || !data)
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 40, backgroundColor: c.bg }}>
        <ErrorView message={(error as Error)?.message ?? "ไม่พบคลินิก"} onRetry={refetch} />
      </View>
    );

  const { clinic, hours, services, vets, reviews, images } = data;
  const cover = absoluteUrl(clinic.cover_image_url);
  const logo = absoluteUrl(clinic.logo_url);
  const rating = clinic.rating_avg ? Number(clinic.rating_avg) : 0;
  const dow = todayDow();
  const favorited = (favs ?? []).some((f) => f.id === clinic.id);
  const homeVisit = booking.data?.homeVisit.bookingEnabled;
  const address = [clinic.address_line, clinic.sub_district, clinic.district, clinic.province].filter(Boolean).join(" ");

  const openMaps = () => {
    if (clinic.lat == null || clinic.lng == null) return;
    const url =
      Platform.OS === "ios"
        ? `maps://?daddr=${clinic.lat},${clinic.lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}`;
    void Linking.openURL(url);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ height: 210 }}>
          {cover ? (
            <Image source={{ uri: cover }} style={{ flex: 1 }} contentFit="cover" />
          ) : (
            <LinearGradient colors={[brand[800], brand[600], brand[400]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
          )}
          <View style={{ position: "absolute", top: insets.top + 8, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between" }}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
              accessibilityLabel="ย้อนกลับ"
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" }}
            >
              <ChevronLeft size={24} color={c.text} />
            </Pressable>
            <FavoriteButton clinicId={clinic.id} favorited={favorited} size={38} />
          </View>
        </View>

        <View style={{ paddingHorizontal: gutter, marginTop: -36, gap: 14 }}>
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              {logo && <Image source={{ uri: logo }} style={{ width: 52, height: 52, borderRadius: 14 }} />}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Txt size={19} weight="bold" style={{ flexShrink: 1 }}>
                    {clinic.name}
                  </Txt>
                  {clinic.is_verified && <BadgeCheck size={18} color={c.brand} />}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Star size={15} color={c.star} fill={rating ? c.star : "transparent"} />
                  <Txt size={14} weight="semibold">
                    {rating ? rating.toFixed(1) : "ยังไม่มีคะแนน"}
                  </Txt>
                  <Txt size={13.5} tone="faint">
                    ({clinic.rating_count} รีวิว)
                  </Txt>
                </View>
              </View>
            </View>
            {clinic.description && (
              <Txt size={14} tone="muted">
                {clinic.description}
              </Txt>
            )}
            {address ? (
              <Pressable onPress={openMaps} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                <MapPin size={16} color={c.textMuted} style={{ marginTop: 3 }} />
                <Txt size={14} tone="muted" style={{ flex: 1 }}>
                  {address}
                </Txt>
              </Pressable>
            ) : null}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              {clinic.phone && (
                <Button
                  label="โทร"
                  icon={Phone}
                  variant="outline"
                  size="sm"
                  style={{ flex: 1 }}
                  onPress={() => Linking.openURL(`tel:${clinic.phone}`)}
                />
              )}
              <Button label="แชท" icon={MessageCircle} variant="outline" size="sm" style={{ flex: 1 }} loading={startChat.isPending} onPress={() => startChat.mutate()} />
              {clinic.lat != null && <Button label="นำทาง" icon={Navigation} variant="outline" size="sm" style={{ flex: 1 }} onPress={openMaps} />}
            </View>
          </Card>

          {clinic.species_list.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {clinic.species_list.map((s) => (
                <View
                  key={s}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: radius.full,
                    backgroundColor: c.surface,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                >
                  <SpeciesIcon species={s} size={14} color={c.brand} />
                  <Txt size={13}>{getSpeciesLabel(s)}</Txt>
                </View>
              ))}
            </View>
          )}

          <SectionTitle>
            <Clock size={13} color={c.textMuted} /> เวลาทำการ
          </SectionTitle>
          <Card style={{ gap: 6 }}>
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const h = hours.find((x) => x.day_of_week === d);
              const isToday = d === dow;
              return (
                <View key={d} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Txt size={14} weight={isToday ? "bold" : "regular"} tone={isToday ? "brand" : "default"}>
                    {TH_DAYS[d]}
                    {isToday ? " (วันนี้)" : ""}
                  </Txt>
                  <Txt size={14} weight={isToday ? "bold" : "regular"} tone={hoursLabel(h) === "ปิด" ? "faint" : isToday ? "brand" : "muted"}>
                    {hoursLabel(h)}
                  </Txt>
                </View>
              );
            })}
          </Card>

          {services.length > 0 && (
            <>
              <SectionTitle>บริการและราคา</SectionTitle>
              <Card padded={false}>
                {services.map((s, i) => (
                  <View
                    key={s.id}
                    style={{
                      padding: 14,
                      flexDirection: "row",
                      gap: 10,
                      borderBottomWidth: i === services.length - 1 ? 0 : 1,
                      borderBottomColor: c.border,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Txt weight="medium">{s.service_name}</Txt>
                      {s.description && (
                        <Txt size={13} tone="muted">
                          {s.description}
                        </Txt>
                      )}
                    </View>
                    {formatPrice(s.price_min, s.price_max) && (
                      <Txt size={14} weight="semibold" tone="brand">
                        {formatPrice(s.price_min, s.price_max)}
                      </Txt>
                    )}
                  </View>
                ))}
              </Card>
            </>
          )}

          {vets.length > 0 && (
            <>
              <SectionTitle>สัตวแพทย์</SectionTitle>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {vets.map((v) => (
                  <Card key={v.id} style={{ width: 170, alignItems: "center", gap: 6 }}>
                    <Avatar url={v.avatar_url} name={v.full_name} size={54} />
                    <Txt size={14} weight="semibold" align="center" numberOfLines={2}>
                      {v.full_name}
                    </Txt>
                    {v.years_of_experience ? (
                      <Txt size={12} tone="muted">
                        ประสบการณ์ {v.years_of_experience} ปี
                      </Txt>
                    ) : null}
                    {v.specialties?.length ? (
                      <Txt size={12} tone="faint" align="center" numberOfLines={2}>
                        {v.specialties.join(" · ")}
                      </Txt>
                    ) : null}
                  </Card>
                ))}
              </ScrollView>
            </>
          )}

          {images.length > 0 && (
            <>
              <SectionTitle>รูปภาพ</SectionTitle>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {images.map((img) => (
                  <Image key={img.id} source={{ uri: absoluteUrl(img.image_url)! }} style={{ width: 160, height: 110, borderRadius: radius.md }} />
                ))}
              </ScrollView>
            </>
          )}

          <SectionTitle
            action={
              <Pressable onPress={() => router.push(`/clinic/${clinic.slug}/review`)} style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                <PenLine size={15} color={c.brand} />
                <Txt size={13.5} weight="semibold" tone="brand">
                  เขียนรีวิว
                </Txt>
              </Pressable>
            }
          >
            รีวิวจากเจ้าของสัตว์
          </SectionTitle>
          <Card style={{ paddingTop: 4, paddingBottom: 4 }}>
            {reviews.length === 0 ? (
              <EmptyState icon={Star} title="ยังไม่มีรีวิว" body="เป็นคนแรกที่รีวิวคลินิกนี้" />
            ) : (
              reviews.map((r, i) => <ReviewItem key={r.id} r={r} first={i === 0} />)
            )}
          </Card>
          {clinic.website && (
            <Pressable onPress={() => Linking.openURL(clinic.website!)} style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
              <Globe size={15} color={c.brand} />
              <Txt size={14} tone="brand">
                {clinic.website}
              </Txt>
            </Pressable>
          )}
          {clinic.phone && (
            <Txt size={13} tone="faint" align="center">
              โทร {formatThaiPhone(clinic.phone)}
            </Txt>
          )}
        </View>
      </ScrollView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: gutter,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 12),
          backgroundColor: c.surface,
          borderTopWidth: 1,
          borderTopColor: c.borderStrong,
        }}
      >
        {homeVisit && (
          <Button
            label="หมอเยี่ยมบ้าน"
            icon={Home}
            variant="soft"
            size="lg"
            style={{ flex: 1 }}
            onPress={() => router.push(`/clinic/${clinic.slug}/home-visit`)}
          />
        )}
        <Button label="จองคิว" icon={CalendarPlus} size="lg" style={{ flex: 1 }} onPress={() => router.push(`/clinic/${clinic.slug}/book`)} testID="book" />
      </View>
    </View>
  );
}
