import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ExternalLink, Inbox, ListChecks, MessageSquareReply, Store, Users } from "lucide-react-native";
import { WEB_BASE_URL } from "@/api/config";
import { TopActions } from "@/components/TopActions";
import { StaffSettings } from "@/components/staff/StaffSettings";
import { AppBar, Card, ListRow, Screen, SectionTitle } from "@/components/ui";
import { useClinicOverview } from "@/features/staffQueries";

/** แท็บจัดการ — เมนูชุดเดียวกับแท็บ "จัดการ" ของ MobileClinicAdminView บนเว็บ */
export default function ClinicManage() {
  const { data } = useClinicOverview();
  const s = data?.stats;
  return (
    <Screen inTabs header={<AppBar title="จัดการ" subtitle={data?.clinic.name} right={<TopActions />} />}>
      <SectionTitle>คลินิก</SectionTitle>
      <Card padded={false}>
        <ListRow icon={Inbox} label="คำขอจองคิว" value={s?.pending_requests ? `${s.pending_requests} รอรับ` : null} onPress={() => router.push("/clinic-admin/requests")} />
        <ListRow icon={MessageSquareReply} label="รีวิว" value={s?.pending_reply ? `${s.pending_reply} รอตอบ` : null} onPress={() => router.push("/clinic-admin/reviews")} />
        <ListRow icon={ListChecks} label="บริการและราคา" onPress={() => router.push("/clinic-admin/services")} />
        <ListRow icon={Store} label="ข้อมูลคลินิก" onPress={() => router.push("/clinic-admin/profile")} />
        <ListRow icon={Users} label="สัตวแพทย์" onPress={() => router.push("/clinic-admin/vets")} last />
      </Card>
      <Card padded={false}>
        <ListRow
          icon={ExternalLink}
          label="หน้าคลินิกบนเว็บ"
          onPress={() => data && WebBrowser.openBrowserAsync(`${WEB_BASE_URL}/clinic/${data.clinic.slug}`)}
        />
        <ListRow icon={ExternalLink} label="หลังบ้านเต็มรูปแบบ (POS / สต็อก)" onPress={() => WebBrowser.openBrowserAsync(`${WEB_BASE_URL}/clinic-admin`)} last />
      </Card>
      <StaffSettings />
    </Screen>
  );
}
