import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ExternalLink, Inbox, ListChecks, MessageSquareReply, ScanLine, Store, Users, UsersRound } from "lucide-react-native";
import { WEB_BASE_URL } from "@/api/config";
import { TopActions } from "@/components/TopActions";
import { StaffSettings } from "@/components/staff/StaffSettings";
import { AppBar, Card, ListRow, Screen, SectionTitle } from "@/components/ui";
import { useClinicCan, useClinicOverview } from "@/features/staffQueries";

/** แท็บจัดการ — เมนูชุดเดียวกับแท็บ "จัดการ" ของ MobileClinicAdminView บนเว็บ */
export default function ClinicManage() {
  const { data } = useClinicOverview();
  const s = data?.stats;
  const can = useClinicCan();
  return (
    <Screen inTabs header={<AppBar title="จัดการ" subtitle={data?.clinic.name} right={<TopActions />} />}>
      <SectionTitle>คลินิก</SectionTitle>
      <Card padded={false}>
        {can("customers.view") && (
          <ListRow icon={ScanLine} label="สแกน QR น้อง" value="เปิดแฟ้ม" onPress={() => router.push("/clinic-admin/scan-pet")} />
        )}
        {can("appointments.manage") && (
          <ListRow icon={Inbox} label="คำขอจองคิว" value={s?.pending_requests ? `${s.pending_requests} รอรับ` : null} onPress={() => router.push("/clinic-admin/requests")} />
        )}
        {can("reviews.reply") && (
          <ListRow icon={MessageSquareReply} label="รีวิว" value={s?.pending_reply ? `${s.pending_reply} รอตอบ` : null} onPress={() => router.push("/clinic-admin/reviews")} />
        )}
        {can("settings.clinic") && <ListRow icon={ListChecks} label="บริการและราคา" onPress={() => router.push("/clinic-admin/services")} />}
        {can("settings.clinic") && <ListRow icon={Store} label="ข้อมูลคลินิก" onPress={() => router.push("/clinic-admin/profile")} />}
        {can("team.manage") && <ListRow icon={Users} label="สัตวแพทย์" onPress={() => router.push("/clinic-admin/vets")} />}
        {can("team.manage") && (
          <ListRow icon={UsersRound} label="ทีมและสิทธิ์ (เว็บ)" onPress={() => WebBrowser.openBrowserAsync(`${WEB_BASE_URL}/clinic-admin/team`)} />
        )}
        <ListRow
          icon={ExternalLink}
          label="หลังบ้านบนเว็บ (POS / สต็อก / เคส)"
          onPress={() => WebBrowser.openBrowserAsync(`${WEB_BASE_URL}/clinic-admin`)}
          last
        />
      </Card>
      <Card padded={false}>
        <ListRow
          icon={ExternalLink}
          label="หน้าคลินิกบนเว็บ"
          onPress={() => data && WebBrowser.openBrowserAsync(`${WEB_BASE_URL}/clinic/${data.clinic.slug}`)}
          last
        />

      </Card>
      <StaffSettings />
    </Screen>
  );
}
