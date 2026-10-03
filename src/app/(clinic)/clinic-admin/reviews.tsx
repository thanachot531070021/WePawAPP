import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquareReply, Star } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import type { ClinicReview } from "@/api/staffTypes";
import { clinicStaffApi } from "@/api/staffEndpoints";
import { AppBar, Avatar, Button, Card, EmptyState, ErrorView, Field, LoadingView, Screen, Stars, toast, Txt } from "@/components/ui";
import { useClinicReviews } from "@/features/staffQueries";
import { timeAgo } from "@/lib/format";
import { radius, useColors } from "@/theme";

function ReviewItem({ r }: { r: ClinicReview }) {
  const c = useColors();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const m = useMutation({
    mutationFn: () => clinicStaffApi.reply(r.id, reply),
    onSuccess: () => {
      toast.success("ตอบรีวิวแล้ว — ผู้รีวิวได้รับแจ้งเตือน");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["clinic"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <Avatar url={r.user_avatar_url} name={r.user_full_name} size={36} />
        <View style={{ flex: 1 }}>
          <Txt weight="semibold">{r.user_full_name}</Txt>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <Stars value={r.rating} size={13} />
            <Txt size={12} tone="faint">
              {timeAgo(r.created_at)}
              {r.pet_name ? ` · น้อง${r.pet_name}` : ""}
            </Txt>
          </View>
        </View>
      </View>
      {r.title && <Txt weight="semibold">{r.title}</Txt>}
      {r.comment && <Txt size={14}>{r.comment}</Txt>}
      {r.clinic_reply ? (
        <View style={{ padding: 10, borderRadius: radius.md, backgroundColor: c.surfaceAlt }}>
          <Txt size={12.5} weight="semibold" tone="brand">
            คำตอบของคลินิก
          </Txt>
          <Txt size={13.5}>{r.clinic_reply}</Txt>
        </View>
      ) : open ? (
        <View style={{ gap: 8 }}>
          <Field value={reply} onChangeText={setReply} multiline placeholder="ขอบคุณที่ไว้วางใจ..." maxLength={2000} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button label="ส่งคำตอบ" size="sm" loading={m.isPending} disabled={reply.trim().length < 2} onPress={() => m.mutate()} />
            <Button label="ยกเลิก" size="sm" variant="ghost" onPress={() => setOpen(false)} />
          </View>
        </View>
      ) : (
        <Button label="ตอบรีวิว" icon={MessageSquareReply} size="sm" variant="soft" onPress={() => setOpen(true)} style={{ alignSelf: "flex-start" }} />
      )}
    </Card>
  );
}

/** รีวิวของคลินิก (ยังไม่ตอบขึ้นก่อน) + ตอบกลับ — replyToReview() ของเว็บ */
export default function ClinicReviews() {
  const { data, isLoading, error, refetch, isRefetching } = useClinicReviews();
  const pending = (data ?? []).filter((r) => !r.clinic_reply).length;
  return (
    <Screen header={<AppBar title="รีวิว" subtitle={pending ? `${pending} รอตอบ` : null} back />} refreshing={isRefetching} onRefresh={refetch}>
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={(error as Error).message} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyState icon={Star} title="ยังไม่มีรีวิว" />
      ) : (
        data.map((r) => <ReviewItem key={r.id} r={r} />)
      )}
    </Screen>
  );
}
