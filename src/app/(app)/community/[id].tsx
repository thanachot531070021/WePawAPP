import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { SendHorizontal } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { communityApi } from "@/api/endpoints";
import { SpeciesTag, VetBadge, VoteBar } from "@/components/community";
import { AppBar, Avatar, Card, ErrorView, LoadingView, SectionTitle, toast, Txt } from "@/components/ui";
import { useQuestion } from "@/features/queries";
import { qk } from "@/lib/queryClient";
import { font, gutter, useColors } from "@/theme";

export default function QuestionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: q, isLoading, error, refetch } = useQuestion(id);
  const [answer, setAnswer] = useState("");

  const send = useMutation({
    mutationFn: () => communityApi.answer(id, answer.trim()),
    onSuccess: () => {
      setAnswer("");
      void qc.invalidateQueries({ queryKey: qk.question(id) });
      void qc.invalidateQueries({ queryKey: ["community"] });
      toast.success("ส่งคำตอบแล้ว");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <LoadingView />;
  if (error || !q)
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <AppBar title="คำถาม" back />
        <ErrorView message={(error as Error)?.message ?? "ไม่พบคำถาม"} onRetry={refetch} />
      </View>
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <AppBar title="คำถาม" back />
      <ScrollView contentContainerStyle={{ padding: gutter, gap: 12, paddingBottom: 24 }}>
        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Avatar url={q.askerAvatar} name={q.askerName} size={34} />
            <View style={{ flex: 1 }}>
              <Txt size={14} weight="semibold">
                {q.askerName}
              </Txt>
              <Txt size={12} tone="faint">
                {q.time} · เข้าชม {q.views}
              </Txt>
            </View>
            <SpeciesTag species={q.species} />
          </View>
          <Txt size={18} weight="bold">
            {q.title}
          </Txt>
          <Txt size={15}>{q.body}</Txt>
          <VoteBar targetType="question" targetId={q.id} likes={q.likes} dislikes={q.dislikes} myVote={q.myVote} isMine={q.isMine} questionId={q.id} />
        </Card>

        <SectionTitle>{q.answers.length} คำตอบ</SectionTitle>
        {q.answers.map((a) => (
          <Card key={a.id} style={{ gap: 8, borderColor: a.role === "vet" ? c.brand : c.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Avatar url={a.authorAvatar} name={a.authorName} size={30} />
              <View style={{ flex: 1 }}>
                <Txt size={14} weight="semibold">
                  {a.authorName}
                </Txt>
                <Txt size={12} tone="faint">
                  {[a.clinic, a.time].filter(Boolean).join(" · ")}
                </Txt>
              </View>
              {a.role === "vet" && <VetBadge />}
            </View>
            <Txt size={14.5}>{a.body}</Txt>
            <VoteBar targetType="answer" targetId={a.id} likes={a.likes} dislikes={a.dislikes} myVote={a.myVote} isMine={a.isMine} questionId={q.id} />
          </Card>
        ))}
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: c.surface,
          borderTopWidth: 1,
          borderTopColor: c.borderStrong,
        }}
      >
        <TextInput
          value={answer}
          onChangeText={setAnswer}
          placeholder="เขียนคำตอบ…"
          placeholderTextColor={c.textFaint}
          multiline
          style={{ flex: 1, maxHeight: 120, minHeight: 42, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 21, backgroundColor: c.surfaceAlt, fontFamily: font.regular, fontSize: 15.5, color: c.text }}
        />
        <Pressable
          onPress={() => answer.trim() && send.mutate()}
          disabled={!answer.trim() || send.isPending}
          accessibilityLabel="ส่งคำตอบ"
          style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: answer.trim() ? c.brandSolid : c.surfaceAlt, alignItems: "center", justifyContent: "center" }}
        >
          <SendHorizontal size={20} color={answer.trim() ? "#fff" : c.textFaint} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
