import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import { Copy, Crown, Link2, Share2, Trash2, UserMinus } from "lucide-react-native";
import { useState } from "react";
import { Share, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { petApi } from "@/api/endpoints";
import type { PetShare } from "@/api/types";
import {
  AppBar,
  Avatar,
  Button,
  Card,
  Chip,
  confirmAsync,
  EmptyState,
  ErrorView,
  LoadingView,
  Screen,
  SectionTitle,
  toast,
  Txt,
} from "@/components/ui";
import { usePet, usePetShares } from "@/features/queries";
import { qk } from "@/lib/queryClient";
import { radius, useColors } from "@/theme";

const ROLE = {
  co_owner: { label: "ดูแลร่วม", desc: "ดูข้อมูลทั้งหมด · บันทึกค่าวัด/วัคซีน · จองนัดให้น้อง" },
  viewer: { label: "ดูอย่างเดียว", desc: "ดูข้อมูลและประวัติทั้งหมด แต่แก้ไขไม่ได้" },
} as const;

/** แชร์น้องให้คนในบ้าน — คู่กับ ShareManagementSection ของเว็บ (ลิงก์/QR เชิญ + จัดการสิทธิ์ + โอนเจ้าของ) */
export default function SharingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const qc = useQueryClient();
  const pet = usePet(id);
  const shares = usePetShares(id);
  const [role, setRole] = useState<"co_owner" | "viewer">("co_owner");
  const [fresh, setFresh] = useState<string | null>(null);
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: qk.petShares(id) });
    void qc.invalidateQueries({ queryKey: qk.pets });
  };

  const create = useMutation({
    mutationFn: () => petApi.createInvitation(id, role),
    onSuccess: (r) => {
      setFresh(r.data.url);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const revokeInv = useMutation({ mutationFn: petApi.revokeInvitation, onSuccess: refresh, onError: (e: Error) => toast.error(e.message) });
  const changeRole = useMutation({
    mutationFn: (s: PetShare) => petApi.updateShareRole(s.id, s.role === "co_owner" ? "viewer" : "co_owner"),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });
  const revoke = useMutation({ mutationFn: petApi.revokeShare, onSuccess: refresh, onError: (e: Error) => toast.error(e.message) });
  const transfer = useMutation({
    mutationFn: (userId: string) => petApi.transfer(id, userId),
    onSuccess: () => {
      toast.success("โอนความเป็นเจ้าของแล้ว");
      void qc.invalidateQueries({ queryKey: qk.pet(id) });
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (pet.isLoading || shares.isLoading) return <LoadingView />;
  if (shares.error) return <ErrorView message={(shares.error as Error).message} onRetry={shares.refetch} />;
  const name = pet.data?.pet.name ?? "";

  const shareLink = (url: string) =>
    Share.share({ message: `ชวนมาดูแลน้อง${name}ด้วยกันบน PetCare: ${url}` }).catch(() => null);

  return (
    <Screen header={<AppBar title={`แชร์${name}`} back />}>
      <SectionTitle>สร้างลิงก์เชิญ</SectionTitle>
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["co_owner", "viewer"] as const).map((r) => (
            <Chip key={r} label={ROLE[r].label} selected={role === r} onPress={() => setRole(r)} />
          ))}
        </View>
        <Txt size={13.5} tone="muted">
          {ROLE[role].desc}
        </Txt>
        <Button label="สร้างลิงก์เชิญ" icon={Link2} loading={create.isPending} onPress={() => create.mutate()} />
        {fresh && (
          <View style={{ alignItems: "center", gap: 10, paddingTop: 6 }}>
            <View style={{ padding: 12, backgroundColor: "#fff", borderRadius: radius.md }}>
              <QRCode value={fresh} size={170} />
            </View>
            <Txt size={12.5} tone="muted" align="center" selectable numberOfLines={2} style={{ alignSelf: "stretch" }}>
              {fresh}
            </Txt>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                label="คัดลอก"
                icon={Copy}
                variant="outline"
                size="sm"
                onPress={async () => {
                  await Clipboard.setStringAsync(fresh);
                  toast.success("คัดลอกลิงก์แล้ว");
                }}
              />
              <Button label="ส่งลิงก์" icon={Share2} size="sm" onPress={() => shareLink(fresh)} />
            </View>
          </View>
        )}
      </Card>

      <SectionTitle>คนที่ดูแลน้องร่วมกัน</SectionTitle>
      {(shares.data?.shares ?? []).length === 0 ? (
        <Card>
          <EmptyState title="ยังไม่ได้แชร์ให้ใคร" body="ส่งลิงก์เชิญให้คนในบ้าน เพื่อดูประวัติและจองนัดให้น้องได้" />
        </Card>
      ) : (
        <Card padded={false}>
          {shares.data!.shares.map((s, i) => (
            <View key={s.id} style={{ padding: 14, gap: 10, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <Avatar url={s.user_avatar_url} name={s.user_full_name} size={40} />
                <View style={{ flex: 1 }}>
                  <Txt weight="semibold">{s.user_full_name}</Txt>
                  <Txt size={13} tone="muted">
                    {ROLE[s.role].label}
                  </Txt>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Button
                  label={s.role === "co_owner" ? "เปลี่ยนเป็นดูอย่างเดียว" : "เปลี่ยนเป็นดูแลร่วม"}
                  variant="outline"
                  size="sm"
                  onPress={() => changeRole.mutate(s)}
                />
                <Button
                  label="เพิกถอน"
                  icon={UserMinus}
                  variant="dangerOutline"
                  size="sm"
                  onPress={async () => {
                    if (await confirmAsync("เพิกถอนสิทธิ์?", `${s.user_full_name} จะไม่เห็นข้อมูลของ${name}อีก`, "เพิกถอน")) revoke.mutate(s.id);
                  }}
                />
                <Button
                  label="โอนเป็นเจ้าของ"
                  icon={Crown}
                  variant="ghost"
                  size="sm"
                  onPress={async () => {
                    if (await confirmAsync("โอนความเป็นเจ้าของ?", `${s.user_full_name} จะเป็นเจ้าของ${name} และคุณจะเหลือสิทธิ์ดูแลร่วม`, "โอน"))
                      transfer.mutate(s.user_id);
                  }}
                />
              </View>
            </View>
          ))}
        </Card>
      )}

      {(shares.data?.invitations ?? []).length > 0 && (
        <>
          <SectionTitle>ลิงก์เชิญที่ยังใช้ได้</SectionTitle>
          <Card padded={false}>
            {shares.data!.invitations.map((inv, i) => (
              <View
                key={inv.id}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}
              >
                <Link2 size={18} color={c.textMuted} />
                <View style={{ flex: 1 }}>
                  <Txt size={14} weight="medium">
                    {ROLE[inv.role].label}
                  </Txt>
                  <Txt size={12.5} tone="muted">
                    ใช้ไปแล้ว {inv.uses_count} ครั้ง
                  </Txt>
                </View>
                <Button label="ส่ง" size="sm" variant="outline" onPress={() => shareLink(inv.url)} />
                <Button
                  label=""
                  icon={Trash2}
                  size="sm"
                  variant="ghost"
                  onPress={async () => {
                    if (await confirmAsync("ยกเลิกลิงก์นี้?", "คนที่ยังไม่ได้กดรับจะใช้ลิงก์นี้ไม่ได้", "ยกเลิกลิงก์")) revokeInv.mutate(inv.id);
                  }}
                />
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}
