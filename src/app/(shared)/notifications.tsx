import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Bell, CalendarDays, CheckCheck, Heart, MessageCircle, Star, Syringe } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { notificationApi } from "@/api/endpoints";
import type { NotificationItem } from "@/api/types";
import { AppBar, Chip, EmptyState, ErrorView, IconButton, LoadingView, Txt } from "@/components/ui";
import { useNotifications } from "@/features/queries";
import { timeAgo } from "@/lib/format";
import { webPathToApp } from "@/lib/links";
import { qk } from "@/lib/queryClient";
import { gutter, useColors } from "@/theme";

function iconFor(category: string) {
  if (category.includes("vaccine") || category.includes("medication")) return Syringe;
  if (category.includes("appointment") || category === "follow_up") return CalendarDays;
  if (category.includes("review")) return Star;
  if (category.includes("favorite")) return Heart;
  if (category.includes("inquiry")) return MessageCircle;
  return Bell;
}

/** การแจ้งเตือน — = NotifPanel ของเว็บ (ทั้งหมด / ยังไม่อ่าน / อ่านทั้งหมด) */
export default function NotificationsScreen() {
  const c = useColors();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data, isLoading, error, refetch, isRefetching } = useNotifications();
  const items = (data?.items ?? []).filter((n) => filter === "all" || !n.is_read);

  const read = useMutation({
    mutationFn: (n: NotificationItem) => notificationApi.read(n.id),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });
  const readAll = useMutation({
    mutationFn: notificationApi.readAll,
    onSettled: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });

  function open(n: NotificationItem) {
    if (!n.is_read) read.mutate(n);
    const target = webPathToApp(n.action_url);
    if (target) router.push(target);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppBar
        title="การแจ้งเตือน"
        back
        right={(data?.unread_count ?? 0) > 0 ? <IconButton icon={CheckCheck} label="อ่านทั้งหมด" onPress={() => readAll.mutate()} /> : undefined}
      />
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: gutter, paddingTop: 12 }}>
        <Chip label="ทั้งหมด" selected={filter === "all"} onPress={() => setFilter("all")} />
        <Chip label={`ยังไม่อ่าน${data?.unread_count ? ` ${data.unread_count}` : ""}`} selected={filter === "unread"} onPress={() => setFilter("unread")} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        refreshing={isRefetching}
        onRefresh={refetch}
        contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
        ListEmptyComponent={
          isLoading ? (
            <LoadingView />
          ) : error ? (
            <ErrorView message={(error as Error).message} onRetry={refetch} />
          ) : (
            <EmptyState icon={Bell} title={filter === "unread" ? "อ่านครบแล้ว" : "ยังไม่มีการแจ้งเตือน"} />
          )
        }
        renderItem={({ item: n }) => {
          const Icon = iconFor(n.category);
          return (
            <Pressable
              onPress={() => open(n)}
              style={({ pressed }) => ({
                flexDirection: "row",
                gap: 12,
                paddingHorizontal: gutter,
                paddingVertical: 14,
                backgroundColor: pressed ? c.surfaceAlt : n.is_read ? "transparent" : c.brandSoft,
              })}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.border }}>
                <Icon size={19} color={c.brand} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt weight={n.is_read ? "medium" : "bold"}>{n.title}</Txt>
                <Txt size={13.5} tone="muted">
                  {n.body}
                </Txt>
                <Txt size={12} tone="faint">
                  {timeAgo(n.created_at)}
                </Txt>
              </View>
              {!n.is_read && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c.dangerSolid, marginTop: 6 }} />}
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: c.border }} />}
      />
    </View>
  );
}
