import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Clock, Home, MapPin, MessageCircle, PawPrint, Phone, Star, Stethoscope, Tag, XCircle } from "lucide-react-native";
import { useState } from "react";
import { Linking, View } from "react-native";
import { appointmentApi, chatApi } from "@/api/endpoints";
import {
  AppBar,
  Button,
  Card,
  confirmAsync,
  ErrorView,
  Field,
  LoadingView,
  PetAvatar,
  Screen,
  SectionTitle,
  Sheet,
  toast,
  Txt,
} from "@/components/ui";
import { useAppointment } from "@/features/queries";
import { formatDateLong, formatTime } from "@/lib/format";
import { PERIOD_LABEL, REQUEST_STATUSES, toneColors, toneOf } from "@/shared/apptTone";
import { formatThaiPhone } from "@/shared/phone";
import { radius, useColors } from "@/theme";

const PICKUP_LABEL: Record<string, string> = {
  clinic_notifies: "คลินิกโทรแจ้งเมื่อเสร็จ",
  same_day: "รับกลับวันเดียวกัน",
  overnight: "ค้างคืนที่คลินิก",
};

function Row({ icon: Icon, children }: { icon: typeof Clock; children: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <Icon size={17} color={c.textMuted} style={{ marginTop: 3 }} />
      <Txt size={14.5} style={{ flex: 1 }}>
        {children}
      </Txt>
    </View>
  );
}

export default function AppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useAppointment(id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  // เวลาตอนเปิดหน้า — ใช้ตัดสินว่ายังยกเลิกได้ไหม (กติกาจริงตรวจที่ server อีกชั้น)
  const [now] = useState(() => Date.now());

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["appointments"] });
    void qc.invalidateQueries({ queryKey: ["pets"] });
  };
  const cancel = useMutation({
    mutationFn: () => appointmentApi.cancel(id, reason.trim() || undefined),
    onSuccess: () => {
      setCancelOpen(false);
      toast.success("ยกเลิกนัดแล้ว คลินิกได้รับแจ้งแล้ว");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const accept = useMutation({
    mutationFn: (slotId: string) => appointmentApi.acceptSlot(id, slotId),
    onSuccess: () => {
      toast.success("ยืนยันเวลานัดแล้ว");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const decline = useMutation({
    mutationFn: () => appointmentApi.declineProposal(id),
    onSuccess: () => {
      toast.success("ปฏิเสธเวลาที่เสนอแล้ว");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const chat = useMutation({
    mutationFn: async () => {
      const a = data!.appointment;
      if (a.case_thread_id) return a.case_thread_id;
      const r = await chatApi.start(a.clinic_id, { petId: a.pet_id, subject: a.service_label });
      return r.thread.id;
    },
    onSuccess: (threadId) => router.push(`/chat/${threadId}`),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <LoadingView />;
  if (error || !data)
    return (
      <Screen header={<AppBar title="รายละเอียดนัด" back />}>
        <ErrorView message={(error as Error)?.message ?? "ไม่พบนัด"} onRetry={refetch} />
      </Screen>
    );

  const a = data.appointment;
  const tone = toneOf(a.status);
  const t = toneColors(tone, c.isDark);
  const isRequest = REQUEST_STATUSES.includes(a.status);
  const hasFixedTime = !isRequest;
  const canCancel =
    !["cancelled", "completed", "no_show", "in_progress"].includes(a.status) &&
    (!hasFixedTime || new Date(a.scheduled_at).getTime() > now + 3600_000);
  const when = isRequest
    ? `${a.preferred_date ? formatDateLong(a.preferred_date) : "ยังไม่ระบุวัน"} · ${(a.preferred_periods ?? []).map((p) => PERIOD_LABEL[p] ?? p).join(", ")}`
    : `${formatDateLong(a.scheduled_at)} · ${formatTime(a.scheduled_at)} น. (${a.duration_minutes} นาที)`;
  const pendingSlots = data.proposed_slots.filter((s) => !s.is_accepted);

  return (
    <Screen header={<AppBar title="รายละเอียดนัด" back />} onRefresh={refetch}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: radius.lg, backgroundColor: t.tint, borderWidth: 1, borderColor: t.edge }}>
        <tone.Icon size={22} color={t.ink} />
        <View style={{ flex: 1 }}>
          <Txt size={16} weight="bold" color={t.ink}>
            {tone.label}
          </Txt>
          {a.status === "cancelled" && a.cancel_reason && (
            <Txt size={13} color={t.ink}>
              เหตุผล: {a.cancel_reason}
            </Txt>
          )}
        </View>
      </View>

      <Card style={{ gap: 10 }}>
        <Txt size={17} weight="bold" onPress={() => router.push(`/clinic/${a.clinic_slug}`)}>
          {a.clinic_name}
        </Txt>
        <Row icon={Clock}>{when}</Row>
        {a.service_label && <Row icon={Tag}>{a.service_label}</Row>}
        {a.vet_name && <Row icon={Stethoscope}>{a.vet_name}</Row>}
        {a.is_home_visit && a.service_address && <Row icon={Home}>{`${a.service_address}${a.service_address_note ? ` (${a.service_address_note})` : ""}`}</Row>}
        {!a.is_home_visit && a.clinic_address && <Row icon={MapPin}>{a.clinic_address}</Row>}
        {a.notes_owner && (
          <View style={{ padding: 10, borderRadius: radius.md, backgroundColor: c.surfaceAlt }}>
            <Txt size={12.5} tone="muted">
              ข้อความถึงคลินิก
            </Txt>
            <Txt size={14}>{a.notes_owner}</Txt>
          </View>
        )}
      </Card>

      {a.pet_id && (
        <Card onPress={() => router.push(`/pets/${a.pet_id}`)} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <PetAvatar species={a.pet_species} seed={a.pet_id} url={a.pet_avatar_url} size={44} />
          <View style={{ flex: 1 }}>
            <Txt weight="semibold">น้อง{a.pet_name}</Txt>
            <Txt size={13} tone="muted">
              เปิดแฟ้มสุขภาพ
            </Txt>
          </View>
          <PawPrint size={18} color={c.textFaint} />
        </Card>
      )}

      {a.dropoff_pickup_pref && (
        <>
          <SectionTitle>ฝากน้องไว้ที่คลินิก</SectionTitle>
          <Card style={{ gap: 6 }}>
            <Txt size={14}>รับกลับ: {PICKUP_LABEL[a.dropoff_pickup_pref] ?? a.dropoff_pickup_pref}</Txt>
            {a.dropoff_pickup_after && <Txt size={14}>รับได้หลัง {a.dropoff_pickup_after} น.</Txt>}
            {a.dropoff_contact_phone && <Txt size={14}>เบอร์ติดต่อ {formatThaiPhone(a.dropoff_contact_phone)}</Txt>}
            <Txt size={14}>
              ค่าใช้จ่ายเพิ่ม: {a.dropoff_spend_ceiling != null ? `ไม่เกิน ฿${a.dropoff_spend_ceiling.toLocaleString("th-TH")} โดยไม่ต้องโทรถาม` : "โทรถามทุกครั้ง"}
            </Txt>
          </Card>
        </>
      )}

      {a.status === "proposed" && pendingSlots.length > 0 && (
        <>
          <SectionTitle>เวลาที่คลินิกเสนอ</SectionTitle>
          {pendingSlots.map((s) => (
            <Card key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Txt weight="semibold">{formatDateLong(s.scheduled_at)}</Txt>
                <Txt size={13} tone="muted">
                  {formatTime(s.scheduled_at)} น. · {s.duration_minutes} นาที{s.vet_name ? ` · ${s.vet_name}` : ""}
                </Txt>
              </View>
              <Button label="เลือกเวลานี้" size="sm" loading={accept.isPending} onPress={() => accept.mutate(s.id)} />
            </Card>
          ))}
          <Button
            label="ไม่สะดวกทุกเวลา"
            variant="ghost"
            loading={decline.isPending}
            onPress={async () => {
              if (await confirmAsync("ปฏิเสธเวลาที่เสนอ?", "คำขอจะถูกยกเลิก คุณส่งคำขอใหม่ได้ภายหลัง", "ปฏิเสธ")) decline.mutate();
            }}
          />
        </>
      )}

      <View style={{ gap: 10, marginTop: 4 }}>
        {a.review_request_id && (
          <Button label="รีวิวการใช้บริการครั้งนี้" icon={Star} full onPress={() => router.push(`/review-request/${a.review_request_id}`)} />
        )}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            label={a.case_thread_id ? "แชทเคสนี้" : "แชทกับคลินิก"}
            icon={MessageCircle}
            variant="outline"
            style={{ flex: 1 }}
            loading={chat.isPending}
            onPress={() => chat.mutate()}
          />
          {a.clinic_phone && (
            <Button label="โทร" icon={Phone} variant="outline" style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${a.clinic_phone}`)} />
          )}
        </View>
        {canCancel && <Button label="ยกเลิกนัด" icon={XCircle} variant="dangerOutline" full onPress={() => setCancelOpen(true)} />}
        {!canCancel && hasFixedTime && ["pending", "confirmed"].includes(a.status) && (
          <Txt size={12.5} tone="faint" align="center">
            ยกเลิกล่วงหน้าน้อยกว่า 1 ชั่วโมงไม่ได้ — กรุณาโทรหาคลินิก
          </Txt>
        )}
      </View>

      <Sheet
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="ยกเลิกนัด"
        footer={<Button label="ยืนยันยกเลิกนัด" variant="danger" full loading={cancel.isPending} onPress={() => cancel.mutate()} />}
      >
        <Txt tone="muted">คลินิกจะได้รับแจ้งทันที</Txt>
        <Field label="เหตุผล (ไม่บังคับ)" value={reason} onChangeText={setReason} multiline placeholder="เช่น ติดธุระ น้องหายดีแล้ว" />
      </Sheet>
    </Screen>
  );
}
