import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ReceiptText } from "lucide-react-native";
import { View } from "react-native";
import { absoluteUrl } from "@/api/config";
import { receiptApi } from "@/api/endpoints";
import { money } from "@/components/ReceiptChatCard";
import { AppBar, Card, ErrorView, LoadingView, Pill, Screen, Txt } from "@/components/ui";
import { qk } from "@/lib/queryClient";
import { radius, useColors } from "@/theme";
import type { AppColors } from "@/theme/tokens";

const PAYMENT: Record<string, string> = { cash: "เงินสด", transfer: "โอนเงิน", card: "บัตร", promptpay: "พร้อมเพย์" };
const qty = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });

/** ใบเสร็จที่คลินิกส่งเข้าแชท = หน้า /account/receipts/[id] ของเว็บ (สิทธิ์ตัดสินที่ server) */
export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const q = useQuery({ queryKey: qk.receipt(id), queryFn: () => receiptApi.get(id) });

  if (q.isLoading) return <LoadingView />;
  if (q.error || !q.data)
    return (
      <Screen header={<AppBar title="ใบเสร็จ" back />}>
        <ErrorView message={(q.error as Error)?.message ?? "ไม่พบใบเสร็จ"} onRetry={q.refetch} />
      </Screen>
    );

  const r = q.data.receipt;
  const at = new Date(r.at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "long", timeStyle: "short" });
  const status =
    r.status === "void"
      ? { label: "บิลนี้ถูกยกเลิกแล้ว", color: c.danger, bg: c.dangerSoft }
      : r.status === "refunded"
        ? { label: "มีการคืนเงิน", color: c.warnText, bg: c.warnSoft }
        : r.status === "partial"
          ? { label: "ชำระบางส่วน", color: c.warnText, bg: c.warnSoft }
          : r.status === "unpaid"
            ? { label: "ยังไม่ได้ชำระ", color: c.warnText, bg: c.warnSoft }
            : null;
  const logo = absoluteUrl(r.clinic.logo_url);

  const dash = { borderTopWidth: 1, borderStyle: "dashed" as const, borderColor: c.borderStrong };

  return (
    <Screen header={<AppBar title="ใบเสร็จ" subtitle={r.receipt_no ?? undefined} back />}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <View style={{ alignItems: "center", paddingHorizontal: 20, paddingTop: 22, paddingBottom: 18, backgroundColor: c.brandSoft }}>
          {logo ? (
            <Image source={{ uri: logo }} style={{ width: 48, height: 48, borderRadius: radius.md }} contentFit="contain" />
          ) : (
            <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: c.brandSolid, alignItems: "center", justifyContent: "center" }}>
              <ReceiptText size={24} color="#fff" />
            </View>
          )}
          <Txt
            size={17}
            weight="bold"
            align="center"
            style={{ marginTop: 10 }}
            onPress={() => router.push({ pathname: "/clinic/[slug]", params: { slug: r.clinic.slug } })}
          >
            {r.clinic.name}
          </Txt>
          {!!r.clinic.address && (
            <Txt size={12} tone="muted" align="center">
              {r.clinic.address}
            </Txt>
          )}
          {!!r.clinic.phone && (
            <Txt size={12} tone="muted">
              โทร {r.clinic.phone}
            </Txt>
          )}
          <Txt size={12} tone="muted" style={{ marginTop: 14 }}>
            ยอดสุทธิ
          </Txt>
          <Txt size={32} weight="bold" lineHeight={42}>
            ฿{money(r.total)}
          </Txt>
          {status && <Pill label={status.label} color={status.color} bg={status.bg} style={{ marginTop: 6 }} />}
        </View>

        <View style={[dash, { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, paddingVertical: 14, rowGap: 10 }]}>
          <View style={{ width: "50%" }}>
            <Txt size={12} tone="muted">เลขที่</Txt>
            <Txt size={14} weight="semibold">{r.receipt_no ?? "—"}</Txt>
          </View>
          <View style={{ width: "50%", alignItems: "flex-end" }}>
            <Txt size={12} tone="muted">วันที่</Txt>
            <Txt size={14} align="right">{at}</Txt>
          </View>
          {!!r.customer_name && (
            <View style={{ width: "50%" }}>
              <Txt size={12} tone="muted">ลูกค้า</Txt>
              <Txt size={14}>{r.customer_name}</Txt>
            </View>
          )}
          {!!r.pet_name && (
            <View style={{ width: "50%", alignItems: "flex-end", marginLeft: r.customer_name ? 0 : "50%" }}>
              <Txt size={12} tone="muted">น้อง</Txt>
              <Txt size={14}>{r.pet_name}</Txt>
            </View>
          )}
        </View>

        <View style={[dash, { paddingHorizontal: 20, paddingVertical: 10 }]}>
          {r.items.map((it, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 12, paddingVertical: 7 }}>
              <View style={{ flex: 1 }}>
                <Txt size={14.5}>{it.name}</Txt>
                <Txt size={12} tone="muted">
                  {qty(it.quantity)} {it.unit_name ?? ""} × ฿{money(it.unit_price)}
                  {it.line_discount > 0 ? ` · ลด ฿${money(it.line_discount)}` : ""}
                </Txt>
              </View>
              <Txt size={14.5} weight="medium">
                ฿{money(it.line_total)}
              </Txt>
            </View>
          ))}
        </View>

        <View style={[dash, { paddingHorizontal: 20, paddingVertical: 14, gap: 6 }]}>
          <Row c={c} label="รวม" value={`฿${money(r.subtotal)}`} />
          {r.discount > 0 && <Row c={c} label="ส่วนลด" value={`−฿${money(r.discount)}`} tone="minus" />}
          {r.tax > 0 && <Row c={c} label="ภาษี/อื่น ๆ" value={`฿${money(r.tax)}`} />}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 6 }}>
            <Txt size={16} weight="bold">ยอดสุทธิ</Txt>
            <Txt size={16} weight="bold">฿{money(r.total)}</Txt>
          </View>
          {!!r.payment_method && <Row c={c} label="ชำระโดย" value={PAYMENT[r.payment_method] ?? r.payment_method} />}
          {r.payment_method === "cash" && !!r.cash_received && (
            <>
              <Row c={c} label="รับเงิน" value={`฿${money(r.cash_received)}`} />
              <Row c={c} label="เงินทอน" value={`฿${money(r.change_amount ?? 0)}`} />
            </>
          )}
          {r.refunded_amount > 0 && <Row c={c} label="คืนเงินแล้ว" value={`฿${money(r.refunded_amount)}`} tone="minus" />}
        </View>
      </Card>
    </Screen>
  );
}

function Row({ c, label, value, tone }: { c: AppColors; label: string; value: string; tone?: "minus" }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Txt size={14} tone="muted">
        {label}
      </Txt>
      <Txt size={14} color={tone === "minus" ? c.danger : c.text}>
        {value}
      </Txt>
    </View>
  );
}
