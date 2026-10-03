import { router } from "expo-router";
import { Search } from "lucide-react-native";
import { View } from "react-native";
import { ChatList } from "@/components/ChatList";
import { AppBar, Button } from "@/components/ui";
import { useSession } from "@/state/session";
import { useColors } from "@/theme";

/** กล่องข้อความ (เปิดจากปุ่มแชทบน app bar) */
export default function ChatInbox() {
  const c = useColors();
  const role = useSession((s) => s.user?.role);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppBar title="ข้อความ" back />
      <ChatList
        emptyAction={
          role === "pet_owner" ? <Button label="ค้นหาคลินิก" icon={Search} full onPress={() => router.navigate("/")} /> : undefined
        }
      />
    </View>
  );
}
