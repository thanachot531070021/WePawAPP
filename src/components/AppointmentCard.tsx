import { router } from "expo-router";
import { Clock, MapPin, PawPrint, Stethoscope, Tag } from "lucide-react-native";
import { Pressable, View } from "react-native";
import type { AppointmentRow } from "@/api/types";
import { Txt } from "@/components/ui";
import { bkkDateKey, dayAndMonth, formatDateLong, formatTime } from "@/lib/format";
import { PERIOD_LABEL, REQUEST_STATUSES, toneColors, toneOf, type ApptTone } from "@/shared/apptTone";
import { radius, useColors } from "@/theme";

/** แถบคำอธิบายสี — บอกเฉพาะสิ่งที่ป้ายสถานะบอกไม่ได้ (ข้อความเดียวกับเว็บ) */
function requestHint(a: AppointmentRow): string {
  if (a.status === "proposed") return "คลินิกเสนอเวลานัดแล้ว — เลือกเวลาที่สะดวก";
  if (a.status === "accepted") {
    return a.is_home_visit
      ? "เราจะแจ้งเตือนเมื่อคลินิกยืนยันช่วงเวลาที่หมอไปถึง"
      : "พาน้องไปส่งที่คลินิกได้เลย — คลินิกจะจัดคิวและหมอให้เมื่อน้องมาถึง";
  }
  return a.is_home_visit ? "รอคลินิกยืนยันเวลาที่หมอไปถึงบ้าน" : "เราจะแจ้งเตือนเมื่อคลินิกรับคำขอของคุณ";
}

function StatusChip({ tone }: { tone: ApptTone }) {
  const c = useColors();
  const t = toneColors(tone, c.isDark);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.full,
        backgroundColor: t.tint,
        borderWidth: 1,
        borderColor: t.edge,
        borderStyle: tone.dash ? "dashed" : "solid",
        alignSelf: "flex-start",
      }}
    >
      <tone.Icon size={12} color={t.ink} strokeWidth={2.3} />
      <Txt size={11.5} weight="semibold" color={t.ink} lineHeight={16}>
        {tone.label}
      </Txt>
    </View>
  );
}

function Meta({ icon: Icon, children }: { icon: typeof Tag; children: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 1 }}>
      <Icon size={12} color={c.textFaint} />
      <Txt size={12.5} tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
        {children}
      </Txt>
    </View>
  );
}

/**
 * การ์ดนัด — แนวทาง A ของเว็บ: สีสถานะโผล่ 3 จุด (แถบซ้าย 6px → บล็อกวันที่ → ป้ายสถานะ)
 * คำขอที่ยังไม่มีเวลาแน่นอนใช้ preferred_date + ช่วงเวลา ไม่ใช่ scheduled_at
 */
export function AppointmentCard({ appt, past }: { appt: AppointmentRow; past?: boolean }) {
  const c = useColors();
  const tone = toneOf(appt.status);
  const t = toneColors(tone, c.isDark);
  const isRequest = REQUEST_STATUSES.includes(appt.status);
  const dateKey = isRequest && appt.preferred_date ? appt.preferred_date : bkkDateKey(appt.scheduled_at);
  const { day, month } = dayAndMonth(dateKey);
  const today = dateKey === bkkDateKey() && !past;
  const strike = appt.status === "cancelled" || appt.status === "no_show";

  const when = isRequest
    ? [formatDateLong(dateKey), (appt.preferred_periods ?? []).map((p) => PERIOD_LABEL[p] ?? p).join(", ")]
        .filter(Boolean)
        .join(" · ")
    : `${formatDateLong(dateKey)} · ${formatTime(appt.scheduled_at)} น.`;

  return (
    <Pressable
      onPress={() => router.push(`/appointments/${appt.id}`)}
      style={({ pressed }) => ({
        flexDirection: "row",
        borderRadius: radius.lg,
        overflow: "hidden",
        backgroundColor: past ? c.surfaceAlt : c.surface,
        borderWidth: today ? 2 : 1,
        borderColor: today ? tone.solid : c.border,
        opacity: pressed ? 0.92 : 1,
        shadowColor: c.shadow,
        shadowOpacity: past ? 0 : c.isDark ? 0.4 : 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: past ? 0 : 2,
      })}
    >
      <View style={{ width: 6, backgroundColor: tone.solid, opacity: tone.dash ? 0.55 : 1 }} />
      <View style={{ flex: 1, padding: 12, gap: 8 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View
            style={{
              width: 54,
              paddingVertical: 8,
              borderRadius: radius.md,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: t.tint2,
              borderWidth: 1,
              borderColor: t.edge,
              borderStyle: tone.dash ? "dashed" : "solid",
            }}
          >
            <Txt size={21} weight="bold" color={t.ink} lineHeight={24}>
              {day}
            </Txt>
            <Txt size={11} color={t.ink} lineHeight={14} style={{ opacity: 0.85 }}>
              {month}
            </Txt>
          </View>
          <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
              <Txt
                size={15}
                weight="semibold"
                numberOfLines={1}
                style={{ flex: 1, textDecorationLine: strike ? "line-through" : "none" }}
              >
                {appt.clinic_name}
              </Txt>
              <StatusChip tone={tone} />
            </View>
            <Meta icon={Clock}>{when}</Meta>
            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
              {appt.service_label && <Meta icon={Tag}>{appt.service_label}</Meta>}
              {appt.pet_name && <Meta icon={PawPrint}>{`น้อง${appt.pet_name}`}</Meta>}
              {appt.vet_name && <Meta icon={Stethoscope}>{appt.vet_name}</Meta>}
              {appt.is_home_visit && <Meta icon={MapPin}>นอกสถานที่</Meta>}
            </View>
          </View>
        </View>
        {isRequest && !past && (
          <View style={{ borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: t.tint }}>
            <Txt size={11.5} weight="medium" color={t.ink}>
              {requestHint(appt)}
            </Txt>
          </View>
        )}
        {past && appt.review_request_id && (
          <View style={{ borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: c.warnSoft }}>
            <Txt size={11.5} weight="medium" color={c.warnText}>
              ⭐ รีวิวการใช้บริการครั้งนี้ — แตะเพื่อเขียนรีวิว
            </Txt>
          </View>
        )}
      </View>
    </Pressable>
  );
}
