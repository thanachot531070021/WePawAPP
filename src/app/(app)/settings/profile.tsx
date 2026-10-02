import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Camera } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { ApiError } from "@/api/client";
import { meApi, uploadApi } from "@/api/endpoints";
import type { Profile, User } from "@/api/types";
import { AppBar, Avatar, Button, Field, LoadingView, Screen, toast, Txt } from "@/components/ui";
import { useMe } from "@/features/queries";
import { pickImageWithChoice } from "@/lib/images";
import { qk } from "@/lib/queryClient";
import { formatThaiPhone, phoneDigits, PHONE_PLACEHOLDER, thaiPhoneError } from "@/shared/phone";
import { useSession } from "@/state/session";
import { useColors } from "@/theme";

/** แก้โปรไฟล์ — updateProfile() + updateAvatar() ตัวเดียวกับหน้า /account */
export default function ProfileSettings() {
  const me = useMe();
  if (me.isLoading || !me.data) return <LoadingView />;
  return <ProfileForm me={me.data} />;
}

function ProfileForm({ me }: { me: { user: User; profile: Profile | null } }) {
  const c = useColors();
  const qc = useQueryClient();
  const setUser = useSession((s) => s.setUser);
  const user = useSession((s) => s.user);
  const [form, setForm] = useState(() => ({
    full_name: me.user.full_name,
    phone: me.user.phone ?? "",
    province: me.profile?.province ?? "",
    district: me.profile?.district ?? "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      meApi.update({
        full_name: form.full_name.trim(),
        phone: phoneDigits(form.phone) || null,
        province: form.province.trim() || null,
        district: form.district.trim() || null,
      }),
    onSuccess: async () => {
      const fresh = await meApi.get();
      setUser(fresh.user);
      void qc.invalidateQueries({ queryKey: qk.me });
      toast.success("บันทึกโปรไฟล์แล้ว");
      router.back();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
      toast.error(e.message);
    },
  });

  async function changeAvatar() {
    const file = await pickImageWithChoice(true);
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadApi.avatar(file);
      await meApi.setAvatar(url);
      const fresh = await meApi.get();
      setUser(fresh.user);
      toast.success("เปลี่ยนรูปโปรไฟล์แล้ว");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Screen
      header={<AppBar title="แก้ไขโปรไฟล์" back />}
      footer={
        <Button
          label="บันทึก"
          size="lg"
          full
          loading={save.isPending}
          onPress={() => {
            const pe = thaiPhoneError(form.phone);
            if (pe) {
              setErrors({ phone: pe });
              return;
            }
            setErrors({});
            save.mutate();
          }}
        />
      }
    >
      <View style={{ alignItems: "center", gap: 6 }}>
        <Pressable onPress={changeAvatar} disabled={uploading} accessibilityLabel="เปลี่ยนรูปโปรไฟล์">
          <Avatar url={user?.avatar_url} name={user?.full_name} size={96} />
          <View
            style={{ position: "absolute", right: -2, bottom: -2, width: 34, height: 34, borderRadius: 17, backgroundColor: c.brandSolid, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: c.bg }}
          >
            <Camera size={16} color="#fff" />
          </View>
        </Pressable>
        <Txt size={13} tone="muted">
          {uploading ? "กำลังอัปโหลด…" : user?.email}
        </Txt>
      </View>
      <Field label="ชื่อ-นามสกุล" required value={form.full_name} onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))} error={errors.full_name} />
      <Field
        label="เบอร์โทร"
        value={formatThaiPhone(form.phone)}
        onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
        error={errors.phone}
        keyboardType="phone-pad"
        placeholder={PHONE_PLACEHOLDER}
      />
      <Field label="จังหวัด" value={form.province} onChangeText={(v) => setForm((f) => ({ ...f, province: v }))} maxLength={50} />
      <Field label="เขต / อำเภอ" value={form.district} onChangeText={(v) => setForm((f) => ({ ...f, district: v }))} maxLength={50} />
    </Screen>
  );
}
