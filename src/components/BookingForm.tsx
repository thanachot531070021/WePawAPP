import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { router } from "expo-router";
import { AlertTriangle, CheckCircle2, LocateFixed, Phone, Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { appointmentApi } from "@/api/endpoints";
import type { BookingData } from "@/api/types";
import {
  AppBar,
  Button,
  CalendarPicker,
  Card,
  Chip,
  EmptyState,
  ErrorView,
  Field,
  LoadingView,
  Notice,
  PetAvatar,
  Screen,
  SectionTitle,
  toast,
  Txt,
} from "@/components/ui";
import { useBookingData, useClinic } from "@/features/queries";
import { addDays, bkkDateKey, formatDateLong, formatPrice } from "@/lib/format";
import { registerPush } from "@/lib/push";
import { PERIOD_LABEL } from "@/shared/apptTone";
import { formatThaiPhone, phoneDigits } from "@/shared/phone";
import { radius, useColors } from "@/theme";

const PICKUP = [
  { id: "clinic_notifies", label: "คลินิกโทรแจ้งเมื่อเสร็จ", note: "มารับได้เลยหลังได้รับสาย" },
  { id: "same_day", label: "รับกลับวันเดียวกัน", note: "ต้องเสร็จก่อนคลินิกปิด" },
  { id: "overnight", label: "ค้างคืนที่คลินิก", note: "มารับวันถัดไป · มีค่าดูแลรายคืน" },
] as const;

const UNREACH = [
  { id: "clinic_decides", label: "ให้คลินิกตัดสินใจตามความเหมาะสม" },
  { id: "wait", label: "รอจนกว่าจะติดต่อได้" },
] as const;

/** เลือกได้ภายใน 60 วัน — คลินิกจัดเวลาให้ภายหลัง (flow 038: requested → accepted → มาถึง) */
const MAX_DAYS_AHEAD = 60;

function Option({ selected, title, note, onPress }: { selected: boolean; title: string; note?: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: radius.md,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? c.brandSolid : c.borderStrong,
        backgroundColor: selected ? c.brandSoft : c.surface,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ? c.brandSolid : c.borderStrong,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.brandSolid }} />}
      </View>
      <View style={{ flex: 1 }}>
        <Txt weight="medium">{title}</Txt>
        {note && (
          <Txt size={12.5} tone="muted">
            {note}
          </Txt>
        )}
      </View>
    </Pressable>
  );
}

/**
 * ฟอร์มจองคิว — ใช้ทั้ง "มาที่คลินิก" และ "หมอเยี่ยมบ้าน"
 * ข้อมูลจาก /api/clinic/[id]/booking-data ตัวเดียวกับ BookingDialog ของเว็บ
 * ส่งผ่าน requestBooking() / requestHomeVisit() ของเว็บ (ตรวจกติกาที่ server)
 */
export function BookingForm({ slug, mode }: { slug: string; mode: "clinic" | "home" }) {
  const clinic = useClinic(slug);
  const data = useBookingData(clinic.data?.clinic.id);
  const title = mode === "home" ? "ขอหมอเยี่ยมบ้าน" : "ส่งคำขอจองคิว";

  if (clinic.isLoading || data.isLoading) {
    return (
      <Screen header={<AppBar title={title} back />} scroll={false}>
        <LoadingView />
      </Screen>
    );
  }
  if (clinic.error || data.error || !data.data) {
    return (
      <Screen header={<AppBar title={title} back />}>
        <ErrorView message={((clinic.error ?? data.error) as Error)?.message ?? "โหลดข้อมูลไม่สำเร็จ"} onRetry={data.refetch} />
      </Screen>
    );
  }
  return <BookingFormInner data={data.data} mode={mode} title={title} />;
}

function BookingFormInner({ data, mode, title }: { data: BookingData; mode: "clinic" | "home"; title: string }) {
  const c = useColors();
  const qc = useQueryClient();
  const isHome = mode === "home";
  const services = isHome ? data.services.filter((s) => s.home_visit_available) : data.services;

  const [petId, setPetId] = useState<string | null>(data.pets.length === 1 ? data.pets[0].id : null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [periods, setPeriods] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [pickup, setPickup] = useState<(typeof PICKUP)[number]["id"]>("clinic_notifies");
  const [pickupAfter, setPickupAfter] = useState("");
  const [contactPhone, setContactPhone] = useState(data.ownerPhone ?? "");
  const [ceiling, setCeiling] = useState("");
  const [unreach, setUnreach] = useState<(typeof UNREACH)[number]["id"]>("clinic_decides");
  const [address, setAddress] = useState("");
  const [addressNote, setAddressNote] = useState("");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const isDropoff = !isHome && !!service?.requires_dropoff;
  const pickupOptions = useMemo(() => {
    const allowed = service?.dropoff_pickup_options;
    return allowed?.length ? PICKUP.filter((p) => allowed.includes(p.id)) : PICKUP;
  }, [service]);

  // บริการบางตัวรับกลับได้ไม่ครบทุกแบบ — ตัวที่เลือกไว้ไม่อยู่ในรายการก็ใช้ตัวแรกแทน
  const effectivePickup = pickupOptions.some((p) => p.id === pickup) ? pickup : pickupOptions[0].id;

  const today = bkkDateKey();
  const firstError = !petId
    ? "เลือกสัตว์เลี้ยง"
    : !service
      ? "เลือกบริการ"
      : !date
        ? "เลือกวันที่สะดวก"
        : periods.length === 0
          ? "เลือกช่วงเวลาที่สะดวกอย่างน้อย 1 ช่วง"
          : isHome && address.trim().length < 5
            ? "กรอกที่อยู่ให้หมอไปถึง"
            : isHome && !data.ownerPhone
              ? "เพิ่มเบอร์โทรในโปรไฟล์ก่อนขอหมอเยี่ยมบ้าน"
              : null;

  const submit = useMutation({
    mutationFn: async () => {
      if (isHome) {
        return appointmentApi.homeVisit({
          clinic_id: data.clinic.id,
          pet_id: petId!,
          service_id: service!.id,
          service_label: service!.service_name,
          preferred_date: date!,
          preferred_periods: periods,
          service_address: address.trim(),
          service_address_note: addressNote.trim() || null,
          service_lat: pin?.lat ?? null,
          service_lng: pin?.lng ?? null,
          notes_owner: notes.trim() || null,
        });
      }
      return appointmentApi.request({
        clinic_id: data.clinic.id,
        pet_id: petId!,
        service_id: service!.id,
        service_label: service!.service_name,
        preferred_date: date!,
        preferred_periods: periods,
        notes_owner: notes.trim() || null,
        dropoff: isDropoff
          ? {
              pickup_pref: effectivePickup,
              pickup_after: /^([01]?\d|2[0-3]):[0-5]\d$/.test(pickupAfter) ? pickupAfter.padStart(5, "0") : null,
              contact_phone: phoneDigits(contactPhone) || null,
              spend_ceiling: ceiling.trim() ? Number(ceiling.replace(/[^\d]/g, "")) : null,
              unreachable_action: unreach,
            }
          : null,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
      void qc.invalidateQueries({ queryKey: ["pets"] });
      setDone(true);
      // ขอสิทธิ์แจ้งเตือนตอนผู้ใช้เห็นประโยชน์ชัด ๆ — คลินิกรับคำขอแล้วจะได้รู้ทันที
      void registerPush(true);
    },
    onError: (e: Error) => setError(e.message),
  });

  async function useMyLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      toast.error("ต้องอนุญาตตำแหน่งก่อน");
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    try {
      const [geo] = await Location.reverseGeocodeAsync(pos.coords);
      if (geo && !address.trim()) {
        setAddress([geo.name, geo.street, geo.subregion ?? geo.district, geo.city ?? geo.region, geo.postalCode].filter(Boolean).join(" "));
      }
    } catch {
      // ไม่ได้ชื่อที่อยู่ก็ยังมีพิกัด
    }
    toast.success("ปักหมุดตำแหน่งปัจจุบันแล้ว");
  }

  if (done) {
    return (
      <Screen header={<AppBar title={title} back />} contentStyle={{ paddingTop: 40 }}>
        <Card style={{ alignItems: "center", gap: 10, paddingVertical: 32 }}>
          <CheckCircle2 size={64} color={c.brand} />
          <Txt size={20} weight="bold" align="center">
            ส่งคำขอแล้ว
          </Txt>
          <Txt tone="muted" align="center">
            {isHome
              ? `${data.clinic.name} จะยืนยันช่วงเวลาที่หมอไปถึงบ้าน แล้วเราจะแจ้งเตือนคุณ`
              : `${data.clinic.name} จะรับคำขอแล้วแจ้งให้คุณพาน้องไปได้เลย`}
          </Txt>
          <Txt size={14} weight="medium" align="center">
            {formatDateLong(date!)} · {periods.map((p) => PERIOD_LABEL[p]).join(", ")}
          </Txt>
          <Button label="ดูนัดของฉัน" full style={{ marginTop: 12 }} onPress={() => router.navigate("/appointments")} />
          <Button label="กลับหน้าคลินิก" variant="ghost" full onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }

  if (data.pets.length === 0) {
    return (
      <Screen header={<AppBar title={title} back />}>
        <EmptyState
          title="เพิ่มสัตว์เลี้ยงก่อนจองคิว"
          body="คลินิกต้องรู้ว่าจะดูแลน้องตัวไหน"
          action={<Button label="เพิ่มสัตว์เลี้ยง" icon={Plus} full onPress={() => router.push("/pets/new")} />}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={<AppBar title={title} subtitle={data.clinic.name} back />}
      footer={
        <View style={{ gap: 8 }}>
          {attempted && firstError && (
            <Txt size={13} tone="danger" align="center">
              {firstError}
            </Txt>
          )}
          <Button
            label="ส่งคำขอ"
            size="lg"
            full
            loading={submit.isPending}
            onPress={() => {
              setAttempted(true);
              setError(null);
              if (!firstError) submit.mutate();
            }}
            testID="submit-booking"
          />
        </View>
      }
    >
      <Notice tone="info">
        {isHome
          ? "หมอเยี่ยมบ้านไม่ใช่บริการฉุกเฉิน — ถ้าน้องมีอาการหนัก โปรดพาไปคลินิกหรือโทรหาคลินิกทันที"
          : "เลือกวันและช่วงเวลาที่สะดวก คลินิกจะรับคำขอแล้วจัดคิวให้เมื่อน้องมาถึง"}
      </Notice>
      {error && (
        <Notice tone="danger" icon={AlertTriangle}>
          {error}
        </Notice>
      )}

      <SectionTitle>น้องตัวไหน</SectionTitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {data.pets.map((p) => {
          const sel = p.id === petId;
          return (
            <Pressable
              key={p.id}
              onPress={() => setPetId(p.id)}
              style={{
                alignItems: "center",
                gap: 6,
                padding: 10,
                width: 92,
                borderRadius: radius.lg,
                borderWidth: sel ? 2 : 1,
                borderColor: sel ? c.brandSolid : c.borderStrong,
                backgroundColor: sel ? c.brandSoft : c.surface,
              }}
            >
              <PetAvatar species={p.species} seed={p.id} size={48} />
              <Txt size={13.5} weight={sel ? "semibold" : "regular"} numberOfLines={1}>
                {p.name}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>บริการ</SectionTitle>
      {services.length === 0 ? (
        <Notice tone="warn">คลินิกยังไม่เปิดบริการให้จองทางนี้</Notice>
      ) : (
        <View style={{ gap: 8 }}>
          {services.map((s) => (
            <Option
              key={s.id}
              selected={s.id === serviceId}
              title={s.service_name}
              note={[formatPrice(s.price_min, s.price_max), s.requires_dropoff && !isHome ? "ฝากน้องไว้ที่คลินิก" : null]
                .filter(Boolean)
                .join(" · ")}
              onPress={() => setServiceId(s.id)}
            />
          ))}
        </View>
      )}

      <SectionTitle>วันที่สะดวก</SectionTitle>
      <Card>
        <CalendarPicker
          value={date}
          onChange={setDate}
          min={today}
          max={addDays(today, MAX_DAYS_AHEAD)}
          closedDays={isHome ? [] : data.closedDays}
          closedDates={data.closedDates}
        />
      </Card>

      <SectionTitle>ช่วงเวลาที่สะดวก</SectionTitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {data.periodWindows.map((w) => (
          <Chip
            key={w.key}
            label={`${PERIOD_LABEL[w.key]} ${w.start}–${w.end}`}
            selected={periods.includes(w.key)}
            onPress={() =>
              setPeriods((p) => (p.includes(w.key) ? p.filter((x) => x !== w.key) : [...p.filter((x) => x !== "any"), w.key]))
            }
          />
        ))}
        <Chip label="สะดวกได้ทั้งวัน" selected={periods.includes("any")} onPress={() => setPeriods((p) => (p.includes("any") ? [] : ["any"]))} />
      </View>
      {data.clinicHoursLabel && (
        <Txt size={12.5} tone="faint">
          วันนี้คลินิกเปิด {data.clinicHoursLabel}
        </Txt>
      )}

      {isHome && (
        <>
          <SectionTitle>ที่อยู่ให้หมอไปถึง</SectionTitle>
          {!data.ownerPhone && (
            <Notice tone="warn" icon={Phone}>
              ต้องมีเบอร์โทรในโปรไฟล์ก่อน — ไปที่ แท็บฉัน › แก้ไขโปรไฟล์
            </Notice>
          )}
          <Field label="ที่อยู่" required value={address} onChangeText={setAddress} multiline placeholder="บ้านเลขที่ ซอย ถนน แขวง เขต" />
          <Field label="จุดสังเกต / วิธีเข้าถึง" value={addressNote} onChangeText={setAddressNote} placeholder="เช่น ตึกสีฟ้า มีที่จอดรถหน้าบ้าน" />
          <Button
            label={pin ? `ปักหมุดแล้ว (${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)})` : "ใช้ตำแหน่งปัจจุบัน"}
            icon={LocateFixed}
            variant={pin ? "soft" : "outline"}
            onPress={useMyLocation}
          />
          {(data.homeVisit.baseFee || data.homeVisit.travelFee) && (
            <Card style={{ gap: 4 }}>
              {data.homeVisit.baseFee && <Txt size={14}>ค่าบริการถึงบ้าน ฿{Number(data.homeVisit.baseFee).toLocaleString("th-TH")}</Txt>}
              {data.homeVisit.travelFee && <Txt size={14}>ค่าเดินทาง ฿{Number(data.homeVisit.travelFee).toLocaleString("th-TH")}</Txt>}
              {data.homeVisit.note && (
                <Txt size={13} tone="muted">
                  {data.homeVisit.note}
                </Txt>
              )}
            </Card>
          )}
        </>
      )}

      {isDropoff && (
        <>
          <SectionTitle>ฝากน้องไว้ — รับกลับอย่างไร</SectionTitle>
          <View style={{ gap: 8 }}>
            {pickupOptions.map((p) => (
              <Option key={p.id} selected={effectivePickup === p.id} title={p.label} note={p.note} onPress={() => setPickup(p.id)} />
            ))}
          </View>
          {effectivePickup === "same_day" && (
            <Field label="รับได้หลังเวลา (HH:MM)" value={pickupAfter} onChangeText={setPickupAfter} placeholder="17:00" keyboardType="numbers-and-punctuation" />
          )}
          <Field label="เบอร์ติดต่อระหว่างฝาก" value={formatThaiPhone(contactPhone)} onChangeText={setContactPhone} keyboardType="phone-pad" />
          <Field
            label="ค่าใช้จ่ายเพิ่มที่ไม่ต้องโทรถามก่อน (บาท)"
            value={ceiling}
            onChangeText={setCeiling}
            keyboardType="number-pad"
            hint="เว้นว่าง = ให้คลินิกโทรถามทุกครั้งก่อนมีค่าใช้จ่ายเพิ่ม"
          />
          <Txt size={13.5} weight="medium" tone="muted">
            ถ้าคลินิกติดต่อคุณไม่ได้
          </Txt>
          <View style={{ gap: 8 }}>
            {UNREACH.map((u) => (
              <Option key={u.id} selected={unreach === u.id} title={u.label} onPress={() => setUnreach(u.id)} />
            ))}
          </View>
        </>
      )}

      <Field label="อาการ / ข้อความถึงคลินิก" value={notes} onChangeText={setNotes} multiline maxLength={500} placeholder="เช่น ไอมา 2 วัน กินอาหารน้อยลง" />
    </Screen>
  );
}
