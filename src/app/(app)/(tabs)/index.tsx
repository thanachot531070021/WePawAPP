import * as Location from "expo-location";
import { router } from "expo-router";
import { Clock, LocateFixed, List, Map as MapIcon, MessagesSquare, Search, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, TextInput, View } from "react-native";
import type { ClinicSearch } from "@/api/endpoints";
import { ClinicCard } from "@/components/ClinicCard";
import { ClinicMap } from "@/components/ClinicMap";
import { TopActions } from "@/components/TopActions";
import { AppBar, Chip, EmptyState, ErrorView, LoadingView, toast, Txt } from "@/components/ui";
import { useClinics, useFavorites } from "@/features/queries";
import { font, gutter, radius, useColors } from "@/theme";

const SPECIES_FILTERS = [
  { id: "dog", label: "สุนัข" },
  { id: "cat", label: "แมว" },
  { id: "rabbit", label: "กระต่าย" },
  { id: "bird", label: "นก" },
  { id: "exotic", label: "สัตว์พิเศษ" },
];

const SORTS: { id: NonNullable<ClinicSearch["sort"]>; label: string }[] = [
  { id: "rating", label: "คะแนนสูงสุด" },
  { id: "reviews", label: "รีวิวมากสุด" },
  { id: "newest", label: "ใหม่ล่าสุด" },
];

/** แท็บค้นหาคลินิก — SQL เดียวกับหน้า /search ของเว็บ (ผ่าน /api/mobile/clinics) */
export default function SearchTab() {
  const c = useColors();
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [species, setSpecies] = useState<string[]>([]);
  const [openNow, setOpenNow] = useState(false);
  const [sort, setSort] = useState<NonNullable<ClinicSearch["sort"]>>("rating");
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");

  // พิมพ์เสร็จค่อยค้น (หน่วง 350ms) ไม่ยิงทุกตัวอักษร
  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 350);
    return () => clearTimeout(t);
  }, [text]);

  const params: ClinicSearch = useMemo(
    () => ({
      q: q || undefined,
      species: species.length ? species : undefined,
      open_now: openNow,
      sort,
      ...(here ? { lat: here.lat, lng: here.lng, radius: 10000 } : {}),
    }),
    [q, species, openNow, sort, here]
  );
  const { data, isLoading, error, refetch, isRefetching } = useClinics(params);
  const { data: favs } = useFavorites();
  const favIds = useMemo(() => new Set((favs ?? []).map((f) => f.id)), [favs]);

  async function toggleNearMe() {
    if (here) {
      setHere(null);
      return;
    }
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        toast.error("ต้องอนุญาตตำแหน่งก่อน จึงค้นหาคลินิกใกล้คุณได้");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      toast.error("หาตำแหน่งไม่ได้ ลองใหม่อีกครั้ง");
    } finally {
      setLocating(false);
    }
  }

  const toggleSpecies = (id: string) =>
    setSpecies((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const filters = (
    <View style={{ gap: 10, paddingBottom: 6 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          height: 46,
          paddingHorizontal: 14,
          borderRadius: radius.lg,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.borderStrong,
        }}
      >
        <Search size={19} color={c.textFaint} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="ค้นหาชื่อคลินิก ย่าน หรือถนน"
          placeholderTextColor={c.textFaint}
          returnKeyType="search"
          style={{ flex: 1, fontFamily: font.regular, fontSize: 15.5, color: c.text }}
          testID="search-input"
        />
        {!!text && (
          <Pressable onPress={() => setText("")} hitSlop={8} accessibilityLabel="ล้างคำค้น">
            <X size={18} color={c.textFaint} />
          </Pressable>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label={locating ? "กำลังหาตำแหน่ง…" : "ใกล้ฉัน"} icon={LocateFixed} selected={!!here} onPress={toggleNearMe} />
        <Chip label="เปิดอยู่ตอนนี้" icon={Clock} selected={openNow} onPress={() => setOpenNow((v) => !v)} />
        {SPECIES_FILTERS.map((s) => (
          <Chip key={s.id} label={s.label} selected={species.includes(s.id)} onPress={() => toggleSpecies(s.id)} />
        ))}
      </ScrollView>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Txt size={13.5} tone="muted" style={{ flexShrink: 0 }}>
          {isLoading ? "กำลังค้นหา…" : `พบ ${data?.length ?? 0} คลินิก${here ? " ในรัศมี 10 กม." : ""}`}
        </Txt>
        {!here && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ gap: 12 }}>
            {SORTS.map((s) => (
              <Txt
                key={s.id}
                size={13.5}
                weight={sort === s.id ? "semibold" : "regular"}
                tone={sort === s.id ? "brand" : "muted"}
                onPress={() => setSort(s.id)}
              >
                {s.label}
              </Txt>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppBar
        title="ค้นหาคลินิก"
        subtitle="คลินิกใกล้บ้านที่มีรีวิวจริง"
        right={
          <>
            <Pressable
              onPress={() => setView((v) => (v === "list" ? "map" : "list"))}
              accessibilityLabel={view === "list" ? "ดูแผนที่" : "ดูรายการ"}
              hitSlop={6}
              style={{ padding: 8 }}
            >
              {view === "list" ? <MapIcon size={22} color={c.textMuted} /> : <List size={22} color={c.textMuted} />}
            </Pressable>
            <TopActions />
          </>
        }
      />
      {view === "map" ? (
        <View style={{ flex: 1 }}>
          <View style={{ padding: gutter, paddingBottom: 0 }}>{filters}</View>
          <ClinicMap clinics={data ?? []} center={here} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: gutter, gap: 14, paddingBottom: 32 }}
          ListHeaderComponent={filters}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => <ClinicCard clinic={item} favorited={favIds.has(item.id)} />}
          ListEmptyComponent={
            isLoading ? (
              <LoadingView />
            ) : error ? (
              <ErrorView message={(error as Error).message} onRetry={refetch} />
            ) : (
              <EmptyState icon={Search} title="ไม่พบคลินิกที่ตรงเงื่อนไข" body="ลองลดตัวกรอง หรือค้นหาด้วยชื่อย่าน" />
            )
          }
          ListFooterComponent={
            <Pressable
              onPress={() => router.push("/community")}
              style={{
                marginTop: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: radius.lg,
                backgroundColor: c.brandSoft,
              }}
            >
              <MessagesSquare size={22} color={c.brandSoftText} />
              <View style={{ flex: 1 }}>
                <Txt weight="semibold" color={c.brandSoftText}>
                  ชุมชนถาม-ตอบ
                </Txt>
                <Txt size={13} color={c.brandSoftText}>
                  ถามอาการน้อง มีสัตวแพทย์ช่วยตอบ
                </Txt>
              </View>
            </Pressable>
          }
        />
      )}
    </View>
  );
}
