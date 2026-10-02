import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { communityApi } from "@/api/endpoints";
import { COMM_SP } from "@/components/community";
import { AppBar, Button, Chip, Field, Notice, Screen, SectionTitle, toast } from "@/components/ui";

export default function AskScreen() {
  const qc = useQueryClient();
  const [species, setSpecies] = useState("dog");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () => communityApi.ask({ species, title: title.trim(), body: body.trim() }),
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: ["community"] });
      toast.success("ตั้งคำถามแล้ว");
      router.replace(`/community/${r.data.id}`);
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Screen
      header={<AppBar title="ตั้งคำถาม" back />}
      footer={<Button label="โพสต์คำถาม" size="lg" full loading={m.isPending} disabled={!title.trim() || !body.trim()} onPress={() => m.mutate()} />}
    >
      <Notice tone="warn">ถ้าน้องมีอาการฉุกเฉิน (หายใจลำบาก ชัก เลือดออกมาก) โปรดพาไปคลินิกทันที อย่ารอคำตอบ</Notice>
      {error && <Notice tone="danger">{error}</Notice>}
      <SectionTitle>ชนิดสัตว์</SectionTitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {Object.entries(COMM_SP).map(([k, v]) => (
          <Chip key={k} label={v.label} selected={species === k} onPress={() => setSpecies(k)} />
        ))}
      </View>
      <Field label="หัวข้อคำถาม" required value={title} onChangeText={setTitle} maxLength={150} placeholder="เช่น แมวไม่ยอมกินอาหาร 2 วันแล้ว" />
      <Field label="รายละเอียด" required value={body} onChangeText={setBody} multiline maxLength={4000} placeholder="อายุ อาการ เริ่มเป็นเมื่อไร กินยาอะไรอยู่" />
    </Screen>
  );
}
