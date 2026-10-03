import { View } from "react-native";
import { ChatList } from "@/components/ChatList";
import { TopActions } from "@/components/TopActions";
import { AppBar } from "@/components/ui";
import { useColors } from "@/theme";

/** แท็บแชทของหมอ — ห้องที่เจ้าของทักหมอ + ห้องเคสต่อนัด (หมอปิดเคสได้จากในห้อง) */
export default function VetMessages() {
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppBar title="ข้อความ" right={<TopActions />} />
      <ChatList />
    </View>
  );
}
