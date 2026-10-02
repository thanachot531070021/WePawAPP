import { router } from "expo-router";
import { Bell, MessageCircle } from "lucide-react-native";
import { IconButton } from "@/components/ui";
import { useChatUnread, useNotifications } from "@/features/queries";

/** ปุ่มแชท + กระดิ่งมุมขวาของทุกแท็บ (เหมือน app bar ของเว็บ) พร้อม badge ยังไม่อ่าน */
export function TopActions() {
  const { data: chatUnread } = useChatUnread();
  const { data: notif } = useNotifications();
  return (
    <>
      <IconButton icon={MessageCircle} label="ข้อความ" badge={chatUnread ?? 0} onPress={() => router.push("/chat")} />
      <IconButton icon={Bell} label="แจ้งเตือน" badge={notif?.unread_count ?? 0} onPress={() => router.push("/notifications")} />
    </>
  );
}
