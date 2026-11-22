import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowRight, Building2, Check, CheckCircle2, Clock, Eye, EyeOff, ShieldAlert, ShieldCheck, UserRound } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { petAccessApi } from "@/api/endpoints";
import { absoluteUrl } from "@/api/config";
import { AppBar, Button, Card, EmptyState, ErrorView, LoadingView, PetAvatar, Screen, SectionTitle, toast, Txt } from "@/components/ui";
import { qk } from "@/lib/queryClient";
import { SPECIES_LABEL, type PetSpecies } from "@/shared/species";
import { radius, useColors } from "@/theme";

/**
 * คำขอจากคลินิก — = หน้า /pet-access/[token] ของเว็บ (เปิดจากแจ้งเตือน)
 * - pet: คลินิกสแกน QR ของน้อง → อนุญาต = เปิดแฟ้มน้องตัวนั้น
 * - owner: คลินิกค้นบัญชีด้วยเบอร์/อีเมลที่เคาน์เตอร์ → อนุญาต = เป็นลูกค้า + เลือกน้องที่ให้เปิดแฟ้ม
 * ไม่กด = ไม่มีอะไรเกิดขึ้น (คำขอหมดอายุใน 24 ชม.)
 */
export default function PetAccessScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const c = useColors();
  const qc = useQueryClient();
  const [picked, setPicked] = useState<string[]>([]);
  const q = useQuery({ queryKey: ["pet-access", token], queryFn: () => petAccessApi.get(token) });
  const approve = useMutation({
    mutationFn: (ids?: string[]) => petAccessApi.approve(token, ids),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["pet-access", token] });
      void qc.invalidateQueries({ queryKey: qk.pets });
      toast.success("อนุญาตแล้ว");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const header = <AppBar title="คำขอจากคลินิก" back />;
  if (q.isLoading) return <LoadingView />;
  if (q.error || !q.data)
    return (
      <Screen header={header}>
        <ErrorView message={(q.error as Error)?.message ?? "เปิดคำขอไม่ได้"} onRetry={q.refetch} />
      </Screen>
    );
  const v = q.data.data;
  if (v.status === "invalid")
    return (
      <Screen header={header}>
        <EmptyState
          icon={Clock}
          title="คำขอนี้หมดอายุหรือใช้ไม่ได้แล้ว"
          body="คำขอมีอายุ 24 ชั่วโมง ถ้าคุณอยู่ที่คลินิก ให้คลินิกส่งคำขออีกครั้ง"
        />
      </Screen>
    );
  if (v.status === "not_owner")
    return (
      <Screen header={header}>
        <EmptyState icon={ShieldAlert} title="บัญชีนี้ไม่ใช่เจ้าของน้อง" body="คำขอนี้ส่งถึงบัญชีอื่น" />
      </Screen>
    );

  const { clinic, pets, mode } = v;
  const pet = mode === "pet" ? pets[0] : null;
  const logo = absoluteUrl(clinic.logo_url);
  const expires = new Date(v.expiresAt).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });
  const linked = v.status === "linked";
  const speciesLabel = (s: string) => SPECIES_LABEL[s as PetSpecies] ?? s;
  const toggle = (id: string) => setPicked((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const approveLabel = pet
    ? `อนุญาตให้${clinic.name}เปิดแฟ้ม`
    : picked.length
      ? `อนุญาต + เปิดแฟ้ม ${picked.length} ตัว`
      : "อนุญาตเป็นลูกค้า (ไม่เปิดแฟ้มน้อง)";

  return (
    <Screen
      header={header}
      footer={
        linked ? (
          <Button
            label={pet ? `ไปหน้า${pet.name}` : "ไปหน้าน้องของฉัน"}
            size="lg"
            full
            variant="outline"
            onPress={() => router.replace(pet ? `/pets/${pet.id}` : "/pets")}
          />
        ) : (
          <Button
            label={approveLabel}
            icon={Check}
            size="lg"
            full
            loading={approve.isPending}
            onPress={() => approve.mutate(mode === "owner" ? picked : undefined)}
          />
        )
      }
    >
      <Card style={{ alignItems: "center", gap: 12, paddingVertical: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {pet ? (
            <PetAvatar species={pet.species} seed={pet.id} url={pet.avatar_url} size={68} radius={22} />
          ) : (
            <View style={[tile, { backgroundColor: c.surfaceAlt }]}>
              <UserRound size={30} color={c.textFaint} />
            </View>
          )}
          <ArrowRight size={20} color={c.textFaint} />
          <View style={[tile, { backgroundColor: c.brandSoft }]}>
            {logo ? (
              <Image source={{ uri: logo }} style={{ width: 68, height: 68 }} contentFit="cover" />
            ) : (
              <Building2 size={30} color={c.brand} />
            )}
          </View>
        </View>
        <Txt size={18} weight="bold" align="center">
          {pet ? `${clinic.name} ขอเปิดแฟ้มของ${pet.name}` : `${clinic.name} ขอเพิ่มคุณเป็นลูกค้า`}
        </Txt>
        <Txt size={13.5} tone="muted" align="center">
          {pet ? speciesLabel(pet.species) : "คลินิกค้นบัญชีของคุณด้วยเบอร์โทร/อีเมลที่หน้าเคาน์เตอร์"}
          {clinic.area ? ` · คลินิกอยู่ที่ ${clinic.area}` : ""}
        </Txt>
      </Card>

      {linked ? (
        <Card style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <CheckCircle2 size={20} color={c.brand} />
          <Txt size={14.5} style={{ flex: 1 }}>
            {pets.some((p) => p.linked)
              ? `อนุญาตแล้ว — ${clinic.name} เปิดแฟ้มของ${pets
                  .filter((p) => p.linked)
                  .map((p) => p.name)
                  .join(", ")}ได้`
              : `อนุญาตแล้ว — คุณเป็นลูกค้าของ${clinic.name} (ไม่ได้เปิดแฟ้มน้อง)`}
          </Txt>
        </Card>
      ) : (
        <>
          <Card style={{ gap: 12, borderRadius: radius.lg }}>
            <Point icon={<Eye size={16} color={c.brand} />}>
              {pet
                ? "คลินิกเห็นข้อมูลน้อง ชื่อ-เบอร์ของคุณ และประวัติที่คุณบันทึกเอง (น้ำหนัก วัคซีน)"
                : "คลินิกเห็นชื่อ-เบอร์ของคุณ และเฉพาะน้องที่คุณเลือกด้านล่าง"}
            </Point>
            <Point icon={<EyeOff size={16} color={c.textFaint} />}>ไม่เห็นประวัติรักษาจากคลินิกอื่น เว้นแต่คุณแชร์น้องให้เอง</Point>
            <Point icon={<ShieldCheck size={16} color={c.textFaint} />}>
              {pet ? "ถ้าคุณไม่ได้พาน้องไปคลินิกนี้" : "ถ้าคุณไม่ได้อยู่ที่คลินิกนี้"} ไม่ต้องกด — คำขอหมดอายุเอง ({expires})
            </Point>
          </Card>

          {mode === "owner" && pets.length > 0 && (
            <>
              <SectionTitle>น้องที่ให้คลินิกเปิดแฟ้ม (เลือกตัวที่พามาวันนี้)</SectionTitle>
              {pets.map((p) => {
                const on = p.linked || picked.includes(p.id);
                return (
                  <Pressable
                    key={p.id}
                    disabled={p.linked}
                    onPress={() => toggle(p.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on, disabled: p.linked }}
                  >
                    <Card
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        borderWidth: 1,
                        borderColor: on ? c.brand : c.border,
                        opacity: p.linked ? 0.7 : 1,
                      }}
                    >
                      <PetAvatar species={p.species} seed={p.id} url={p.avatar_url} size={42} radius={13} />
                      <View style={{ flex: 1 }}>
                        <Txt size={15} weight="semibold">
                          {p.name}
                        </Txt>
                        <Txt size={12.5} tone="muted">
                          {p.linked ? "เปิดแฟ้มกับคลินิกนี้แล้ว" : speciesLabel(p.species)}
                        </Txt>
                      </View>
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 7,
                          borderWidth: 2,
                          borderColor: on ? c.brandSolid : c.border,
                          backgroundColor: on ? c.brandSolid : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {on && <Check size={15} color="#fff" />}
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </>
          )}
        </>
      )}
    </Screen>
  );
}

const tile = {
  width: 68,
  height: 68,
  borderRadius: 22,
  overflow: "hidden" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
};

function Point({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <View style={{ paddingTop: 2 }}>{icon}</View>
      <Txt size={14} tone="muted" style={{ flex: 1 }}>
        {children}
      </Txt>
    </View>
  );
}
