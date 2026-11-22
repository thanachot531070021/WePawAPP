import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowRight, Building2, Check, CheckCircle2, Clock, Eye, EyeOff, ShieldAlert, ShieldCheck } from "lucide-react-native";
import { View } from "react-native";
import { Image } from "expo-image";
import { petAccessApi } from "@/api/endpoints";
import { AppBar, Button, Card, EmptyState, ErrorView, LoadingView, PetAvatar, Screen, toast, Txt } from "@/components/ui";
import { qk } from "@/lib/queryClient";
import { absoluteUrl } from "@/api/config";
import { SPECIES_LABEL, type PetSpecies } from "@/shared/species";
import { radius, useColors } from "@/theme";

/**
 * คลินิกสแกน QR ของน้องแล้วขอเปิดแฟ้ม — = หน้า /pet-access/[token] ของเว็บ (เปิดจากแจ้งเตือน)
 * กดอนุญาต = คลินิกเปิดแฟ้มน้องได้ · ไม่กด = ไม่มีอะไรเกิดขึ้น (คำขอหมดอายุใน 24 ชม.)
 */
export default function PetAccessScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const c = useColors();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["pet-access", token], queryFn: () => petAccessApi.get(token) });
  const approve = useMutation({
    mutationFn: () => petAccessApi.approve(token),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["pet-access", token] });
      void qc.invalidateQueries({ queryKey: qk.pets });
      toast.success("อนุญาตแล้ว");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const header = <AppBar title="คำขอเปิดแฟ้มน้อง" back />;
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
          body="คำขอมีอายุ 24 ชั่วโมง ถ้าคุณพาน้องไปคลินิก ให้คลินิกสแกน QR ของน้องอีกครั้ง"
        />
      </Screen>
    );
  if (v.status === "not_owner")
    return (
      <Screen header={header}>
        <EmptyState icon={ShieldAlert} title="บัญชีนี้ไม่ใช่เจ้าของน้อง" body={`คำขอนี้ส่งถึงเจ้าของ${v.pet.name}`} />
      </Screen>
    );

  const { pet, clinic } = v;
  const logo = absoluteUrl(clinic.logo_url);
  const expires = new Date(v.expiresAt).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });
  const linked = v.status === "linked";

  return (
    <Screen
      header={header}
      footer={
        linked ? (
          <Button label={`ไปหน้า${pet.name}`} size="lg" full variant="outline" onPress={() => router.replace(`/pets/${pet.id}`)} />
        ) : (
          <Button
            label={`อนุญาตให้${clinic.name}เปิดแฟ้ม`}
            icon={Check}
            size="lg"
            full
            loading={approve.isPending}
            onPress={() => approve.mutate()}
          />
        )
      }
    >
      <Card style={{ alignItems: "center", gap: 12, paddingVertical: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <PetAvatar species={pet.species} seed={pet.id} url={pet.avatar_url} size={68} radius={22} />
          <ArrowRight size={20} color={c.textFaint} />
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 22,
              overflow: "hidden",
              backgroundColor: c.brandSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {logo ? (
              <Image source={{ uri: logo }} style={{ width: 68, height: 68 }} contentFit="cover" />
            ) : (
              <Building2 size={30} color={c.brand} />
            )}
          </View>
        </View>
        <Txt size={18} weight="bold" align="center">
          {clinic.name} ขอเปิดแฟ้มของ{pet.name}
        </Txt>
        <Txt size={13.5} tone="muted" align="center">
          {SPECIES_LABEL[pet.species as PetSpecies] ?? pet.species}
          {clinic.area ? ` · คลินิกอยู่ที่ ${clinic.area}` : ""}
        </Txt>
      </Card>

      {linked ? (
        <Card style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <CheckCircle2 size={20} color={c.brand} />
          <Txt size={14.5} style={{ flex: 1 }}>
            อนุญาตแล้ว — {clinic.name} เปิดแฟ้มของ{pet.name}ได้
          </Txt>
        </Card>
      ) : (
        <Card style={{ gap: 12, borderRadius: radius.lg }}>
          <Point icon={<Eye size={16} color={c.brand} />}>
            คลินิกเห็นข้อมูลน้อง ชื่อ-เบอร์ของคุณ และประวัติที่คุณบันทึกเอง (น้ำหนัก วัคซีน)
          </Point>
          <Point icon={<EyeOff size={16} color={c.textFaint} />}>ไม่เห็นประวัติรักษาจากคลินิกอื่น เว้นแต่คุณแชร์น้องให้เอง</Point>
          <Point icon={<ShieldCheck size={16} color={c.textFaint} />}>
            ถ้าคุณไม่ได้พาน้องไปคลินิกนี้ ไม่ต้องกด — คำขอหมดอายุเอง ({expires})
          </Point>
        </Card>
      )}
    </Screen>
  );
}

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
