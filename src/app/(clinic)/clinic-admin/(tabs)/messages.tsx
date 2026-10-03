import { View } from "react-native";
import { ChatList } from "@/components/ChatList";
import { TopActions } from "@/components/TopActions";
import { AppBar } from "@/components/ui";
import { useColors } from "@/theme";

/** แท็บแชทของคลินิก — ห้องแชทกับลูกค้า + ห้องเคส (คลินิกอ่านอย่างเดียว ตามกติกาเว็บ) */
export default function ClinicMessages() {
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppBar title="ข้อความ" right={<TopActions />} />
      <ChatList />
    </View>
  );
}
