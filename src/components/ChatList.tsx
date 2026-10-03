import { Image } from "expo-image";
import { router } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import type { ReactElement } from "react";
import { FlatList, Pressable, View } from "react-native";
import { absoluteUrl } from "@/api/config";
import type { ChatThread } from "@/api/types";
import { Avatar, EmptyState, ErrorView, LoadingView, Txt } from "@/components/ui";
import { BrandMark } from "@/components/ui/BrandMark";
import { useChatThreads } from "@/features/queries";
import { timeAgo } from "@/lib/format";
import { gutter, useColors } from "@/theme";

/**
 * รายการห้องแชท — role-aware แบบ ChatInboxList ของเว็บ
 * เจ้าของเห็นชื่อคลินิก · คลินิก/หมอเห็นชื่อเจ้าของสัตว์ · ตัวนับยังไม่อ่านใช้ฝั่งของตัวเอง
 */
export function ChatList({ emptyAction }: { emptyAction?: ReactElement }) {
  const c = useColors();
  const { data, isLoading, error, refetch, isRefetching } = useChatThreads();
  const role = data?.role ?? "owner";

  const row = (t: ChatThread) => {
    const isOwner = role === "owner";
    const unreadCount = isOwner ? t.owner_unread_count : t.clinic_unread_count;
    const unread = unreadCount > 0;
    const title = isOwner
      ? t.kind === "case"
        ? t.subject ?? t.clinic_name
        : t.clinic_name
      : t.owner_full_name;
    const sub = [
      t.kind === "case" ? "แชทเคส" : null,
      t.pet_name ? `น้อง${t.pet_name}` : null,
      !isOwner && t.kind === "case" && t.vet_full_name ? t.vet_full_name : null,
      t.status === "closed" ? "ปิดแล้ว" : null,
    ]
      .filter(Boolean)
      .join(" · ");
    const logo = absoluteUrl(t.clinic_logo_url);

    return (
      <Pressable
        onPress={() => router.push(`/chat/${t.id}`)}
        style={({ pressed }) => ({
          flexDirection: "row",
          gap: 12,
          paddingHorizontal: gutter,
          paddingVertical: 12,
          backgroundColor: pressed ? c.surfaceAlt : "transparent",
        })}
      >
        {isOwner ? (
          logo ? (
            <Image source={{ uri: logo }} style={{ width: 48, height: 48, borderRadius: 24 }} />
          ) : (
            <BrandMark size={48} />
          )
        ) : (
          <Avatar url={t.owner_avatar_url} name={t.owner_full_name} size={48} />
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Txt weight={unread ? "bold" : "semibold"} numberOfLines={1} style={{ flex: 1 }}>
              {title}
            </Txt>
            {t.last_message_at && (
              <Txt size={12} tone="faint">
                {timeAgo(t.last_message_at)}
              </Txt>
            )}
          </View>
          {!!sub && (
            <Txt size={12.5} tone="brand" numberOfLines={1}>
              {sub}
            </Txt>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Txt size={13.5} tone={unread ? "default" : "muted"} weight={unread ? "medium" : "regular"} numberOfLines={1} style={{ flex: 1 }}>
              {t.last_message_preview ?? "เริ่มการสนทนา"}
            </Txt>
            {unread && (
              <View style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: c.dangerSolid, alignItems: "center", justifyContent: "center" }}>
                <Txt size={11} weight="bold" color="#fff" lineHeight={14}>
                  {unreadCount}
                </Txt>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <FlatList
      data={data?.items ?? []}
      keyExtractor={(t) => t.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      contentContainerStyle={{ paddingVertical: 6, flexGrow: 1 }}
      ListEmptyComponent={
        isLoading ? (
          <LoadingView />
        ) : error ? (
          <ErrorView message={(error as Error).message} onRetry={refetch} />
        ) : (
          <View style={{ padding: gutter }}>
            <EmptyState
              icon={MessageCircle}
              title="ยังไม่มีข้อความ"
              body={role === "owner" ? "เริ่มแชทกับคลินิกได้จากหน้าโปรไฟล์คลินิก" : "ข้อความจากเจ้าของสัตว์จะขึ้นที่นี่"}
              action={emptyAction}
            />
          </View>
        )
      }
      renderItem={({ item }) => row(item)}
      ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: c.border, marginLeft: gutter + 60 }} />}
    />
  );
}
