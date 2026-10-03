import { router } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { TopActions } from "@/components/TopActions";
import { AppBar, Card, ErrorView, LoadingView, PetAvatar, Screen, Txt } from "@/components/ui";
import { useVetHome, useVetWeek } from "@/features/staffQueries";
import { addDays } from "@/lib/format";
import { toneColors, toneOf } from "@/shared/apptTone";
import { radius, useColors } from "@/theme";
import { VetClinicSwitcher } from "@/components/staff/VetClinicSwitcher";

/** ตารางสัปดาห์ของหมอ — loadVetWeek() ชุดเดียวกับแท็บ "ตาราง" ของ MobileVetView บนเว็บ */
export default function VetWeekTab() {
  const c = useColors();
  const [start, setStart] = useState<string | null>(null);
  const home = useVetHome();
  const { data, isLoading, error, refetch, isRefetching } = useVetWeek(start);

  return (
    <Screen
      inTabs
      header={<AppBar title="ตารางนัด" subtitle={home.data?.selected_clinic?.clinic_name ?? null} right={<TopActions />} />}
      refreshing={isRefetching}
      onRefresh={refetch}
    >
      {home.data && <VetClinicSwitcher clinics={home.data.clinics} selected={home.data.selected_clinic} />}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable
          onPress={() => data && setStart(addDays(data.weekStartIso, -7))}
          hitSlop={8}
          style={{ padding: 6 }}
          accessibilityLabel="สัปดาห์ก่อน"
        >
          <ChevronLeft size={24} color={c.text} />
        </Pressable>
        <Txt weight="semibold" align="center" style={{ flex: 1 }}>
          {data?.weekLabel ?? ""}
        </Txt>
        <Pressable
          onPress={() => data && setStart(addDays(data.weekStartIso, 7))}
          hitSlop={8}
          style={{ padding: 6 }}
          accessibilityLabel="สัปดาห์ถัดไป"
        >
          <ChevronRight size={24} color={c.text} />
        </Pressable>
      </View>
      {start && (
        <Txt size={13.5} tone="brand" align="center" onPress={() => setStart(null)}>
          กลับมาสัปดาห์นี้
        </Txt>
      )}

      {isLoading ? (
        <LoadingView />
      ) : error || !data ? (
        <ErrorView message={(error as Error)?.message ?? "โหลดไม่สำเร็จ"} onRetry={refetch} />
      ) : (
        data.weekDays.map((d) => {
          const list = data.appts.filter((a) => a.iso_date === d.iso);
          return (
            <View key={d.iso} style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                <Txt size={15} weight="bold" tone={d.isToday ? "brand" : "default"}>
                  {d.dowFull} {d.day} {d.monthShort}
                </Txt>
                {d.isToday && (
                  <Txt size={12.5} tone="brand">
                    วันนี้
                  </Txt>
                )}
                <Txt size={12.5} tone="faint" style={{ marginLeft: "auto" }}>
                  {list.length ? `${list.length} นัด` : "ว่าง"}
                </Txt>
              </View>
              {list.map((a) => {
                const tone = toneOf(a.status);
                const t = toneColors(tone, c.isDark);
                const pet = a.pet_name ?? a.walk_in_pet_name ?? "ไม่ระบุ";
                return (
                  <Card
                    key={a.id}
                    onPress={a.pet_id ? () => router.push(`/vet/pets/${a.pet_id}`) : undefined}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12 }}
                  >
                    <Txt size={15} weight="bold" style={{ width: 48 }}>
                      {a.time}
                    </Txt>
                    <PetAvatar species={a.pet_species} seed={a.pet_id ?? pet} url={a.pet_avatar_url} size={36} />
                    <View style={{ flex: 1 }}>
                      <Txt weight="medium" numberOfLines={1}>
                        {pet}
                      </Txt>
                      <Txt size={12.5} tone="muted" numberOfLines={1}>
                        {[a.service_label, a.owner_name ?? a.walk_in_owner_name].filter(Boolean).join(" · ")}
                      </Txt>
                    </View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, backgroundColor: t.tint }}>
                      <Txt size={11} weight="semibold" color={t.ink} lineHeight={15}>
                        {tone.label}
                      </Txt>
                    </View>
                  </Card>
                );
              })}
            </View>
          );
        })
      )}
    </Screen>
  );
}
