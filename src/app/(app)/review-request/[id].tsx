import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import { useState } from "react";
import { reviewApi } from "@/api/endpoints";
import { ReviewForm } from "@/components/ReviewForm";
import { AppBar, Button, Card, EmptyState, ErrorView, LoadingView, Screen, toast, Txt } from "@/components/ui";

/** รีวิวหลังใช้บริการ (ผูกนัด) — คู่กับ /account/reviews/[id] ของเว็บ */
export default function ReviewRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const req = useQuery({ queryKey: ["reviewRequest", id], queryFn: async () => (await reviewApi.request(id)).data });
  const m = useMutation({
    mutationFn: (input: Parameters<typeof reviewApi.submitRequest>[1]) => reviewApi.submitRequest(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("ขอบคุณสำหรับรีวิว");
      router.back();
    },
    onError: (e: Error) => setError(e.message),
  });

  if (req.isLoading) return <LoadingView />;
  if (req.error || !req.data)
    return (
      <Screen header={<AppBar title="รีวิวการใช้บริการ" back />}>
        <ErrorView message={(req.error as Error)?.message ?? "ไม่พบคำขอรีวิว"} />
      </Screen>
    );
  const r = req.data;

  return (
    <Screen header={<AppBar title="รีวิวการใช้บริการ" subtitle={r.clinic_name} back />}>
      {r.already_reviewed ? (
        <EmptyState
          icon={CheckCircle2}
          title="คุณรีวิวครั้งนี้แล้ว"
          body="ขอบคุณที่ช่วยให้เจ้าของสัตว์คนอื่นเลือกคลินิกได้ง่ายขึ้น"
          action={<Button label="กลับ" variant="outline" full onPress={() => router.back()} />}
        />
      ) : (
        <>
          <Card style={{ gap: 2 }}>
            <Txt weight="semibold">{r.clinic_name}</Txt>
            <Txt size={13.5} tone="muted">
              {[r.service_label, r.pet_name ? `น้อง${r.pet_name}` : null].filter(Boolean).join(" · ")}
            </Txt>
          </Card>
          <ReviewForm allowImages={false} submitting={m.isPending} error={error} onSubmit={(input) => m.mutate(input)} />
        </>
      )}
    </Screen>
  );
}
