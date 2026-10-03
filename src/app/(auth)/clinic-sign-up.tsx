import * as Location from "expo-location";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Cross,
  LocateFixed,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WEB_BASE_URL } from "@/api/config";
import { ApiError } from "@/api/client";
import { authApi, geoApi, type AuthResult } from "@/api/endpoints";
import type { ClinicSignupPayload } from "@/api/staffTypes";
import { Button, Card, Checkbox, Chip, Field, Notice, Screen, SectionTitle, Toggle, Txt } from "@/components/ui";
import { formatThaiPhone, phoneDigits, PHONE_PLACEHOLDER, thaiPhoneError } from "@/shared/phone";
import { SPECIES_LABEL, type PetSpecies } from "@/shared/species";
import { useSession } from "@/state/session";
import { gutter, useColors } from "@/theme";

/*
 * ลงทะเบียนคลินิก — ขั้นตอน/กติกาเดียวกับ MobileClinicSignupView ของเว็บ (validate() + buildPayload())
 * ส่งไป /api/mobile/auth/signup/clinic → signUpClinicOwner() ตัวเดียวกับเว็บ, คลินิกเริ่มเป็น pending
 * ต่างจากเว็บ: ไม่มีแผนที่ลากหมุด (Android ยังไม่มี Maps key) — ปักพิกัดจาก GPS หรือจากที่อยู่แทน และบังคับต้องปัก
 */

const CLINIC_TYPES: { id: ClinicSignupPayload["clinic"]["clinic_type"]; label: string; desc: string; Icon: LucideIcon }[] = [
  { id: "clinic", label: "คลินิก", desc: "คลินิกรักษาสัตว์ทั่วไป", Icon: Cross },
  { id: "hospital", label: "โรงพยาบาลสัตว์", desc: "รับเคสซับซ้อน 24 ชม.", Icon: Building2 },
  { id: "special", label: "เฉพาะทาง", desc: "ผิวหนัง · ฟัน · Exotic", Icon: ShieldCheck },
];
const SPECIES: PetSpecies[] = ["dog", "cat", "rabbit", "bird", "reptile", "exotic"];
/** ชื่อบริการภาษาไทยตรงกับเว็บ — server เดา review timing จากชื่อ */
const SERVICES = ["ฉีดวัคซีน", "ตรวจสุขภาพ", "ทำหมัน", "ผ่าตัด", "ขูดหินปูน/ฟัน", "X-ray / Lab", "ตัดขน-อาบน้ำ", "ฉุกเฉิน 24ชม."];
const DAY_NAMES = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const STEPS = ["บัญชี", "คลินิก", "ที่ตั้ง", "บริการ", "ทีม"];

interface Vet {
  name: string;
  license: string;
  exp: string;
}
interface Form {
  email: string;
  password: string;
  confirmPassword: string;
  adminName: string;
  adminPhone: string;
  clinicName: string;
  clinicType: ClinicSignupPayload["clinic"]["clinic_type"];
  license: string;
  desc: string;
  address: string;
  province: string;
  district: string;
  subDistrict: string;
  zip: string;
  pin: { lat: number; lng: number } | null;
  clinicPhone: string;
  line: string;
  species: PetSpecies[];
  otherSpecies: string;
  services: string[];
  hours: { open: string; close: string; closed: boolean }[];
  vets: Vet[];
  terms: boolean;
}

const DEFAULTS: Form = {
  email: "",
  password: "",
  confirmPassword: "",
  adminName: "",
  adminPhone: "",
  clinicName: "",
  clinicType: "clinic",
  license: "",
  desc: "",
  address: "",
  province: "",
  district: "",
  subDistrict: "",
  zip: "",
  pin: null,
  clinicPhone: "",
  line: "",
  species: ["dog", "cat"],
  otherSpecies: "",
  services: ["ฉีดวัคซีน", "ตรวจสุขภาพ"],
  hours: DAY_NAMES.map(() => ({ open: "09:00", close: "18:00", closed: false })),
  vets: [{ name: "", license: "", exp: "" }],
  terms: false,
};

type SetForm = <K extends keyof Form>(k: K, v: Form[K]) => void;
/** เติมเฉพาะช่องที่ยังว่าง ณ ตอนที่ผลกลับมา — ไม่ทับสิ่งที่ผู้ใช้พิมพ์ระหว่างรอ */
type FillEmpty = (patch: Partial<Pick<Form, "address" | "province" | "district" | "subDistrict" | "zip">>) => void;

/** validate() ของเว็บ + ข้อที่แอปบังคับเพิ่ม (หมุด, เวลาเปิดปิด) */
function validate(s: number, d: Form): string | null {
  if (s === 0) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) return "รูปแบบอีเมลไม่ถูกต้อง";
    if (d.password.length < 8) return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    if (d.password !== d.confirmPassword) return "รหัสผ่านยืนยันไม่ตรงกัน";
    if (d.adminName.trim().length < 2) return "กรุณากรอกชื่อผู้ดูแล";
    return thaiPhoneError(d.adminPhone, { required: true, label: "เบอร์ติดต่อ" });
  }
  if (s === 1) {
    if (d.clinicName.trim().length < 2) return "กรุณากรอกชื่อคลินิก";
    if (d.license.trim().length < 2) return "กรุณากรอกเลขใบประกอบกิจการ";
    if (d.desc.trim().length < 30) return "คำอธิบายคลินิกต้องอย่างน้อย 30 ตัวอักษร";
  }
  if (s === 2) {
    if (!d.pin) return "ปักหมุดตำแหน่งคลินิกก่อน — กด “ใช้ตำแหน่งปัจจุบัน” หรือ “หาพิกัดจากที่อยู่”";
    if (d.address.trim().length < 5) return "กรุณากรอกที่อยู่";
    if (!d.province.trim()) return "กรุณากรอกจังหวัด";
    if (!d.district.trim()) return "กรุณากรอกเขต/อำเภอ";
    return thaiPhoneError(d.clinicPhone, { label: "เบอร์โทรคลินิก" });
  }
  if (s === 3) {
    if (!d.species.length && !d.otherSpecies.trim()) return "เลือกประเภทสัตว์ที่รับอย่างน้อย 1 ชนิด";
    if (!d.services.length) return "เลือกบริการอย่างน้อย 1 รายการ";
    if (d.hours.every((h) => h.closed)) return "เปิดทำการอย่างน้อย 1 วัน";
    const bad = d.hours.findIndex((h) => !h.closed && (!HHMM.test(h.open) || !HHMM.test(h.close) || h.open >= h.close));
    if (bad >= 0) return `เวลาเปิด-ปิดวัน${DAY_NAMES[bad]}ไม่ถูกต้อง (HH:MM และเวลาเปิดต้องก่อนเวลาปิด)`;
  }
  if (s === 4) {
    if (!d.vets.some((v) => v.name.trim().length >= 2)) return "กรุณากรอกชื่อสัตวแพทย์อย่างน้อย 1 คน";
    if (!d.terms) return "ต้องยอมรับข้อกำหนดสำหรับพาร์ทเนอร์คลินิก";
  }
  return null;
}

/** buildPayload() ของเว็บ (บริการยังไม่ใส่ราคา — ตั้งได้ที่ จัดการ → บริการและราคา) */
function buildPayload(d: Form): ClinicSignupPayload {
  return {
    account: { email: d.email.trim().toLowerCase(), password: d.password, full_name: d.adminName.trim(), phone: phoneDigits(d.adminPhone) },
    clinic: {
      name: d.clinicName.trim(),
      clinic_type: d.clinicType,
      description: d.desc.trim(),
      license_number: d.license.trim(),
      phone: phoneDigits(d.clinicPhone) || null,
      email: null,
      line_id: d.line.trim() || null,
      website: null,
      facebook_url: null,
    },
    address: {
      address_line: d.address.trim(),
      sub_district: d.subDistrict.trim() || null,
      district: d.district.trim(),
      province: d.province.trim(),
      postal_code: d.zip.trim() || null,
      lat: d.pin!.lat,
      lng: d.pin!.lng,
    },
    species: [...d.species.map((s) => ({ species: s })), ...(d.otherSpecies.trim() ? [{ species: "other", other: d.otherSpecies.trim() }] : [])],
    hours: d.hours.map((h, i) => ({ day_of_week: i, is_closed: h.closed, open_time: h.closed ? null : h.open, close_time: h.closed ? null : h.close })),
    services: d.services.map((name) => ({ service_name: name, description: null, price_min: null, price_max: null, species: [] })),
    vets: d.vets
      .filter((v) => v.name.trim())
      .map((v) => ({ full_name: v.name.trim(), license_number: v.license.trim() || null, years_of_experience: v.exp ? Number(v.exp) : null, specialties: [] })),
    consent_terms: true,
  };
}

export default function ClinicSignUp() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Form>(DEFAULTS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<AuthResult | null>(null);
  const set: SetForm = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const fillEmpty: FillEmpty = (patch) =>
    setData((d) => {
      const next = { ...d };
      for (const [k, v] of Object.entries(patch) as [keyof typeof patch, string][]) if (v && !d[k].trim()) next[k] = v;
      return next;
    });
  const last = step === STEPS.length - 1;

  function back() {
    setError(null);
    if (step > 0) setStep(step - 1);
    else if (router.canGoBack()) router.back();
    else router.replace("/join");
  }

  async function next() {
    const err = validate(step, data);
    setError(err);
    if (err) return;
    if (!last) return setStep(step + 1);
    setBusy(true);
    try {
      setDone(await authApi.signupClinic(buildPayload(data)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "ส่งคำขอไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <Success clinicName={data.clinicName.trim()} result={done} />;

  return (
    <Screen
      key={step}
      header={<Progress step={step} onBack={back} />}
      footer={
        <View style={{ flexDirection: "row", gap: 10 }}>
          {step > 0 && <Button label="กลับ" icon={ArrowLeft} variant="outline" size="lg" onPress={back} disabled={busy} />}
          <View style={{ flex: 1 }}>
            <Button label={last ? "ส่งคำขอลงทะเบียน" : "ถัดไป"} icon={last ? Check : ArrowRight} size="lg" full loading={busy} onPress={next} testID="next" />
          </View>
        </View>
      }
    >
      {step === 0 && <AccountStep d={data} set={set} />}
      {step === 1 && <ClinicStep d={data} set={set} />}
      {step === 2 && <LocationStep d={data} set={set} fillEmpty={fillEmpty} />}
      {step === 3 && <ServicesStep d={data} set={set} />}
      {step === 4 && <TeamStep d={data} set={set} />}
      {error && <Notice tone="danger">{error}</Notice>}
      {step === 0 && (
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
          <Txt tone="muted">มีบัญชีคลินิกแล้ว?</Txt>
          <Txt tone="brand" weight="semibold" onPress={() => router.replace("/sign-in")}>
            เข้าสู่ระบบ
          </Txt>
        </View>
      )}
    </Screen>
  );
}

function Progress({ step, onBack }: { step: number; onBack: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 6, paddingBottom: 10, paddingHorizontal: gutter - 6, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable onPress={onBack} hitSlop={8} accessibilityLabel="ย้อนกลับ" style={{ padding: 8 }}>
          <ArrowLeft size={22} color={c.text} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: "row", gap: 5 }}>
          {STEPS.map((s, i) => (
            <View key={s} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= step ? c.brandSolid : c.border }} />
          ))}
        </View>
        <Txt size={13} weight="semibold" tone="muted" style={{ paddingHorizontal: 6 }}>
          {step + 1}/{STEPS.length}
        </Txt>
      </View>
      <Txt size={12.5} weight="medium" tone="brand" style={{ marginLeft: 48 }}>
        ลงทะเบียนคลินิก · {STEPS[step]}
      </Txt>
    </View>
  );
}

function Intro({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Txt size={23} weight="bold">
        {title}
      </Txt>
      <Txt tone="muted">{sub}</Txt>
    </View>
  );
}

function AccountStep({ d, set }: { d: Form; set: SetForm }) {
  return (
    <>
      <Intro title="เปิดบัญชีคลินิก" sub="บัญชีนี้ใช้เข้าจัดการคลินิก ทั้งในแอปและบนเว็บ" />
      <Field label="อีเมล" required value={d.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="clinic@example.com" />
      <Field label="รหัสผ่าน" required value={d.password} onChangeText={(v) => set("password", v)} secure hint="อย่างน้อย 8 ตัวอักษร" autoComplete="new-password" />
      <Field label="ยืนยันรหัสผ่าน" required value={d.confirmPassword} onChangeText={(v) => set("confirmPassword", v)} secure autoComplete="new-password" />
      <Field label="ชื่อผู้ดูแล" required value={d.adminName} onChangeText={(v) => set("adminName", v)} placeholder="ชื่อ - นามสกุล" autoComplete="name" />
      <Field label="เบอร์ติดต่อ" required value={formatThaiPhone(d.adminPhone)} onChangeText={(v) => set("adminPhone", v)} keyboardType="phone-pad" placeholder={PHONE_PLACEHOLDER} />
    </>
  );
}

function ClinicStep({ d, set }: { d: Form; set: SetForm }) {
  const c = useColors();
  return (
    <>
      <Intro title="บอกเราเกี่ยวกับคลินิก" sub="ข้อมูลนี้แสดงในหน้าคลินิกที่เจ้าของสัตว์ค้นเจอ" />
      <Field label="ชื่อคลินิก" required value={d.clinicName} onChangeText={(v) => set("clinicName", v)} placeholder="เช่น คลินิกรักษ์น้องหมา" />
      <SectionTitle>ประเภทสถานพยาบาล</SectionTitle>
      {CLINIC_TYPES.map(({ id, label, desc, Icon }) => {
        const on = d.clinicType === id;
        return (
          <Card
            key={id}
            onPress={() => set("clinicType", id)}
            style={{ flexDirection: "row", alignItems: "center", gap: 12, borderWidth: on ? 2 : 1, borderColor: on ? c.brand : c.border, padding: 14 }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: on ? c.brandSolid : c.surfaceAlt, alignItems: "center", justifyContent: "center" }}>
              <Icon size={21} color={on ? "#fff" : c.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="semibold">{label}</Txt>
              <Txt size={12.5} tone="muted">
                {desc}
              </Txt>
            </View>
            {on && <CheckCircle2 size={22} color={c.brand} />}
          </Card>
        );
      })}
      <Field label="เลขใบประกอบกิจการ" required value={d.license} onChangeText={(v) => set("license", v)} hint="ทีมงานใช้ตรวจสอบกับกรมปศุสัตว์" />
      <Field
        label="คำอธิบายคลินิก"
        required
        value={d.desc}
        onChangeText={(v) => set("desc", v)}
        multiline
        maxLength={1000}
        placeholder="จุดเด่น บริการ ทีมสัตวแพทย์ …"
        hint={`${d.desc.trim().length}/30 ตัวอักษรขึ้นไป`}
      />
    </>
  );
}

function LocationStep({ d, set, fillEmpty }: { d: Form; set: SetForm; fillEmpty: FillEmpty }) {
  const c = useColors();
  const [locating, setLocating] = useState<"gps" | "address" | null>(null);
  const [note, setNote] = useState<string | null>(null);

  /** วางหมุดแล้วเติมจังหวัด/อำเภอ/ตำบล/ไปรษณีย์จาก /api/geo/reverse — ช่องที่กรอกเองแล้วไม่ทับ */
  async function pinAt(lat: number, lng: number) {
    set("pin", { lat, lng });
    try {
      const r = await geoApi.reverse(lat, lng);
      fillEmpty({ province: r.province, district: r.district, subDistrict: r.sub_district, zip: r.postal_code, address: r.address_line });
      setNote("ปักหมุดแล้ว — ตรวจที่อยู่ด้านล่างอีกครั้ง");
    } catch {
      setNote("ปักหมุดแล้ว — กรอกที่อยู่ด้านล่างเองได้เลย");
    }
  }

  async function fromGps() {
    setLocating("gps");
    setNote(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return setNote("ต้องอนุญาตตำแหน่งก่อน หรือใช้ “หาพิกัดจากที่อยู่” แทน");
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await pinAt(pos.coords.latitude, pos.coords.longitude);
    } catch {
      setNote("หาตำแหน่งไม่ได้ ลองอีกครั้งหรือใช้ “หาพิกัดจากที่อยู่”");
    } finally {
      setLocating(null);
    }
  }

  async function fromAddress() {
    const q = [d.address, d.subDistrict, d.district, d.province, d.zip].map((x) => x.trim()).filter(Boolean).join(" ");
    if (!d.address.trim() || !d.province.trim()) return setNote("กรอกที่อยู่และจังหวัดก่อน แล้วค่อยหาพิกัด");
    setLocating("address");
    setNote(null);
    try {
      const [hit] = await Location.geocodeAsync(`${q} ประเทศไทย`);
      if (!hit) return setNote("หาพิกัดจากที่อยู่นี้ไม่เจอ ลองใส่ชื่อถนน/ตำบลให้ละเอียดขึ้น หรือใช้ตำแหน่งปัจจุบันตอนอยู่ที่คลินิก");
      await pinAt(hit.latitude, hit.longitude);
    } catch {
      setNote("หาพิกัดจากที่อยู่ไม่ได้บนเครื่องนี้ — ใช้ตำแหน่งปัจจุบันตอนอยู่ที่คลินิกแทน");
    } finally {
      setLocating(null);
    }
  }

  return (
    <>
      <Intro title="คลินิกอยู่ที่ไหน" sub="ใช้แสดงบนแผนที่และค้นหาคลินิกใกล้ฉัน" />
      <Card style={{ gap: 10, borderWidth: d.pin ? 2 : 1, borderColor: d.pin ? c.brand : c.border }}>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <MapPin size={20} color={d.pin ? c.brand : c.textFaint} />
          <View style={{ flex: 1 }}>
            <Txt weight="semibold">{d.pin ? "ปักหมุดแล้ว" : "ปักหมุดตำแหน่งคลินิก"}</Txt>
            <Txt size={12.5} tone="muted">
              {d.pin ? `${d.pin.lat.toFixed(5)}, ${d.pin.lng.toFixed(5)}` : "ถ้าตอนนี้อยู่ที่คลินิก กดใช้ตำแหน่งปัจจุบันได้เลย"}
            </Txt>
          </View>
          {d.pin && (
            <Txt
              size={13}
              weight="semibold"
              tone="brand"
              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${d.pin!.lat},${d.pin!.lng}`)}
            >
              ดูแผนที่
            </Txt>
          )}
        </View>
        <Button label="ใช้ตำแหน่งปัจจุบัน" icon={LocateFixed} variant={d.pin ? "outline" : "primary"} full loading={locating === "gps"} onPress={fromGps} testID="use-gps" />
        <Button label="หาพิกัดจากที่อยู่ที่กรอก" icon={Search} variant="ghost" full loading={locating === "address"} onPress={fromAddress} />
        {note && (
          <Txt size={12.5} tone="muted">
            {note}
          </Txt>
        )}
      </Card>
      <Field label="ที่อยู่" required value={d.address} onChangeText={(v) => set("address", v)} multiline placeholder="บ้านเลขที่ ถนน ซอย" />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="จังหวัด" required value={d.province} onChangeText={(v) => set("province", v)} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="เขต / อำเภอ" required value={d.district} onChangeText={(v) => set("district", v)} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="แขวง / ตำบล" value={d.subDistrict} onChangeText={(v) => set("subDistrict", v)} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="รหัสไปรษณีย์" value={d.zip} onChangeText={(v) => set("zip", v.replace(/\D/g, "").slice(0, 5))} keyboardType="number-pad" />
        </View>
      </View>
      <Field label="เบอร์โทรคลินิก" value={formatThaiPhone(d.clinicPhone)} onChangeText={(v) => set("clinicPhone", v)} keyboardType="phone-pad" placeholder="02-xxx-xxxx หรือ 08x-xxx-xxxx" hint="ไม่บังคับ" />
      <Field label="LINE Official" value={d.line} onChangeText={(v) => set("line", v)} autoCapitalize="none" placeholder="@yourclinic" hint="ไม่บังคับ" />
    </>
  );
}

function ServicesStep({ d, set }: { d: Form; set: SetForm }) {
  const c = useColors();
  const [custom, setCustom] = useState("");
  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const addCustom = () => {
    const name = custom.trim();
    if (name && !d.services.includes(name)) set("services", [...d.services, name]);
    setCustom("");
  };
  const setHour = (i: number, patch: Partial<Form["hours"][number]>) => set("hours", d.hours.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));

  return (
    <>
      <Intro title="บริการและเวลาเปิด" sub="เลือกแบบคร่าว ๆ ก่อน ปรับเพิ่มและใส่ราคาได้ทีหลังที่ จัดการ → บริการและราคา" />
      <SectionTitle>ประเภทสัตว์ที่รับ</SectionTitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {SPECIES.map((s) => (
          <Chip key={s} label={SPECIES_LABEL[s]} selected={d.species.includes(s)} onPress={() => set("species", toggle(d.species, s))} />
        ))}
      </View>
      <Field label="ชนิดอื่น ๆ" value={d.otherSpecies} onChangeText={(v) => set("otherSpecies", v)} placeholder="เช่น ชูการ์ไกลเดอร์" hint="ไม่บังคับ" />

      <SectionTitle>บริการ</SectionTitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[...SERVICES, ...d.services.filter((s) => !SERVICES.includes(s))].map((s) => (
          <Chip key={s} label={s} selected={d.services.includes(s)} onPress={() => set("services", toggle(d.services, s))} />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
        <View style={{ flex: 1 }}>
          <Field label="เพิ่มบริการอื่น" value={custom} onChangeText={setCustom} placeholder="ชื่อบริการ" onSubmitEditing={addCustom} returnKeyType="done" />
        </View>
        <Button label="เพิ่ม" icon={Plus} variant="outline" onPress={addCustom} disabled={!custom.trim()} />
      </View>

      <SectionTitle>เวลาเปิดทำการ</SectionTitle>
      <Card padded={false}>
        {DAY_ORDER.map((i, row) => {
          const h = d.hours[i];
          return (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: row ? 1 : 0, borderTopColor: c.border }}>
              <Toggle value={!h.closed} onChange={(v) => setHour(i, { closed: !v })} label={DAY_NAMES[i]} />
              <Txt weight="medium" style={{ width: 66 }} tone={h.closed ? "faint" : "default"}>
                {DAY_NAMES[i]}
              </Txt>
              {h.closed ? (
                <Txt tone="faint" style={{ flex: 1 }}>
                  ปิด
                </Txt>
              ) : (
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ flex: 1 }}>
                    <Field value={h.open} onChangeText={(v) => setHour(i, { open: v })} keyboardType="numbers-and-punctuation" maxLength={5} />
                  </View>
                  <Txt tone="muted">–</Txt>
                  <View style={{ flex: 1 }}>
                    <Field value={h.close} onChangeText={(v) => setHour(i, { close: v })} keyboardType="numbers-and-punctuation" maxLength={5} />
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </Card>
      <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
        <Clock size={14} color={c.textFaint} />
        <Txt size={12.5} tone="faint">
          เวลาแบบ 24 ชม. เช่น 09:00 – 18:00
        </Txt>
      </View>
    </>
  );
}

function TeamStep({ d, set }: { d: Form; set: SetForm }) {
  const c = useColors();
  const setVet = (i: number, patch: Partial<Vet>) => set("vets", d.vets.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const iAmVet = () => {
    const i = d.vets.findIndex((v) => !v.name.trim());
    if (i >= 0) setVet(i, { name: d.adminName.trim() });
    else set("vets", [...d.vets, { name: d.adminName.trim(), license: "", exp: "" }]);
  };
  return (
    <>
      <Intro title="ทีมสัตวแพทย์" sub="ใส่ชื่อสัตวแพทย์ที่ประจำคลินิกอย่างน้อย 1 คน" />
      {d.adminName.trim().length >= 2 && !d.vets.some((v) => v.name.trim() === d.adminName.trim()) && (
        <Chip label={`ฉันเป็นสัตวแพทย์เอง (${d.adminName.trim()})`} icon={Stethoscope} onPress={iAmVet} />
      )}
      {d.vets.map((v, i) => (
        <Card key={i} style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Txt weight="semibold" style={{ flex: 1 }}>
              สัตวแพทย์คนที่ {i + 1}
            </Txt>
            {d.vets.length > 1 && (
              <Pressable hitSlop={8} accessibilityLabel="ลบ" onPress={() => set("vets", d.vets.filter((_, idx) => idx !== i))}>
                <X size={18} color={c.textFaint} />
              </Pressable>
            )}
          </View>
          <Field label="ชื่อ-นามสกุล" required value={v.name} onChangeText={(x) => setVet(i, { name: x })} placeholder="เช่น น.สพ. สมหมาย ใจดี" />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 3 }}>
              <Field label="เลขใบประกอบ ว.ส." value={v.license} onChangeText={(x) => setVet(i, { license: x })} hint="ไม่บังคับ" />
            </View>
            <View style={{ flex: 2 }}>
              <Field label="ประสบการณ์ (ปี)" value={v.exp} onChangeText={(x) => setVet(i, { exp: x.replace(/\D/g, "").slice(0, 2) })} keyboardType="number-pad" />
            </View>
          </View>
        </Card>
      ))}
      <Button label="เพิ่มสัตวแพทย์" icon={Plus} variant="ghost" full onPress={() => set("vets", [...d.vets, { name: "", license: "", exp: "" }])} />
      <Notice tone="info" icon={Stethoscope}>
        {"มีสัตวแพทย์คนเดียว → บัญชีคลินิกนี้เริ่มตรวจและจบเคสได้เลย · หมอที่จะใช้แอปด้วยบัญชีของตัวเอง เพิ่มได้หลังอนุมัติที่ จัดการ → สัตวแพทย์"}
      </Notice>
      <Card style={{ gap: 6, borderColor: d.terms ? c.brand : c.border }}>
        <Checkbox checked={d.terms} onChange={(v) => set("terms", v)}>
          <Txt size={14}>
            ฉันยอมรับ{" "}
            <Txt size={14} tone="brand" onPress={() => WebBrowser.openBrowserAsync(`${WEB_BASE_URL}/terms`)}>
              ข้อกำหนดสำหรับพาร์ทเนอร์คลินิก
            </Txt>{" "}
            และ{" "}
            <Txt size={14} tone="brand" onPress={() => WebBrowser.openBrowserAsync(`${WEB_BASE_URL}/privacy`)}>
              นโยบายความเป็นส่วนตัว
            </Txt>
          </Txt>
        </Checkbox>
      </Card>
      <Txt size={12.5} tone="muted">
        หลังส่งคำขอ ทีมงานจะตรวจสอบใบอนุญาตก่อนเปิดหน้าคลินิกให้เจ้าของสัตว์เห็น ระหว่างนี้เข้าสู่ระบบได้และจะเห็นสถานะรออนุมัติ
      </Txt>
    </>
  );
}

function Success({ clinicName, result }: { clinicName: string; result: AuthResult }) {
  const c = useColors();
  const signIn = useSession((s) => s.signIn);
  const [busy, setBusy] = useState(false);
  const rows: { label: string; state: "done" | "wait" | "next" }[] = [
    { label: "ส่งข้อมูลคลินิก", state: "done" },
    { label: "ทีมงานตรวจสอบใบอนุญาต", state: "wait" },
    { label: "เปิดหน้าคลินิกให้เจ้าของสัตว์จองคิว", state: "next" },
  ];
  return (
    <Screen
      contentStyle={{ paddingTop: 48 }}
      footer={
        <Button
          label="เข้าสู่บัญชีคลินิก"
          size="lg"
          full
          loading={busy}
          onPress={async () => {
            setBusy(true);
            await signIn(result);
          }}
        />
      }
    >
      <View style={{ alignItems: "center", gap: 10 }}>
        <CheckCircle2 size={68} color={c.brand} />
        <Txt size={22} weight="bold" align="center">
          ส่งคำขอลงทะเบียนแล้ว
        </Txt>
        <Txt tone="muted" align="center">
          {clinicName} — เราจะแจ้งเตือนเมื่อคลินิกได้รับอนุมัติ
        </Txt>
      </View>
      <Card padded={false}>
        {rows.map((r, i) => (
          <View key={r.label} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: r.state === "done" ? c.brandSolid : r.state === "wait" ? c.warnSoft : c.surfaceAlt,
              }}
            >
              {r.state === "done" ? <Check size={15} color="#fff" /> : r.state === "wait" ? <Clock size={14} color={c.warnText} /> : null}
            </View>
            <Txt weight={r.state === "next" ? "regular" : "semibold"} tone={r.state === "next" ? "muted" : "default"}>
              {r.label}
            </Txt>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
