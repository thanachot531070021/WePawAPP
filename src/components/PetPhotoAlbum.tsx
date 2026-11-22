import { Image } from "expo-image";
import { ImagePlus, Images, Star, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { uploadApi } from "@/api/endpoints";
import { Card, SectionTitle, toast, Txt } from "@/components/ui";
import { pickImages } from "@/lib/images";
import { radius, useColors } from "@/theme";

/** รูปน้องสูงสุดต่อตัว รวมรูปหลัก — ตรงกับ MAX_PET_PHOTOS ของ petcare (lib/pets/photos.ts) */
export const MAX_PET_PHOTOS = 12;

/**
 * แก้อัลบั้มในฟอร์มน้อง (PetPhotosInput showMain=false ของเว็บ) — รูปหลักแก้ที่วงกลมด้านบนของฟอร์ม
 * กากบาทมุมรูป = เอาออก · ดาว = ตั้งเป็นรูปหลัก (รูปหลักเดิมย้ายมาอยู่ในอัลบั้ม)
 */
export function PetPhotoAlbumInput({
  main,
  extras,
  onChange,
  onUploadingChange,
}: {
  main: string | null;
  extras: string[];
  onChange: (main: string | null, extras: string[]) => void;
  onUploadingChange?: (busy: boolean) => void;
}) {
  const c = useColors();
  const [pending, setPending] = useState(0);
  // ค่าล่าสุดระหว่างอัปโหลดหลายรูปต่อเนื่อง (props เปลี่ยนระหว่าง await)
  const latest = useRef({ main, extras });
  useEffect(() => {
    latest.current = { main, extras };
  }, [main, extras]);

  const total = (main ? 1 : 0) + extras.length;
  const remaining = Math.max(0, MAX_PET_PHOTOS - total);

  async function add() {
    const files = await pickImages(remaining);
    if (!files.length) return;
    setPending((n) => n + files.length);
    onUploadingChange?.(true);
    let failed = 0;
    for (const f of files) {
      try {
        const { url } = await uploadApi.pet(f);
        const cur = latest.current;
        latest.current = { main: cur.main, extras: [...cur.extras, url] };
        onChange(latest.current.main, latest.current.extras);
      } catch {
        failed++;
      } finally {
        setPending((n) => n - 1);
      }
    }
    onUploadingChange?.(false);
    if (failed) toast.error(`อัปโหลดไม่สำเร็จ ${failed} รูป`);
  }

  const tile = {
    width: "31.5%" as const,
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: "hidden" as const,
  };

  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>อัลบั้มรูปน้อง</SectionTitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {extras.map((url) => (
          <View key={url} style={[tile, { backgroundColor: c.surfaceAlt }]}>
            <Image
              source={{ uri: url }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
            <Pressable
              onPress={() =>
                onChange(
                  main,
                  extras.filter((u) => u !== url),
                )
              }
              accessibilityLabel="ลบรูปนี้"
              hitSlop={6}
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "rgba(0,0,0,0.6)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.4)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color="#fff" strokeWidth={2.5} />
            </Pressable>
            <Pressable
              onPress={() => {
                const rest = extras.filter((u) => u !== url);
                onChange(url, main ? [main, ...rest] : rest);
              }}
              accessibilityLabel="ตั้งเป็นรูปหลัก"
              style={{
                position: "absolute",
                left: 6,
                bottom: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                paddingHorizontal: 7,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: "rgba(0,0,0,0.55)",
              }}
            >
              <Star size={11} color="#fff" />
              <Txt size={10.5} weight="semibold" color="#fff">
                ตั้งเป็นรูปหลัก
              </Txt>
            </Pressable>
          </View>
        ))}
        {Array.from({ length: pending }).map((_, i) => (
          <View
            key={`p${i}`}
            style={[
              tile,
              {
                backgroundColor: c.surfaceAlt,
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            <ActivityIndicator color={c.textMuted} />
          </View>
        ))}
        {remaining > 0 && (
          <Pressable
            onPress={add}
            accessibilityLabel="เพิ่มรูปในอัลบั้ม"
            style={[
              tile,
              {
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: c.borderStrong,
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              },
            ]}
          >
            <ImagePlus size={24} color={c.textMuted} />
            <Txt size={12} weight="semibold" tone="muted">
              เพิ่มรูป
            </Txt>
            <Txt size={10.5} tone="faint">
              {total}/{MAX_PET_PHOTOS}
            </Txt>
          </Pressable>
        )}
      </View>
      <Txt size={12.5} tone="muted">
        เลือกได้หลายรูปพร้อมกัน สูงสุด {MAX_PET_PHOTOS} รูป (รวมรูปหลัก) ·
        แตะดาวเพื่อใช้เป็นรูปหลัก
      </Txt>
    </View>
  );
}

/** อัลบั้มบนหน้าน้อง — รูปหลัก + อัลบั้ม แสดงเมื่อมีมากกว่า 1 รูป · แตะเพื่อดูเต็มจอ ปัดซ้าย/ขวา */
export function PetPhotoGallery({
  photos,
  petName,
  onEdit,
}: {
  photos: string[];
  petName: string;
  onEdit?: () => void;
}) {
  const c = useColors();
  const [open, setOpen] = useState<number | null>(null);
  if (photos.length < 2) return null;
  return (
    <>
      <SectionTitle
        action={
          onEdit ? (
            <Txt size={13.5} weight="semibold" tone="brand" onPress={onEdit}>
              จัดการรูป
            </Txt>
          ) : undefined
        }
      >
        {`อัลบั้มรูป${petName} · ${photos.length} รูป`}
      </SectionTitle>
      <Card padded={false}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ padding: 12, gap: 8 }}
        >
          {photos.map((url, i) => (
            <Pressable
              key={url}
              onPress={() => setOpen(i)}
              accessibilityLabel={`ดูรูปที่ ${i + 1}`}
            >
              <Image
                source={{ uri: url }}
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: radius.md,
                  backgroundColor: c.surfaceAlt,
                }}
                contentFit="cover"
              />
            </Pressable>
          ))}
        </ScrollView>
      </Card>
      {open !== null && (
        <PhotoViewer
          key={open}
          photos={photos}
          index={open}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

function PhotoViewer({
  photos,
  index,
  onClose,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [cur, setCur] = useState(index);
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.96)" }}>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          initialScrollIndex={index}
          getItemLayout={(_, i) => ({
            length: width,
            offset: width * i,
            index: i,
          })}
          keyExtractor={(u) => u}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setCur(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item }) => (
            <View
              style={{
                width,
                height,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={{ uri: item }}
                style={{ width, height: height * 0.8 }}
                contentFit="contain"
              />
            </View>
          )}
        />
        <View
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 16,
            right: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Images size={16} color="rgba(255,255,255,0.8)" />
            <Txt size={14} color="rgba(255,255,255,0.85)">
              {cur + 1} / {photos.length}
            </Txt>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel="ปิด"
            hitSlop={8}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.14)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
