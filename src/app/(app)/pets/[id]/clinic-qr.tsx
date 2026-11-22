import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { RefreshCw, ShieldCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { petApi } from "@/api/endpoints";
import { AppBar, Button, Card, ErrorView, LoadingView, Screen, Txt } from "@/components/ui";
import { usePet } from "@/features/queries";
import { radius, useColors } from "@/theme";

/**
 * QR ให้คลินิก (petcare lib/clinic/petAccess.ts — signPetHandoff) — เจ้าของเปิดที่เคาน์เตอร์ให้คลินิก/POS สแกน
 * = ยินยอมเปิดแฟ้มน้องทันที · อายุ 10 นาที ต่ออายุเองขณะเปิดหน้านี้
 * ต่างจาก QR ประจำตัว/ป้ายห้อยคอ (public_tag) ที่ใครก็สแกนได้ — คลินิกต้องขออนุญาตก่อน
 */
export default function ClinicQrScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const pet = usePet(id);
  const code = useQuery({
    queryKey: ["pet-handoff", id],
    queryFn: () => petApi.handoff(id),
    // ต่ออายุก่อนหมด (อายุ 10 นาที → ขอใหม่ทุก 9 นาที) · ไม่ cache ข้ามการเปิดหน้า
    refetchInterval: 9 * 60_000,
    gcTime: 0,
    staleTime: 0,
  });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const name = pet.data?.pet.name ?? "น้อง";
  const header = <AppBar title={`QR ให้คลินิก · ${name}`} back />;
  if (code.isLoading) return <LoadingView />;
  if (code.error || !code.data)
    return (
      <Screen header={header}>
        <ErrorView message={(code.error as Error)?.message ?? "เปิด QR ไม่สำเร็จ"} onRetry={code.refetch} />
      </Screen>
    );

  const { value, expiresAt } = code.data.data;
  const left = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
  const expired = left === 0;

  return (
    <Screen header={header}>
      <Card style={{ alignItems: "center", gap: 14, paddingVertical: 24 }}>
        <Txt size={14} tone="muted" align="center">
          ยื่นให้พนักงานสแกนที่เคาน์เตอร์
        </Txt>
        <View
          style={{
            padding: 16,
            backgroundColor: "#fff",
            borderRadius: radius.lg,
            borderWidth: 2,
            borderColor: expired ? c.border : c.brandSolid,
            opacity: expired ? 0.3 : 1,
          }}
        >
          <QRCode value={value} size={230} ecl="M" />
        </View>
        {expired ? (
          <Button label="สร้าง QR ใหม่" icon={RefreshCw} onPress={() => code.refetch()} loading={code.isFetching} />
        ) : (
          <Txt size={13.5} weight="semibold" tone="muted">
            ใช้ได้อีก {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")} นาที · ต่ออายุเองขณะเปิดหน้านี้
          </Txt>
        )}
      </Card>
      <Card style={{ flexDirection: "row", gap: 10, backgroundColor: c.brandSoft }}>
        <ShieldCheck size={18} color={c.brandSoftText} />
        <Txt size={13} color={c.brandSoftText} style={{ flex: 1 }}>
          คลินิกที่สแกน QR นี้จะเปิดแฟ้ม{name}ได้ทันที (เห็นข้อมูลน้อง ชื่อ-เบอร์ของคุณ และประวัติที่คุณบันทึกเอง) — อย่าแชร์หรือส่งรูป QR นี้ให้คนอื่น ·
          ป้ายห้อยคอใช้ QR ประจำตัวแทน
        </Txt>
      </Card>
    </Screen>
  );
}
