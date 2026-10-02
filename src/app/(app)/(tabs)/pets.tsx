import { router } from "expo-router";
import { PawPrint, Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { PetCard } from "@/components/PetCard";
import { TopActions } from "@/components/TopActions";
import { AppBar, Button, Chip, EmptyState, ErrorView, IconButton, LoadingView, Screen } from "@/components/ui";
import { usePets } from "@/features/queries";
import { derivePetStatus } from "@/shared/petStatus";

/** subtitle ใต้ชื่อแท็บ — เหมือน petsTabSubtitle ของเว็บ */
function subtitle(total: number, care: number) {
  if (!total) return null;
  return care ? `${total} ตัว · ต้องดูแล ${care} ตัว` : `${total} ตัว · สุขภาพดีทุกตัว`;
}

export default function PetsTab() {
  const { data, isLoading, error, refetch, isRefetching } = usePets();
  const [tab, setTab] = useState<"all" | "care">("all");
  const pets = useMemo(() => data ?? [], [data]);
  const careIds = useMemo(
    () => new Set(pets.filter((p) => ["overdue", "due"].includes(derivePetStatus(p).kind)).map((p) => p.id)),
    [pets]
  );
  const shown = tab === "care" ? pets.filter((p) => careIds.has(p.id)) : pets;

  return (
    <Screen
      inTabs
      header={
        <AppBar
          title="สัตว์เลี้ยงของฉัน"
          subtitle={subtitle(pets.length, careIds.size)}
          right={
            <>
              <IconButton icon={Plus} label="เพิ่มสัตว์เลี้ยง" onPress={() => router.push("/pets/new")} />
              <TopActions />
            </>
          }
        />
      }
      refreshing={isRefetching}
      onRefresh={refetch}
    >
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={(error as Error).message} onRetry={refetch} />
      ) : pets.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="ยังไม่มีสัตว์เลี้ยง"
          body="เพิ่มน้องเพื่อเก็บประวัติวัคซีน น้ำหนัก และจองคิวคลินิกได้เร็วขึ้น"
          action={<Button label="เพิ่มสัตว์เลี้ยง" icon={Plus} full onPress={() => router.push("/pets/new")} />}
        />
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Chip label={`ทั้งหมด ${pets.length}`} selected={tab === "all"} onPress={() => setTab("all")} />
            <Chip label={`ต้องดูแล ${careIds.size}`} selected={tab === "care"} onPress={() => setTab("care")} />
          </View>
          {shown.length === 0 ? (
            <EmptyState title="ทุกตัวสุขภาพดี" body="ไม่มีวัคซีนที่ใกล้ครบกำหนดหรือเลยกำหนด" />
          ) : (
            shown.map((p) => <PetCard key={p.id} pet={p} />)
          )}
          <Button label="เพิ่มสัตว์เลี้ยง" icon={Plus} variant="soft" full onPress={() => router.push("/pets/new")} />
        </>
      )}
    </Screen>
  );
}
