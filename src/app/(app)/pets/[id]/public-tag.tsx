import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { AlertTriangle, ExternalLink, MessageCircleHeart, Phone, RefreshCw, Save, Share2 } from "lucide-react-native";
import { useState } from "react";
import { Linking, Share, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { ApiError } from "@/api/client";
import { petApi } from "@/api/endpoints";
import type { PetDetail, PetPublicTag, PetPublicTagSettings } from "@/api/types";
import {
  AppBar,
  Button,
  Card,
  confirmAsync,
  ErrorView,
  Field,
  LoadingView,
  Notice,
  Screen,
  SectionTitle,
  toast,
  Toggle,
  Txt,
} from "@/components/ui";
import { usePet } from "@/features/queries";
import { formatThaiPhone as formatPhone } from "@/shared/phone";
import { qk } from "@/lib/queryClient";
import { radius, useColors } from "@/theme";

/**
 * QR ประจำตัวน้อง (petcare migration 048) — PetPublicTagCard ของเว็บ
 * คนทั่วไปสแกน → หน้า /t/<token> (ข้อมูลพื้นฐาน + ติดต่อเจ้าของ) · คลินิก/POS สแกน → เปิดแฟ้มน้อง
 */
export default function PublicTagScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = usePet(id);
  if (isLoading) return <LoadingView />;
  if (error || !data?.public_tag)
    return (
      <Screen header={<AppBar title="QR ประจำตัวน้อง" back />}>
        <ErrorView message={(error as Error)?.message ?? "ยังใช้ QR สาธารณะไม่ได้"} onRetry={refetch} />
      </Screen>
    );
  return <PublicTagForm id={id} data={data} tag={data.public_tag} />;
}

function pick(t: PetPublicTagSettings): PetPublicTagSettings {
  return {
    is_enabled: t.is_enabled,
    show_owner_name: t.show_owner_name,
    show_phone: t.show_phone,
    contact_note: t.contact_note || null,
    is_lost: t.is_lost,
    lost_message: t.lost_message || null,
  };
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });

function PublicTagForm({ id, data, tag: initial }: { id: string; data: PetDetail; tag: PetPublicTag }) {
  const c = useColors();
  const qc = useQueryClient();
  const [tag, setTag] = useState(initial);
  const [form, setForm] = useState(() => pick(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isOwner = data.access_role === "owner";
  const name = data.pet.name;
  const dirty = JSON.stringify(pick(form)) !== JSON.stringify(pick(tag));

  const save = useMutation({
    mutationFn: (body: PetPublicTagSettings) => petApi.updatePublicTag(id, body),
    onSuccess: (r) => {
      setTag((t) => ({ ...t, ...r.data }));
      setForm(pick(r.data));
      setErrors({});
      void qc.invalidateQueries({ queryKey: qk.pets });
      toast.success("บันทึกแล้ว");
    },
    onError: (e, body) => {
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
      // สวิตช์ย้อนกลับเป็นค่าที่บันทึกอยู่จริง (ข้อความที่พิมพ์ค้างไว้ยังอยู่)
      setForm({ ...body, is_enabled: tag.is_enabled, show_owner_name: tag.show_owner_name, show_phone: tag.show_phone, is_lost: tag.is_lost });
      toast.error(e.message);
    },
  });

  const regen = useMutation({
    mutationFn: () => petApi.regeneratePublicTag(id),
    onSuccess: (r) => {
      // url ประกอบที่ server — โหลดหน้าน้องใหม่ให้ได้ลิงก์ล่าสุด
      setTag((t) => ({ ...t, ...r.data }));
      void qc.invalidateQueries({ queryKey: qk.pets });
      void refetchUrl();
      toast.success("สร้าง QR ใหม่แล้ว");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function refetchUrl() {
    const fresh = await petApi.detail(id).catch(() => null);
    if (fresh?.public_tag) setTag(fresh.public_tag);
  }

  const set = <K extends keyof PetPublicTagSettings>(k: K, v: PetPublicTagSettings[K]) => setForm((f) => ({ ...f, [k]: v }));
  /** สวิตช์บันทึกทันที — เดิมต้องกดบันทึกอีกที ปิดเบอร์แล้วลืมกด หน้าสาธารณะยังโชว์เบอร์ */
  const toggle = (k: "is_enabled" | "show_owner_name" | "show_phone", v: boolean) => {
    const next = { ...form, [k]: v };
    setForm(next);
    save.mutate(next);
  };

  return (
    <Screen
      header={<AppBar title={`QR ประจำตัว${name}`} back />}
      footer={
        isOwner ? (
          <Button
            label={save.isPending ? "กำลังบันทึก…" : "บันทึกการตั้งค่า"}
            icon={Save}
            size="lg"
            full
            loading={save.isPending}
            disabled={!dirty}
            onPress={() => save.mutate(form)}
          />
        ) : undefined
      }
    >
      <Card>
        <View style={{ alignItems: "center", gap: 10 }}>
          {tag.is_lost && (
            <View style={{ backgroundColor: c.danger, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Txt size={12.5} weight="bold" color="#fff">
                แจ้งน้องหายอยู่
              </Txt>
            </View>
          )}
          <View
            style={{
              padding: 14,
              backgroundColor: "#fff",
              borderRadius: radius.lg,
              borderWidth: tag.is_lost ? 2 : 1,
              borderColor: tag.is_lost ? c.danger : c.border,
            }}
          >
            <QRCode value={tag.url} size={196} />
          </View>
          <Txt size={13.5} tone="muted" align="center">
            คนทั่วไปสแกนด้วยกล้องมือถือ → เห็นหน้า{name}และติดต่อคุณ{"\n"}คลินิก/POS สแกน → เปิดแฟ้ม{name}
          </Txt>
          <Txt size={12} tone="faint">
            สแกนแล้ว {tag.scan_count.toLocaleString("th-TH")} ครั้ง
            {tag.last_scanned_at ? ` · ล่าสุด ${fmtTime(tag.last_scanned_at)}` : ""}
          </Txt>
          <View style={{ flexDirection: "row", gap: 8, alignSelf: "stretch" }}>
            <Button label="ดูหน้าสาธารณะ" icon={ExternalLink} variant="outline" style={{ flex: 1 }} onPress={() => Linking.openURL(tag.url)} />
            <Button
              label="แชร์ลิงก์"
              icon={Share2}
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => Share.share({ message: `${name} · ${tag.url}`, url: tag.url })}
            />
          </View>
        </View>
      </Card>

      {isOwner && (
        <>
          <Card style={form.is_lost ? { borderWidth: 1, borderColor: c.danger } : undefined}>
            <Row
              title={`แจ้งว่า${name}หาย`}
              desc="หน้าสาธารณะขึ้นป้าย “น้องหาย” ให้คนที่เจอติดต่อคุณ — กดแล้วบันทึกทันที"
              icon={<AlertTriangle size={16} color={c.danger} />}
              value={form.is_lost}
              onChange={(v) => {
                const next = { ...form, is_lost: v, ...(v ? { is_enabled: true } : {}) };
                setForm(next);
                save.mutate(next);
              }}
            />
            {form.is_lost && (
              <Field
                label="ข้อความตามหาน้อง"
                value={form.lost_message ?? ""}
                onChangeText={(t) => set("lost_message", t)}
                multiline
                maxLength={500}
                placeholder="เช่น หายแถวซอยสุขุมวิท 55 เมื่อเย็นวันที่ 20 · น้องกลัวคน"
                error={errors.lost_message}
              />
            )}
          </Card>

          <SectionTitle>ข้อมูลที่คนสแกนเห็น</SectionTitle>
          <Card>
            <Row
              title="แสดงข้อมูลน้อง"
              desc="รูป ชื่อ ชนิด พันธุ์ สี จุดสังเกต — ไม่แสดงประวัติการรักษา"
              value={form.is_enabled}
              disabled={form.is_lost || save.isPending}
              onChange={(v) => toggle("is_enabled", v)}
            />
            <Row title="แสดงชื่อเจ้าของ (ชื่อต้นเท่านั้น)" value={form.show_owner_name} disabled={!form.is_enabled} onChange={(v) => toggle("show_owner_name", v)} />
            <Row
              title="แสดงเบอร์โทรของฉัน"
              desc="ปิดไว้ คนที่เจอยังส่งข้อความถึงคุณได้ โดยไม่เห็นเบอร์"
              value={form.show_phone}
              disabled={!form.is_enabled}
              onChange={(v) => toggle("show_phone", v)}
              error={errors.show_phone}
            />
            <Field
              label="ช่องทางติดต่ออื่น (ไม่บังคับ)"
              value={form.contact_note ?? ""}
              onChangeText={(t) => set("contact_note", t)}
              multiline
              maxLength={300}
              editable={form.is_enabled}
              placeholder="เช่น LINE ID: somchai.pet"
            />
          </Card>

          {(data.found_reports?.length ?? 0) > 0 && (
            <>
              <SectionTitle>ข้อความจากคนที่สแกน QR</SectionTitle>
              {data.found_reports!.map((r) => (
                <Card key={r.id}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <MessageCircleHeart size={18} color={c.warn} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Txt size={14.5}>{r.message}</Txt>
                      <Txt size={12.5} tone="muted">
                        {r.finder_name || "ไม่ระบุชื่อ"} · {fmtTime(r.created_at)}
                      </Txt>
                      {r.finder_phone && (
                        <Button
                          label={`โทรกลับ ${formatPhone(r.finder_phone)}`}
                          icon={Phone}
                          variant="soft"
                          size="sm"
                          onPress={() => Linking.openURL(`tel:${r.finder_phone}`)}
                        />
                      )}
                    </View>
                  </View>
                </Card>
              ))}
            </>
          )}

          <Notice tone="info">พิมพ์ QR ติดป้ายห้อยคอ — ถ้าน้องหลง คนที่เจอสแกนแล้วแจ้งคุณได้ทันที (แจ้งเตือนเข้าแอป)</Notice>
          <Button
            label="สร้าง QR ใหม่"
            icon={RefreshCw}
            variant="ghost"
            loading={regen.isPending}
            onPress={async () => {
              if (await confirmAsync("สร้าง QR ใหม่?", "QR เดิมที่พิมพ์หรือแชร์ไปแล้วจะใช้ไม่ได้ทันที", "สร้างใหม่")) regen.mutate();
            }}
          />
        </>
      )}
    </Screen>
  );
}

function Row({
  title,
  desc,
  value,
  onChange,
  disabled,
  icon,
  error,
}: {
  title: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  error?: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, opacity: disabled ? 0.5 : 1, paddingVertical: 4 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {icon}
          <Txt size={14.5} weight="semibold">
            {title}
          </Txt>
        </View>
        {desc && (
          <Txt size={12.5} tone="muted">
            {desc}
          </Txt>
        )}
        {error && (
          <Txt size={12.5} tone="danger">
            {error}
          </Txt>
        )}
      </View>
      <Toggle value={value} onChange={(v) => !disabled && onChange(v)} label={title} />
    </View>
  );
}
