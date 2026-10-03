import { Building2 } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import type { VetClinicRef } from "@/api/staffTypes";
import { Chip, Txt } from "@/components/ui";
import { useSession } from "@/state/session";
import { useColors } from "@/theme";

/** สลับคลินิก (หมอสังกัดหลายที่) — แทน ClinicSwitcher + cookie vet_clinic ของเว็บ */
export function VetClinicSwitcher({ clinics, selected }: { clinics: VetClinicRef[]; selected: VetClinicRef | null }) {
  const c = useColors();
  const setVetClinic = useSession((s) => s.setVetClinic);
  if (clinics.length === 0) {
    return (
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Building2 size={16} color={c.textFaint} />
        <Txt size={13.5} tone="muted">
          ยังไม่ได้ผูกคลินิก
        </Txt>
      </View>
    );
  }
  if (clinics.length === 1) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {clinics.map((k) => (
        <Chip
          key={k.clinic_id}
          label={k.clinic_name}
          icon={Building2}
          selected={selected?.clinic_id === k.clinic_id}
          onPress={() => setVetClinic(k.clinic_id)}
        />
      ))}
    </ScrollView>
  );
}
