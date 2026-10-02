import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Flag, ThumbsDown, ThumbsUp } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { communityApi } from "@/api/endpoints";
import { Sheet, toast, Txt } from "@/components/ui";
import { amber, brand, sky, stone, useColors, violet } from "@/theme";

/** ชนิดสัตว์ของชุมชน — = COMM_SP ของเว็บ */
export const COMM_SP: Record<string, { label: string; fg: string; bg: string }> = {
  dog: { label: "สุนัข", fg: brand[700], bg: brand[50] },
  cat: { label: "แมว", fg: amber[700], bg: amber[50] },
  rabbit: { label: "กระต่าย", fg: violet[700], bg: violet[50] },
  bird: { label: "นก", fg: sky[700], bg: sky[50] },
  other: { label: "อื่น ๆ", fg: stone[600], bg: stone[50] },
};

export const COMM_FILTERS = [
  { id: "all", label: "ทั้งหมด" },
  { id: "unanswered", label: "ยังไม่มีคำตอบ" },
  { id: "vet", label: "ตอบโดยสัตวแพทย์" },
  { id: "dog", label: "สุนัข" },
  { id: "cat", label: "แมว" },
  { id: "rabbit", label: "กระต่าย" },
  { id: "bird", label: "นก" },
  { id: "other", label: "อื่น ๆ" },
];

const REPORT_REASONS = [
  { id: "spam", label: "สแปม / โฆษณา", desc: "ขายของ ลิงก์แปลกปลอม หรือข้อความซ้ำ" },
  { id: "wrong", label: "ข้อมูลผิด / อาจเป็นอันตราย", desc: "คำแนะนำที่อาจทำให้สัตว์ได้รับอันตราย" },
  { id: "rude", label: "ไม่เหมาะสม / หยาบคาย", desc: "ถ้อยคำรุนแรง คุกคาม หรือไม่สุภาพ" },
  { id: "other", label: "อื่น ๆ", desc: "เหตุผลอื่นที่ไม่ได้อยู่ในรายการ" },
];

export function SpeciesTag({ species }: { species: string }) {
  const c = useColors();
  const sp = COMM_SP[species] ?? COMM_SP.other;
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: c.isDark ? c.surfaceAlt : sp.bg, alignSelf: "flex-start" }}>
      <Txt size={11.5} weight="semibold" color={c.isDark ? c.textMuted : sp.fg} lineHeight={16}>
        {sp.label}
      </Txt>
    </View>
  );
}

export function VetBadge() {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: c.brandSoft }}>
      <BadgeCheck size={12} color={c.brandSoftText} />
      <Txt size={11} weight="semibold" color={c.brandSoftText} lineHeight={15}>
        สัตวแพทย์ยืนยันแล้ว
      </Txt>
    </View>
  );
}

/** ปุ่มโหวต 👍/👎 + รายงาน — ตัดสินสิทธิ์ที่ server (โหวตของตัวเองไม่ได้) */
export function VoteBar({
  targetType,
  targetId,
  likes,
  dislikes,
  myVote,
  isMine,
  questionId,
}: {
  targetType: "question" | "answer";
  targetId: string;
  likes: number;
  dislikes: number;
  myVote: number;
  isMine: boolean;
  questionId: string;
}) {
  const c = useColors();
  const qc = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const vote = useMutation({
    mutationFn: (value: number) => communityApi.vote(targetType, targetId, value),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["community"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const report = useMutation({
    mutationFn: (reason: string) => communityApi.report(targetType, targetId, reason),
    onSuccess: () => {
      setReportOpen(false);
      toast.success("ส่งรายงานแล้ว ทีมงานจะตรวจสอบ");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const btn = (active: boolean, Icon: typeof ThumbsUp, n: number, value: number, label: string) => (
    <Pressable
      disabled={isMine}
      onPress={() => vote.mutate(active ? 0 : value)}
      accessibilityLabel={label}
      style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, backgroundColor: active ? c.brandSoft : "transparent", opacity: isMine ? 0.5 : 1 }}
    >
      <Icon size={16} color={active ? c.brand : c.textMuted} />
      <Txt size={13} tone={active ? "brand" : "muted"}>
        {n}
      </Txt>
    </Pressable>
  );

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      {btn(myVote === 1, ThumbsUp, likes, 1, "มีประโยชน์")}
      {btn(myVote === -1, ThumbsDown, dislikes, -1, "ไม่มีประโยชน์")}
      <View style={{ flex: 1 }} />
      {!isMine && (
        <Pressable onPress={() => setReportOpen(true)} hitSlop={8} accessibilityLabel="รายงาน" style={{ padding: 4 }}>
          <Flag size={15} color={c.textFaint} />
        </Pressable>
      )}
      <Sheet open={reportOpen} onClose={() => setReportOpen(false)} title="รายงานเนื้อหานี้">
        {REPORT_REASONS.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => report.mutate(r.id)}
            style={({ pressed }) => ({ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.borderStrong, backgroundColor: pressed ? c.surfaceAlt : c.surface })}
          >
            <Txt weight="semibold">{r.label}</Txt>
            <Txt size={13} tone="muted">
              {r.desc}
            </Txt>
          </Pressable>
        ))}
        <Txt size={12} tone="faint" align="center">
          {questionId ? "รายงานจะไม่เปิดเผยชื่อของคุณ" : ""}
        </Txt>
      </Sheet>
    </View>
  );
}
