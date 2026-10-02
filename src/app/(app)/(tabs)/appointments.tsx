import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { CalendarPlus, NotebookPen, Plus, Search, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { noteApi } from "@/api/endpoints";
import type { CalendarNote } from "@/api/types";
import { AppointmentCard } from "@/components/AppointmentCard";
import { TopActions } from "@/components/TopActions";
import {
  AppBar,
  Button,
  CalendarPicker,
  Card,
  Chip,
  confirmAsync,
  EmptyState,
  ErrorView,
  Field,
  LoadingView,
  Screen,
  SectionTitle,
  Segmented,
  Sheet,
  toast,
  Txt,
} from "@/components/ui";
import { useAppointments, useNotes } from "@/features/queries";
import { bkkDateKey, formatDateShort } from "@/lib/format";
import { qk } from "@/lib/queryClient";
import { amber, brand, rose, sky, stone, useColors } from "@/theme";

const NOTE_COLORS: { id: CalendarNote["color"]; label: string; dot: string }[] = [
  { id: "stone", label: "ทั่วไป", dot: stone[400] },
  { id: "emerald", label: "สุขภาพ", dot: brand[500] },
  { id: "amber", label: "ซื้อของ", dot: amber[500] },
  { id: "sky", label: "นัดหมาย", dot: sky[500] },
  { id: "rose", label: "สำคัญ", dot: rose[500] },
];

/** แท็บนัดของฉัน — กำลังจะถึง / ผ่านไปแล้ว + โน้ตปฏิทิน (คู่กับ /account/appointments) */
export default function AppointmentsTab() {
  const c = useColors();
  const qc = useQueryClient();
  const [range, setRange] = useState<"upcoming" | "past">("upcoming");
  const upcoming = useAppointments("upcoming");
  const past = useAppointments("past");
  const notes = useNotes();
  const current = range === "upcoming" ? upcoming : past;
  const [noteOpen, setNoteOpen] = useState(false);

  const upcomingNotes = useMemo(
    () => (notes.data ?? []).filter((n) => n.note_date >= bkkDateKey()).slice(0, 6),
    [notes.data]
  );

  const removeNote = useMutation({
    mutationFn: (id: string) => noteApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notes }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Screen
      inTabs
      header={<AppBar title="นัดของฉัน" right={<TopActions />} />}
      refreshing={current.isRefetching}
      onRefresh={() => {
        void current.refetch();
        void notes.refetch();
      }}
    >
      <Segmented
        value={range}
        onChange={setRange}
        options={[
          { value: "upcoming", label: "กำลังจะถึง", count: upcoming.data?.length },
          { value: "past", label: "ผ่านไปแล้ว" },
        ]}
      />

      {current.isLoading ? (
        <LoadingView />
      ) : current.error ? (
        <ErrorView message={(current.error as Error).message} onRetry={current.refetch} />
      ) : (current.data ?? []).length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title={range === "upcoming" ? "ยังไม่มีนัดที่กำลังจะถึง" : "ยังไม่มีประวัตินัด"}
          body={range === "upcoming" ? "ค้นหาคลินิกใกล้บ้าน แล้วส่งคำขอจองคิวได้เลย" : undefined}
          action={
            range === "upcoming" ? (
              <Button label="ค้นหาคลินิก" icon={Search} full onPress={() => router.navigate("/")} />
            ) : undefined
          }
        />
      ) : (
        (current.data ?? []).map((a) => <AppointmentCard key={a.id} appt={a} past={range === "past"} />)
      )}

      {range === "upcoming" && (
        <>
          <SectionTitle
            action={
              <Pressable onPress={() => setNoteOpen(true)} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Plus size={16} color={c.brand} />
                <Txt size={13.5} weight="semibold" tone="brand">
                  เพิ่มโน้ต
                </Txt>
              </Pressable>
            }
          >
            โน้ตในปฏิทิน
          </SectionTitle>
          {upcomingNotes.length === 0 ? (
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }} onPress={() => setNoteOpen(true)}>
              <NotebookPen size={22} color={c.textFaint} />
              <Txt tone="muted" size={14} style={{ flex: 1 }}>
                จดเตือนตัวเอง เช่น ซื้ออาหาร ให้ยาถ่ายพยาธิ
              </Txt>
            </Card>
          ) : (
            <Card padded={false}>
              {upcomingNotes.map((n, i) => (
                <View
                  key={n.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    borderBottomWidth: i === upcomingNotes.length - 1 ? 0 : 1,
                    borderBottomColor: c.border,
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: NOTE_COLORS.find((x) => x.id === n.color)?.dot ?? stone[400],
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Txt weight="medium">{n.title}</Txt>
                    <Txt size={12.5} tone="muted">
                      {formatDateShort(n.note_date)}
                      {n.body ? ` · ${n.body}` : ""}
                    </Txt>
                  </View>
                  <Pressable
                    hitSlop={8}
                    accessibilityLabel="ลบโน้ต"
                    onPress={async () => {
                      if (await confirmAsync("ลบโน้ตนี้?", n.title, "ลบ")) removeNote.mutate(n.id);
                    }}
                  >
                    <Trash2 size={18} color={c.textFaint} />
                  </Pressable>
                </View>
              ))}
            </Card>
          )}
        </>
      )}

      <NoteSheet open={noteOpen} onClose={() => setNoteOpen(false)} />
    </Screen>
  );
}

function NoteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [date, setDate] = useState<string>(bkkDateKey());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [color, setColor] = useState<CalendarNote["color"]>("stone");
  const m = useMutation({
    mutationFn: () => noteApi.create({ note_date: date, title: title.trim(), body: body.trim() || undefined, color }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.notes });
      toast.success("เพิ่มโน้ตแล้ว");
      setTitle("");
      setBody("");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="เพิ่มโน้ตในปฏิทิน"
      footer={<Button label="บันทึกโน้ต" full loading={m.isPending} disabled={!title.trim()} onPress={() => m.mutate()} />}
    >
      <CalendarPicker value={date} onChange={setDate} min={bkkDateKey()} />
      <Field label="หัวข้อ" required value={title} onChangeText={setTitle} placeholder="เช่น ซื้ออาหารเม็ด" maxLength={140} />
      <Field label="รายละเอียด" value={body} onChangeText={setBody} multiline maxLength={1000} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {NOTE_COLORS.map((x) => (
          <Chip key={x.id} label={x.label} selected={color === x.id} onPress={() => setColor(x.id)} />
        ))}
      </View>
    </Sheet>
  );
}
