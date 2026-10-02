import { Image } from "expo-image";
import { router } from "expo-router";
import { MessageCircle, Search } from "lucide-react-native";
import { FlatList, Pressable, View } from "react-native";
import { absoluteUrl } from "@/api/config";
import { AppBar, Button, EmptyState, ErrorView, LoadingView, Txt } from "@/components/ui";
import { BrandMark } from "@/components/ui/BrandMark";
import { useChatThreads } from "@/features/queries";
import { timeAgo } from "@/lib/format";
import { gutter, useColors } from "@/theme";

/** กล่องข้อความ — = ChatInboxList ของเว็บ (ห้องคลินิก / ห้องเคสต่อนัด) */
export default function ChatInbox() {
  const c = useColors();
  const { data, isLoading, error, refetch, isRefetching } = useChatThreads();

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppBar title="ข้อความ" back />
      <FlatList
        data={data ?? []}
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
                body="เริ่มแชทกับคลินิกได้จากหน้าโปรไฟล์คลินิก"
                action={<Button label="ค้นหาคลินิก" icon={Search} full onPress={() => router.navigate("/")} />}
              />
            </View>
          )
        }
        renderItem={({ item: t }) => {
          const logo = absoluteUrl(t.clinic_logo_url);
          const unread = t.owner_unread_count > 0;
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
              {logo ? <Image source={{ uri: logo }} style={{ width: 48, height: 48, borderRadius: 24 }} /> : <BrandMark size={48} />}
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Txt weight={unread ? "bold" : "semibold"} numberOfLines={1} style={{ flex: 1 }}>
                    {t.kind === "case" ? t.subject ?? t.clinic_name : t.clinic_name}
                  </Txt>
                  {t.last_message_at && (
                    <Txt size={12} tone="faint">
                      {timeAgo(t.last_message_at)}
                    </Txt>
                  )}
                </View>
                {(t.kind === "case" || t.pet_name) && (
                  <Txt size={12.5} tone="brand" numberOfLines={1}>
                    {t.kind === "case" ? "แชทเคส" : ""}
                    {t.pet_name ? `${t.kind === "case" ? " · " : ""}น้อง${t.pet_name}` : ""}
                    {t.status === "closed" ? " · ปิดแล้ว" : ""}
                  </Txt>
                )}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Txt size={13.5} tone={unread ? "default" : "muted"} weight={unread ? "medium" : "regular"} numberOfLines={1} style={{ flex: 1 }}>
                    {t.last_message_preview ?? "เริ่มการสนทนา"}
                  </Txt>
                  {unread && (
                    <View style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: c.dangerSolid, alignItems: "center", justifyContent: "center" }}>
                      <Txt size={11} weight="bold" color="#fff" lineHeight={14}>
                        {t.owner_unread_count}
                      </Txt>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: c.border, marginLeft: gutter + 60 }} />}
      />
    </View>
  );
}
