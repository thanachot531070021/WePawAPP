import { router } from "expo-router";
import { CalendarClock, ChevronRight, Eye, Heart, Inbox, MessageSquareReply, Star, Stethoscope, TrendingUp } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { TopActions } from "@/components/TopActions";
import { CLINIC_CASE_TONE } from "@/components/staff/caseTones";
import { AppBar, Card, Notice, Screen, SectionTitle, Txt } from "@/components/ui";
import { useClinicOverview } from "@/features/staffQueries";
import { radius, useColors } from "@/theme";

function Stat({ icon: Icon, value, label, foot }: { icon: typeof Eye; value: string; label: string; foot?: string | null }) {
  const c = useColors();
  return (
    <Card style={{ flex: 1, gap: 4, padding: 14 }}>
      <Icon size={18} color={c.brand} />
      <Txt size={22} weight="bold" lineHeight={28}>
        {value}
      </Txt>
      <Txt size={12.5} tone="muted">
        {label}
      </Txt>
      {foot ? (
        <Txt size={12} tone="brand">
          {foot}
        </Txt>
      ) : null}
    </Card>
  );
}

function Alert({ icon: Icon, text, count, onPress, tone }: { icon: typeof Inbox; text: string; count: number; onPress: () => void; tone: string }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: radius.lg,
        backgroundColor: pressed ? c.surfaceAlt : c.surface,
        borderWidth: 1,
        borderColor: c.border,
      })}
    >
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: `${tone}1f`, alignItems: "center", justifyContent: "center" }}>
        <Icon size={19} color={tone} />
      </View>
      <Txt weight="medium" style={{ flex: 1 }}>
        {text}
      </Txt>
      <Txt size={18} weight="bold" color={tone}>
        {count}
      </Txt>
      <ChevronRight size={18} color={c.textFaint} />
    </Pressable>
  );
}

/** หน้าหลักคลินิก — สถิติชุดเดียวกับแท็บ Dashboard ของ MobileClinicAdminView บนเว็บ */
export default function ClinicHome() {
  const c = useColors();
  const { data, refetch, isRefetching } = useClinicOverview();
  if (!data?.stats || !data.ops) return null;
  const s = data.stats;
  const weekDelta = s.views_prev_7d > 0 ? Math.round(((s.views_7d - s.views_prev_7d) / s.views_prev_7d) * 100) : null;
  const rating = s.rating_count > 0 ? Number(s.rating_avg).toFixed(1) : "0.0";
  const byStatus = (st: string) => data.ops!.cases.filter((x) => x.status === st).length;

  return (
    <Screen inTabs header={<AppBar title="หน้าหลัก" subtitle={data.clinic.name} right={<TopActions />} />} refreshing={isRefetching} onRefresh={refetch}>
      {data.solo_vet && (
        <Notice tone="brand" icon={Stethoscope}>
          {`คลินิกมีสัตวแพทย์คนเดียว (${data.solo_vet.full_name}) — บัญชีนี้เริ่มตรวจและจบเคสแทนหมอได้ที่แท็บนัด`}
        </Notice>
      )}

      {(s.pending_requests > 0 || s.accepted_waiting > 0 || s.pending_reply > 0) && (
        <View style={{ gap: 8 }}>
          {s.pending_requests > 0 && (
            <Alert icon={Inbox} text="คำขอจองรอกดรับ" count={s.pending_requests} tone="#7c3aed" onPress={() => router.push("/clinic-admin/requests")} />
          )}
          {s.accepted_waiting > 0 && (
            <Alert icon={CalendarClock} text="รับแล้ว รอสัตว์มาส่ง" count={s.accepted_waiting} tone="#0d9488" onPress={() => router.push("/clinic-admin/requests")} />
          )}
          {s.pending_reply > 0 && (
            <Alert icon={MessageSquareReply} text="รีวิวรอตอบกลับ" count={s.pending_reply} tone="#d97706" onPress={() => router.push("/clinic-admin/reviews")} />
          )}
        </View>
      )}

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Stat icon={Eye} value={s.views_total.toLocaleString("th-TH")} label="ยอดเข้าชมทั้งหมด" />
        <Stat
          icon={TrendingUp}
          value={s.views_7d.toLocaleString("th-TH")}
          label="เข้าชม 7 วันล่าสุด"
          foot={weekDelta != null ? `${weekDelta >= 0 ? "+" : ""}${weekDelta}% จากสัปดาห์ก่อน` : null}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Stat icon={Heart} value={s.favorite_count.toLocaleString("th-TH")} label="ผู้บันทึก Favorite" />
        <Stat icon={Star} value={rating} label={`คะแนนเฉลี่ย (${s.rating_count})`} foot={s.pending_reply ? `${s.pending_reply} รอตอบ` : null} />
      </View>

      <SectionTitle
        action={
          <Txt size={13.5} weight="semibold" tone="brand" onPress={() => router.navigate("/clinic-admin/appointments")}>
            ดูทั้งหมด
          </Txt>
        }
      >
        งานวันนี้ · {data.ops.dateLabel}
      </SectionTitle>
      <Card style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {(["awaiting", "waiting", "examining", "done"] as const).map((st) => (
          <View key={st} style={{ alignItems: "center", flex: 1, gap: 2 }}>
            <Txt size={22} weight="bold" color={CLINIC_CASE_TONE[st].dot}>
              {byStatus(st)}
            </Txt>
            <Txt size={11.5} tone="muted" align="center">
              {CLINIC_CASE_TONE[st].label}
            </Txt>
          </View>
        ))}
      </Card>
      {data.ops.cases.length === 0 && (
        <Txt tone="muted" align="center" size={14}>
          วันนี้ยังไม่มีเคส
        </Txt>
      )}
      <Txt size={12} tone="faint" align="center" style={{ color: c.textFaint }}>
        POS · สต็อก · สมาชิก · รายงาน ใช้งานบนเว็บ PetCare
      </Txt>
    </Screen>
  );
}
