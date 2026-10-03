import { router } from "expo-router";
import { CalendarClock, Pencil } from "lucide-react-native";
import { View } from "react-native";
import { TopActions } from "@/components/TopActions";
import { StaffSettings } from "@/components/staff/StaffSettings";
import { AppBar, Avatar, Card, ListRow, Pill, Screen, SectionTitle, Txt } from "@/components/ui";
import { useVetHome, useVetProfile } from "@/features/staffQueries";
import { useColors } from "@/theme";

/** แท็บฉันของหมอ — = MobileVetProfile ของเว็บ (โปรไฟล์ · เวลาทำงาน · ตั้งค่า) */
export default function VetMe() {
  const c = useColors();
  const { data: p } = useVetProfile();
  const { data: home } = useVetHome();
  return (
    <Screen inTabs header={<AppBar title="โปรไฟล์ของฉัน" right={<TopActions />} />}>
      <Card style={{ flexDirection: "row", gap: 14, alignItems: "center", padding: 18 }} onPress={() => router.push("/vet/profile")}>
        <Avatar url={home?.vet?.avatar_url ?? p?.avatarUrl} name={p?.fullName} size={60} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={18} weight="bold" numberOfLines={1}>
            {p?.fullName ?? home?.vet?.full_name ?? ""}
          </Txt>
          <Txt size={13.5} tone="muted" numberOfLines={1}>
            {p?.email}
          </Txt>
          {p?.licenseNumber ? (
            <Pill
              label={`ใบประกอบ ${p.licenseNumber}${p.licenseVerified ? " ✓" : ""}`}
              color={p.licenseVerified ? c.brandSoftText : c.textMuted}
              bg={p.licenseVerified ? c.brandSoft : c.surfaceAlt}
            />
          ) : null}
        </View>
        <Pencil size={18} color={c.textFaint} />
      </Card>

      {home && home.clinics.length > 0 && (
        <>
          <SectionTitle>คลินิกที่สังกัด</SectionTitle>
          <Card padded={false}>
            {home.clinics.map((k, i) => (
              <ListRow key={k.clinic_id} label={k.clinic_name} value={k.is_primary ? "คลินิกหลัก" : null} last={i === home.clinics.length - 1} />
            ))}
          </Card>
        </>
      )}

      <SectionTitle>การทำงาน</SectionTitle>
      <Card padded={false}>
        <ListRow icon={CalendarClock} label="เวลาทำงาน & วันลา" onPress={() => router.push("/vet/availability")} />
        <ListRow icon={Pencil} label="แก้ไขโปรไฟล์" onPress={() => router.push("/vet/profile")} last />
      </Card>
      <StaffSettings />
    </Screen>
  );
}
