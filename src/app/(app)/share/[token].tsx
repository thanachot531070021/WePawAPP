import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Check, Users, X } from "lucide-react-native";
import { View } from "react-native";
import { petApi } from "@/api/endpoints";
import { AppBar, Button, Card, EmptyState, ErrorView, LoadingView, Screen, toast, Txt } from "@/components/ui";
import { qk } from "@/lib/queryClient";
import { useColors } from "@/theme";

const RIGHTS = {
  co_owner: [
    [true, "ดูข้อมูลและประวัติทั้งหมด"],
    [true, "บันทึกค่าวัด / วัคซีน"],
    [true, "จองนัดให้สัตว์เลี้ยง"],
    [false, "แก้ไขข้อมูลคงที่ / ลบสัตว์เลี้ยง"],
  ],
  viewer: [
    [true, "ดูข้อมูลและประวัติทั้งหมด"],
    [false, "แก้ไขข้อมูลหรือเพิ่มประวัติ"],
  ],
} as const;

/** รับคำเชิญดูแลน้อง — = หน้า /pets/share/[token] ของเว็บ (เปิดจากลิงก์ได้ผ่าน deep link) */
export default function AcceptShareScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const c = useColors();
  const qc = useQueryClient();
  const inv = useQuery({ queryKey: ["invite", token], queryFn: () => petApi.previewInvitation(token) });
  const accept = useMutation({
    mutationFn: () => petApi.acceptInvitation(token),
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: qk.pets });
      toast.success(`รับดูแลน้อง${r.data.petName}แล้ว`);
      router.replace(r.data.petIds.length > 1 ? "/pets" : `/pets/${r.data.petId}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (inv.isLoading) return <LoadingView />;
  if (inv.error || !inv.data)
    return (
      <Screen header={<AppBar title="คำเชิญ" back />}>
        <ErrorView message={(inv.error as Error)?.message ?? "ลิงก์ไม่ถูกต้อง"} />
      </Screen>
    );
  const d = inv.data;
  const names = d.pets.map((p) => p.name).join(", ");
  const allMine = d.pets.every((p) => p.is_mine);

  return (
    <Screen header={<AppBar title="คำเชิญดูแลน้อง" back />}>
      {d.revoked ? (
        <EmptyState icon={X} title="ลิงก์นี้ถูกยกเลิกแล้ว" body="ขอลิงก์ใหม่จากเจ้าของน้อง" />
      ) : allMine ? (
        <EmptyState icon={Users} title={`${names} เป็นสัตว์เลี้ยงของคุณอยู่แล้ว`} />
      ) : (
        <>
          <Card style={{ alignItems: "center", gap: 8, paddingVertical: 24 }}>
            <Users size={40} color={c.brand} />
            <Txt size={18} weight="bold" align="center">
              {d.inviter_name ?? "เจ้าของน้อง"} ชวนคุณดูแล{names}
            </Txt>
            <Txt tone="muted">สิทธิ์: {d.role === "co_owner" ? "ดูแลร่วม" : "ดูอย่างเดียว"}</Txt>
          </Card>
          <Card style={{ gap: 8 }}>
            {RIGHTS[d.role].map(([ok, label]) => (
              <View key={label} style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                {ok ? <Check size={16} color={c.brand} /> : <X size={16} color={c.textFaint} />}
                <Txt size={14} tone={ok ? "default" : "faint"}>
                  {label}
                </Txt>
              </View>
            ))}
          </Card>
          <Button label="รับคำเชิญ" size="lg" full loading={accept.isPending} onPress={() => accept.mutate()} />
        </>
      )}
    </Screen>
  );
}
