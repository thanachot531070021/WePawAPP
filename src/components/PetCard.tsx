import { router } from "expo-router";
import { CalendarClock, Check, ChevronRight, Syringe, Users } from "lucide-react-native";
import { View } from "react-native";
import type { PetRow } from "@/api/types";
import { Card, PetAvatar, Pill, Txt } from "@/components/ui";
import { formatDateShort, formatTime } from "@/lib/format";
import { formatPetAge } from "@/shared/petAge";
import { derivePetStatus, type PetStatus } from "@/shared/petStatus";
import { getSpeciesLabel } from "@/shared/species";
import { radius, useColors } from "@/theme";

/** โทนแถบสถานะ: due = amber, overdue = rose, ok = brand (คู่กับ MobilePetList ของเว็บ) */
export function usePetStatusTone(status: PetStatus) {
  const c = useColors();
  switch (status.kind) {
    case "overdue":
      return { bg: c.dangerSoft, fg: c.danger, Icon: Syringe };
    case "due":
      return { bg: c.warnSoft, fg: c.warnText, Icon: Syringe };
    case "ok":
      return { bg: c.brandSoft, fg: c.brandSoftText, Icon: Check };
    default:
      return { bg: c.surfaceAlt, fg: c.textMuted, Icon: Syringe };
  }
}

const ROLE_LABEL: Record<string, string> = { co_owner: "ดูแลร่วม", viewer: "ดูอย่างเดียว" };

export function PetCard({ pet }: { pet: PetRow }) {
  const c = useColors();
  const status = derivePetStatus(pet);
  const tone = usePetStatusTone(status);
  const sub = [getSpeciesLabel(pet.species), pet.breed, pet.birth_date ? formatPetAge(pet.birth_date) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card padded={false} onPress={() => router.push(`/pets/${pet.id}`)}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14 }}>
        <PetAvatar species={pet.species} seed={pet.id} url={pet.avatar_url} size={60} radius={18} />
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Txt size={17} weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
              {pet.name}
            </Txt>
            {pet.my_role !== "owner" && (
              <Pill label={ROLE_LABEL[pet.my_role] ?? pet.my_role} color={c.info} bg={c.infoSoft} icon={Users} />
            )}
          </View>
          <Txt size={13} tone="muted" numberOfLines={1}>
            {sub}
          </Txt>
          {pet.upcoming_appointment_at && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <CalendarClock size={13} color={c.brand} />
              <Txt size={12.5} tone="brand" numberOfLines={1}>
                {`นัด ${formatDateShort(pet.upcoming_appointment_at, false)} ${formatTime(pet.upcoming_appointment_at)} · ${pet.upcoming_clinic_name ?? ""}`}
              </Txt>
            </View>
          )}
        </View>
        <ChevronRight size={20} color={c.textFaint} />
      </View>
      {status.kind !== "none" && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 9,
            backgroundColor: tone.bg,
            borderBottomLeftRadius: radius.lg,
            borderBottomRightRadius: radius.lg,
          }}
        >
          <tone.Icon size={14} color={tone.fg} />
          <Txt size={13} weight="medium" color={tone.fg} style={{ flex: 1 }} numberOfLines={1}>
            {status.text}
          </Txt>
          {status.kind === "overdue" && (
            <Txt size={11.5} color={tone.fg}>
              {status.note}
            </Txt>
          )}
        </View>
      )}
    </Card>
  );
}
