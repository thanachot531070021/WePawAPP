import { router } from "expo-router";
import { MessageCircle, MessagesSquare, Plus } from "lucide-react-native";
import { useState } from "react";
import { FlatList, ScrollView, View } from "react-native";
import { COMM_FILTERS, SpeciesTag, VetBadge } from "@/components/community";
import { AppBar, Avatar, Card, Chip, EmptyState, ErrorView, IconButton, LoadingView, Notice, Txt } from "@/components/ui";
import { useCommunity } from "@/features/queries";
import { gutter, useColors } from "@/theme";

/** ชุมชนถาม-ตอบ — = /community (mobile) ของเว็บ */
export default function CommunityScreen() {
  const c = useColors();
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<"recent" | "top">("recent");
  const { data, isLoading, error, refetch, isRefetching } = useCommunity(filter, sort);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppBar title="ชุมชนถาม-ตอบ" back right={<IconButton icon={Plus} label="ตั้งคำถาม" onPress={() => router.push("/community/ask")} />} />
      <FlatList
        data={data ?? []}
        keyExtractor={(q) => q.id}
        refreshing={isRefetching}
        onRefresh={refetch}
        contentContainerStyle={{ padding: gutter, gap: 12, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ gap: 10 }}>
            <Notice tone="brand">คำตอบในชุมชนไม่ใช่การวินิจฉัย — ถ้าน้องอาการหนัก โปรดพาไปคลินิกทันที</Notice>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {COMM_FILTERS.map((f) => (
                <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 14 }}>
              {(
                [
                  ["recent", "ล่าสุด"],
                  ["top", "ยอดนิยม"],
                ] as const
              ).map(([k, l]) => (
                <Txt key={k} size={13.5} weight={sort === k ? "semibold" : "regular"} tone={sort === k ? "brand" : "muted"} onPress={() => setSort(k)}>
                  {l}
                </Txt>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <LoadingView />
          ) : error ? (
            <ErrorView message={(error as Error).message} onRetry={refetch} />
          ) : (
            <EmptyState icon={MessagesSquare} title="ยังไม่มีคำถาม" body="เป็นคนแรกที่ถามในหมวดนี้" />
          )
        }
        renderItem={({ item: q }) => (
          <Card onPress={() => router.push(`/community/${q.id}`)} style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Avatar url={q.askerAvatar} name={q.askerName} size={30} />
              <Txt size={13} weight="medium" style={{ flex: 1 }} numberOfLines={1}>
                {q.askerName}
              </Txt>
              <Txt size={12} tone="faint">
                {q.time}
              </Txt>
            </View>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              <SpeciesTag species={q.species} />
              {q.vetAnswered && <VetBadge />}
            </View>
            <Txt size={16} weight="semibold">
              {q.title}
            </Txt>
            <Txt size={14} tone="muted" numberOfLines={2}>
              {q.body}
            </Txt>
            <View style={{ flexDirection: "row", gap: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MessageCircle size={14} color={c.textFaint} />
                <Txt size={12.5} tone="muted">
                  {q.answerCount} คำตอบ
                </Txt>
              </View>
              <Txt size={12.5} tone="muted">
                👍 {q.likes} · เข้าชม {q.views}
              </Txt>
            </View>
          </Card>
        )}
      />
    </View>
  );
}
