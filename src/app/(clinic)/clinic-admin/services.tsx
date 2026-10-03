import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import type { ClinicServiceRow } from "@/api/staffTypes";
import { clinicStaffApi } from "@/api/staffEndpoints";
import { AppBar, Button, Card, confirmAsync, EmptyState, ErrorView, Field, IconButton, LoadingView, Screen, Sheet, toast, Txt } from "@/components/ui";
import { useClinicServices } from "@/features/staffQueries";
import { formatPrice } from "@/lib/format";
import { useColors } from "@/theme";

const num = (v: string) => v.replace(/[^\d.]/g, "");

/**
 * บริการและราคา — createService / updateService / deleteService ของเว็บ
 * แก้เฉพาะชื่อ คำอธิบาย ราคา (ชนิดสัตว์ / ฝากไว้ / เวลาส่งคำขอรีวิว ตั้งบนเว็บ — แอปไม่ล้างค่าเหล่านั้น)
 */
export default function ClinicServices() {
  const c = useColors();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch, isRefetching } = useClinicServices();
  const [editing, setEditing] = useState<ClinicServiceRow | "new" | null>(null);
  const [form, setForm] = useState({ service_name: "", description: "", price_min: "", price_max: "" });

  const open = (s: ClinicServiceRow | "new") => {
    setEditing(s);
    setForm(
      s === "new"
        ? { service_name: "", description: "", price_min: "", price_max: "" }
        : {
            service_name: s.service_name,
            description: s.description ?? "",
            price_min: s.price_min ? String(Number(s.price_min)) : "",
            price_max: s.price_max ? String(Number(s.price_max)) : "",
          }
    );
  };
  const refresh = () => qc.invalidateQueries({ queryKey: ["clinic"] });

  const save = useMutation({
    mutationFn: () => (editing === "new" ? clinicStaffApi.createService(form) : clinicStaffApi.updateService((editing as ClinicServiceRow).id, form)),
    onSuccess: () => {
      toast.success("บันทึกบริการแล้ว");
      setEditing(null);
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => clinicStaffApi.deleteService(id),
    onSuccess: () => {
      toast.success("ลบบริการแล้ว");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Screen
      header={<AppBar title="บริการและราคา" back right={<IconButton icon={Plus} label="เพิ่มบริการ" onPress={() => open("new")} />} />}
      refreshing={isRefetching}
      onRefresh={refetch}
    >
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={(error as Error).message} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyState icon={ListChecks} title="ยังไม่มีบริการ" action={<Button label="เพิ่มบริการ" icon={Plus} full onPress={() => open("new")} />} />
      ) : (
        <Card padded={false}>
          {data.map((s, i) => (
            <View key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}>
              <View style={{ flex: 1 }}>
                <Txt weight="medium">{s.service_name}</Txt>
                <Txt size={13} tone="muted">
                  {[formatPrice(s.price_min, s.price_max), s.requires_dropoff ? "ฝากไว้" : null, s.home_visit_available ? "เยี่ยมบ้านได้" : null]
                    .filter(Boolean)
                    .join(" · ") || "ไม่ระบุราคา"}
                </Txt>
              </View>
              <Pressable onPress={() => open(s)} hitSlop={8} accessibilityLabel="แก้ไข" style={{ padding: 6 }}>
                <Pencil size={18} color={c.textMuted} />
              </Pressable>
              <Pressable
                hitSlop={8}
                accessibilityLabel="ลบ"
                style={{ padding: 6 }}
                onPress={async () => {
                  if (await confirmAsync("ลบบริการนี้?", s.service_name, "ลบ")) remove.mutate(s.id);
                }}
              >
                <Trash2 size={18} color={c.textFaint} />
              </Pressable>
            </View>
          ))}
        </Card>
      )}
      <Txt size={12.5} tone="faint" align="center">
        ชนิดสัตว์ที่รับ · บริการฝากไว้ · เยี่ยมบ้าน ตั้งค่าได้บนเว็บ
      </Txt>
      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "เพิ่มบริการ" : "แก้ไขบริการ"}
        footer={<Button label="บันทึก" full loading={save.isPending} disabled={!form.service_name.trim()} onPress={() => save.mutate()} />}
      >
        <Field label="ชื่อบริการ" required value={form.service_name} onChangeText={(v) => setForm((f) => ({ ...f, service_name: v }))} maxLength={100} />
        <Field label="คำอธิบาย" value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} multiline maxLength={1000} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="ราคาต่ำสุด" value={form.price_min} onChangeText={(v) => setForm((f) => ({ ...f, price_min: num(v) }))} keyboardType="decimal-pad" suffix="฿" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="ราคาสูงสุด" value={form.price_max} onChangeText={(v) => setForm((f) => ({ ...f, price_max: num(v) }))} keyboardType="decimal-pad" suffix="฿" />
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}
