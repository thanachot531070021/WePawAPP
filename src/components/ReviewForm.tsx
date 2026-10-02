import { Image } from "expo-image";
import { ImagePlus, X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { absoluteUrl } from "@/api/config";
import { uploadApi, type ReviewInput } from "@/api/endpoints";
import { Button, Card, Field, Notice, StarInput, toast, Txt } from "@/components/ui";
import { pickImageWithChoice } from "@/lib/images";
import { radius, useColors } from "@/theme";

const SUB = [
  { key: "rating_expertise", label: "ความเชี่ยวชาญ" },
  { key: "rating_cleanliness", label: "ความสะอาด" },
  { key: "rating_price", label: "ราคา" },
  { key: "rating_service", label: "การบริการ" },
] as const;

const MAX_IMAGES = 6;

/** ฟอร์มรีวิว — คะแนนรวม + 4 มิติ (เหมือน ReviewForm ของเว็บ) + รูป (เฉพาะรีวิวทั่วไป) */
export function ReviewForm({
  allowImages,
  submitting,
  error,
  onSubmit,
}: {
  allowImages: boolean;
  submitting: boolean;
  error: string | null;
  onSubmit: (input: ReviewInput, imageUrls: string[]) => void;
}) {
  const c = useColors();
  const [rating, setRating] = useState<number | null>(null);
  const [sub, setSub] = useState<Record<string, number | null>>({});
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [attempted, setAttempted] = useState(false);

  async function addImage() {
    const file = await pickImageWithChoice();
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadApi.review(file);
      setImages((x) => [...x, url]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={{ gap: 16 }}>
      {error && <Notice tone="danger">{error}</Notice>}
      <Card style={{ alignItems: "center", gap: 10 }}>
        <Txt weight="semibold">ให้คะแนนโดยรวม</Txt>
        <StarInput value={rating} onChange={setRating} size={40} label="คะแนนโดยรวม" />
        {attempted && !rating && (
          <Txt size={12.5} tone="danger">
            กรุณาให้คะแนน 1–5 ดาว
          </Txt>
        )}
      </Card>
      <Card style={{ gap: 12 }}>
        {SUB.map((s) => (
          <View key={s.key} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Txt size={14}>{s.label}</Txt>
            <StarInput value={sub[s.key] ?? null} onChange={(v) => setSub((x) => ({ ...x, [s.key]: v }))} size={24} label={s.label} />
          </View>
        ))}
      </Card>
      <Field label="หัวข้อ" value={title} onChangeText={setTitle} maxLength={150} placeholder="สรุปสั้น ๆ เช่น หมอใจดีมาก" />
      <Field label="เล่าประสบการณ์" value={comment} onChangeText={setComment} multiline maxLength={2000} placeholder="การบริการ การอธิบาย ความสะอาด ฯลฯ" />
      {allowImages && (
        <View style={{ gap: 8 }}>
          <Txt size={13.5} weight="medium" tone="muted">
            รูปภาพ ({images.length}/{MAX_IMAGES})
          </Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {images.map((u) => (
              <View key={u}>
                <Image source={{ uri: absoluteUrl(u)! }} style={{ width: 78, height: 78, borderRadius: radius.md }} />
                <Pressable
                  onPress={() => setImages((x) => x.filter((y) => y !== u))}
                  accessibilityLabel="ลบรูป"
                  style={{ position: "absolute", top: -6, right: -6, backgroundColor: c.text, borderRadius: 11, padding: 3 }}
                >
                  <X size={14} color={c.bg} />
                </Pressable>
              </View>
            ))}
            {images.length < MAX_IMAGES && (
              <Pressable
                onPress={addImage}
                disabled={uploading}
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor: c.borderStrong,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ImagePlus size={24} color={c.textFaint} />
                <Txt size={11} tone="faint">
                  {uploading ? "กำลังอัปโหลด" : "เพิ่มรูป"}
                </Txt>
              </Pressable>
            )}
          </View>
        </View>
      )}
      <Button
        label="ส่งรีวิว"
        size="lg"
        full
        loading={submitting}
        disabled={uploading}
        onPress={() => {
          setAttempted(true);
          if (!rating) return;
          onSubmit(
            {
              rating,
              rating_expertise: sub.rating_expertise ?? null,
              rating_cleanliness: sub.rating_cleanliness ?? null,
              rating_price: sub.rating_price ?? null,
              rating_service: sub.rating_service ?? null,
              title: title.trim() || null,
              comment: comment.trim() || null,
            },
            images
          );
        }}
      />
    </View>
  );
}
