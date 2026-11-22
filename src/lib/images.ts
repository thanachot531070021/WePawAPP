import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";
import type { UploadFile } from "@/api/endpoints";
import { toast } from "@/components/ui";

const MAX_EDGE = 1600;

/**
 * เลือก/ถ่ายรูป แล้วย่อ + แปลงเป็น JPEG ก่อนอัปโหลดเสมอ
 * — รูป HEIC จาก iPhone เปิดบน Chrome (หน้าเว็บของคลินิก) ไม่ได้ และไฟล์เต็มขนาดเกินลิมิต 8 MB ของ server
 */
export async function pickImage(opts: { camera?: boolean; square?: boolean } = {}): Promise<UploadFile | null> {
  try {
    const perm = opts.camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error(opts.camera ? "ต้องอนุญาตกล้องก่อน" : "ต้องอนุญาตคลังรูปภาพก่อน");
      return null;
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      allowsEditing: !!opts.square,
      aspect: opts.square ? [1, 1] : undefined,
      quality: 1,
    };
    const res = opts.camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (res.canceled || !res.assets[0]) return null;
    const asset = res.assets[0];

    const ctx = ImageManipulator.manipulate(asset.uri);
    if ((asset.width ?? 0) > MAX_EDGE || (asset.height ?? 0) > MAX_EDGE) {
      ctx.resize(asset.width >= asset.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
    }
    const rendered = await ctx.renderAsync();
    const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    return { uri: saved.uri, name: `photo-${Date.now()}.jpg`, type: "image/jpeg" };
  } catch (err) {
    console.warn("[pickImage]", err);
    toast.error("เปิดรูปไม่สำเร็จ");
    return null;
  }
}

/** ให้ผู้ใช้เลือกว่าจะถ่ายใหม่หรือเลือกจากคลัง (เว็บมีแค่เลือกไฟล์) */
export async function pickImageWithChoice(square = false): Promise<UploadFile | null> {
  if (Platform.OS === "web") return pickImage({ square });
  const choice = await new Promise<"camera" | "library" | null>((resolve) =>
    Alert.alert("เพิ่มรูป", undefined, [
      { text: "ถ่ายรูป", onPress: () => resolve("camera") },
      { text: "เลือกจากคลังรูปภาพ", onPress: () => resolve("library") },
      { text: "ยกเลิก", style: "cancel", onPress: () => resolve(null) },
    ])
  );
  if (!choice) return null;
  return pickImage({ camera: choice === "camera", square });
}

/**
 * เลือกหลายรูปจากคลัง (สูงสุด limit รูป) หรือถ่ายรูปเดียว — ย่อ + แปลง JPEG ทุกรูปเหมือน pickImage
 * ใช้กับอัลบั้มรูปน้อง (petcare migration 047)
 */
export async function pickImages(limit: number): Promise<UploadFile[]> {
  if (limit <= 0) return [];
  let camera = false;
  if (Platform.OS !== "web") {
    const choice = await new Promise<"camera" | "library" | null>((resolve) =>
      Alert.alert("เพิ่มรูป", undefined, [
        { text: "ถ่ายรูป", onPress: () => resolve("camera") },
        { text: `เลือกจากคลังรูปภาพ (ได้ ${limit} รูป)`, onPress: () => resolve("library") },
        { text: "ยกเลิก", style: "cancel", onPress: () => resolve(null) },
      ])
    );
    if (!choice) return [];
    camera = choice === "camera";
  }
  if (camera) {
    const one = await pickImage({ camera: true });
    return one ? [one] : [];
  }
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error("ต้องอนุญาตคลังรูปภาพก่อน");
      return [];
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: limit,
      orderedSelection: true,
      quality: 1,
    });
    if (res.canceled) return [];
    const out: UploadFile[] = [];
    for (const [i, asset] of res.assets.slice(0, limit).entries()) {
      const ctx = ImageManipulator.manipulate(asset.uri);
      if ((asset.width ?? 0) > MAX_EDGE || (asset.height ?? 0) > MAX_EDGE) {
        ctx.resize(asset.width >= asset.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
      }
      const rendered = await ctx.renderAsync();
      const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
      out.push({ uri: saved.uri, name: `photo-${Date.now()}-${i}.jpg`, type: "image/jpeg" });
    }
    return out;
  } catch (err) {
    console.warn("[pickImages]", err);
    toast.error("เปิดรูปไม่สำเร็จ");
    return [];
  }
}
