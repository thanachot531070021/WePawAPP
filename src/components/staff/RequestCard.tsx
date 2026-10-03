import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Clock, Home, Phone, Tag } from "lucide-react-native";
import { useState } from "react";
import { Linking, View } from "react-native";
import type { BookingRequest } from "@/api/staffTypes";
import { clinicStaffApi } from "@/api/staffEndpoints";
import { Button, Card, Chip, Field, Notice, PetAvatar, Sheet, toast, Txt } from "@/components/ui";
import { formatDateLong, timeAgo } from "@/lib/format";
import { PERIOD_LABEL, toneColors, toneOf } from "@/shared/apptTone";
import { radius, useColors } from "@/theme";

const PICKUP_LABEL: Record<string, string> = {
  clinic_notifies: "คลินิกโทรแจ้งเมื่อเสร็จ",
  same_day: "รับกลับวันเดียวกัน",
  overnight: "ค้างคืนที่คลินิก",
};

/**
 * การ์ดคำขอจอง — action ชุดเดียวกับ RequestList ของเว็บ
 * requested → รับ / ปฏิเสธ (เยี่ยมบ้าน: ยืนยันช่วงเวลา) · accepted → น้องมาถึงแล้ว (จัดเวลา) / ยกเลิก
 */
export function RequestCard({ req, vets }: { req: BookingRequest; vets: { id: string; full_name: string }[] }) {
  const c = useColors();
  const qc = useQueryClient();
  const tone = toneOf(req.status);
  const t = toneColors(tone, c.isDark);
  const [sheet, setSheet] = useState<null | "decline" | "cancel" | "home">(null);
  const [reason, setReason] = useState("");
  const [by, setBy] = useState<"owner" | "clinic">("owner");
  const [homeStart, setHomeStart] = useState("10:00");
  const [homeEnd, setHomeEnd] = useState("12:00");
  const [homeVet, setHomeVet] = useState<string | null>(vets.length === 1 ? vets[0].id : null);
  const [fee, setFee] = useState("");

  const done = (msg: string) => {
    toast.success(msg);
    setSheet(null);
    void qc.invalidateQueries({ queryKey: ["clinic"] });
  };
  const respond = useMutation({
    mutationFn: (body: Parameters<typeof clinicStaffApi.respond>[1]) => clinicStaffApi.respond(req.id, body),
    onError: (e: Error) => toast.error(e.message),
  });

  const periods = (req.preferred_periods ?? []).map((p) => PERIOD_LABEL[p] ?? p).join(", ");
  const when = req.preferred_date ? `${formatDateLong(req.preferred_date)}${periods ? ` · ${periods}` : ""}` : "ยังไม่ระบุวัน";
  const h = req.history;

  return (
    <Card style={{ gap: 10, borderLeftWidth: 5, borderLeftColor: tone.solid }}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <PetAvatar species={req.pet_species} seed={req.pet_id ?? req.pet_name} url={req.pet_avatar_url} size={46} />
        <View style={{ flex: 1 }}>
          <Txt weight="semibold" numberOfLines={1}>
            {req.pet_name ? `น้อง${req.pet_name}` : "ไม่ระบุสัตว์"} · {req.owner_name ?? "—"}
          </Txt>
          <Txt size={12.5} tone="faint">
            ขอเมื่อ {timeAgo(req.created_at)}
          </Txt>
        </View>
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: t.tint, borderWidth: 1, borderColor: t.edge }}>
          <Txt size={11.5} weight="semibold" color={t.ink} lineHeight={16}>
            {tone.label}
          </Txt>
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <Row icon={Clock} text={when} />
        {req.service_label && <Row icon={Tag} text={req.service_label} />}
        {req.is_home_visit && req.service_address && (
          <Row icon={Home} text={`${req.service_address}${req.service_address_note ? ` (${req.service_address_note})` : ""}`} />
        )}
      </View>
      {req.notes_owner && (
        <View style={{ padding: 10, borderRadius: radius.md, backgroundColor: c.surfaceAlt }}>
          <Txt size={13.5}>{req.notes_owner}</Txt>
        </View>
      )}
      {req.dropoff_pickup_pref && (
        <Txt size={13} tone="muted">
          ฝากไว้ · {PICKUP_LABEL[req.dropoff_pickup_pref] ?? req.dropoff_pickup_pref}
          {req.dropoff_spend_ceiling != null ? ` · ค่าใช้จ่ายเพิ่มไม่เกิน ฿${req.dropoff_spend_ceiling.toLocaleString("th-TH")}` : " · โทรถามก่อนทุกครั้ง"}
        </Txt>
      )}
      {h && h.kept + h.cancelled + h.noShow > 0 && (
        <Txt size={12.5} tone={h.noShow > 0 ? "warn" : "faint"}>
          ประวัติลูกค้า: มาตามนัด {h.kept} · ยกเลิกเอง {h.cancelled} · ไม่มา {h.noShow}
        </Txt>
      )}

      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {req.owner_phone && (
          <Button label="โทร" icon={Phone} variant="outline" size="sm" onPress={() => Linking.openURL(`tel:${req.owner_phone}`)} />
        )}
        {req.status === "requested" && !req.is_home_visit && (
          <Button
            label="รับคำขอ"
            size="sm"
            loading={respond.isPending}
            onPress={() => respond.mutate({ action: "accept" }, { onSuccess: () => done("รับคำขอแล้ว — แจ้งเจ้าของให้พาน้องมาได้เลย") })}
          />
        )}
        {req.status === "requested" && req.is_home_visit && (
          <Button label="ยืนยันช่วงเวลา" size="sm" onPress={() => setSheet("home")} />
        )}
        {req.status === "requested" && <Button label="ปฏิเสธ" variant="dangerOutline" size="sm" onPress={() => setSheet("decline")} />}
        {req.status === "accepted" && !req.is_home_visit && (
          <Button label="น้องมาถึงแล้ว" size="sm" onPress={() => router.push(`/clinic-admin/arrival/${req.id}`)} />
        )}
        {(req.status === "accepted" || req.status === "proposed") && (
          <Button label="ยกเลิก" variant="dangerOutline" size="sm" onPress={() => setSheet("cancel")} />
        )}
      </View>

      <Sheet
        open={sheet === "decline" || sheet === "cancel"}
        onClose={() => setSheet(null)}
        title={sheet === "decline" ? "ปฏิเสธคำขอ" : "ยกเลิกคำขอที่รับไว้"}
        footer={
          <Button
            label={sheet === "decline" ? "ปฏิเสธคำขอ" : "ยืนยันยกเลิก"}
            variant="danger"
            full
            loading={respond.isPending}
            onPress={() =>
              respond.mutate(
                sheet === "decline"
                  ? { action: req.is_home_visit ? "decline_home" : "decline", reason: reason.trim() || undefined }
                  : { action: "cancel", by, reason: reason.trim() || undefined },
                { onSuccess: () => done(sheet === "decline" ? "ปฏิเสธคำขอแล้ว" : "ยกเลิกแล้ว") }
              )
            }
          />
        }
      >
        {sheet === "cancel" && (
          <>
            <Txt size={13.5} tone="muted">
              ใครเป็นต้นเรื่องของการยกเลิก (นับเข้าประวัติความน่าเชื่อถือเฉพาะเมื่อเจ้าของยกเลิก)
            </Txt>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Chip label="ลูกค้าแจ้งว่ามาไม่ได้" selected={by === "owner"} onPress={() => setBy("owner")} />
              <Chip label="คลินิกรับไม่ได้" selected={by === "clinic"} onPress={() => setBy("clinic")} />
            </View>
          </>
        )}
        <Field label="เหตุผล (เจ้าของจะเห็น)" value={reason} onChangeText={setReason} multiline maxLength={300} placeholder="เช่น คิวเต็มวันนั้น หมอไม่ว่าง" />
      </Sheet>

      <Sheet
        open={sheet === "home"}
        onClose={() => setSheet(null)}
        title="ยืนยันช่วงเวลาหมอไปถึง"
        footer={
          <Button
            label="ยืนยัน"
            full
            loading={respond.isPending}
            onPress={() => {
              const date = req.preferred_date;
              if (!date || !/^\d{2}:\d{2}$/.test(homeStart) || !/^\d{2}:\d{2}$/.test(homeEnd)) {
                toast.error("กรอกเวลาเป็น HH:MM");
                return;
              }
              respond.mutate(
                {
                  action: "confirm_home",
                  window_start_iso: new Date(`${date}T${homeStart}:00+07:00`).toISOString(),
                  window_end_iso: new Date(`${date}T${homeEnd}:00+07:00`).toISOString(),
                  vet_id: homeVet,
                  final_fee: fee.trim() ? Number(fee) : null,
                },
                { onSuccess: () => done("ยืนยันนัดเยี่ยมบ้านแล้ว") }
              );
            }}
          />
        }
      >
        <Notice tone="info">{`วันที่ ${req.preferred_date ? formatDateLong(req.preferred_date) : "-"} · เจ้าของสะดวก ${periods || "-"}`}</Notice>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="ไปถึงตั้งแต่" value={homeStart} onChangeText={setHomeStart} placeholder="10:00" keyboardType="numbers-and-punctuation" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="ถึง" value={homeEnd} onChangeText={setHomeEnd} placeholder="12:00" keyboardType="numbers-and-punctuation" />
          </View>
        </View>
        <Txt size={13.5} weight="medium" tone="muted">
          สัตวแพทย์
        </Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {vets.map((v) => (
            <Chip key={v.id} label={v.full_name} selected={homeVet === v.id} onPress={() => setHomeVet(homeVet === v.id ? null : v.id)} />
          ))}
        </View>
        <Field label="ค่าบริการรวม (บาท)" value={fee} onChangeText={(x) => setFee(x.replace(/[^\d.]/g, ""))} keyboardType="decimal-pad" />
      </Sheet>
    </Card>
  );
}

function Row({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
      <Icon size={15} color={c.textMuted} style={{ marginTop: 3 }} />
      <Txt size={14} style={{ flex: 1 }}>
        {text}
      </Txt>
    </View>
  );
}
