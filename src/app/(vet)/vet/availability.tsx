import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarOff, Plus, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { vetStaffApi } from "@/api/staffEndpoints";
import { AppBar, Button, CalendarPicker, Card, Chip, confirmAsync, ErrorView, Field, LoadingView, Notice, Screen, SectionTitle, Sheet, Toggle, toast, Txt } from "@/components/ui";
import { useVetAvailability } from "@/features/staffQueries";
import { bkkDateKey, formatDateShort, formatTime, TH_DAYS } from "@/lib/format";
import { useColors } from "@/theme";

type Row = { day_of_week: number; start_time: string; end_time: string; active: boolean };
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** เวลาทำงานประจำสัปดาห์ + วันลา — saveAvailability / addTimeOff / deleteTimeOff ของ /vet/availability */
export default function VetAvailability() {
  const { data, isLoading, error, refetch } = useVetAvailability();
  if (isLoading) return <LoadingView />;
  if (error || !data)
    return (
      <Screen header={<AppBar title="เวลาทำงาน" back />}>
        <ErrorView message={(error as Error)?.message ?? "โหลดไม่สำเร็จ"} onRetry={refetch} />
      </Screen>
    );
  const initial: Row[] = Array.from({ length: 7 }, (_, d) => {
    const a = data.availability.find((x) => x.day_of_week === d);
    return a ? { day_of_week: d, start_time: a.start_time, end_time: a.end_time, active: true } : { day_of_week: d, start_time: "09:00", end_time: "17:00", active: false };
  });
  return <Editor key={JSON.stringify(data.availability)} initial={initial} data={data} />;
}

function Editor({ initial, data }: { initial: Row[]; data: NonNullable<ReturnType<typeof useVetAvailability>["data"]> }) {
  const c = useColors();
  const qc = useQueryClient();
  const [rows, setRows] = useState<Row[]>(initial);
  const [offOpen, setOffOpen] = useState(false);
  const setRow = (d: number, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.day_of_week === d ? { ...x, ...patch } : x)));
  const refresh = () => qc.invalidateQueries({ queryKey: ["vet"] });

  const save = useMutation({
    mutationFn: () => vetStaffApi.saveAvailability(rows),
    onSuccess: () => {
      toast.success("บันทึกเวลาทำงานแล้ว");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: vetStaffApi.deleteTimeOff,
    onSuccess: () => void refresh(),
    onError: (e: Error) => toast.error(e.message),
  });
  const invalid = rows.some((r) => r.active && (!HHMM.test(r.start_time) || !HHMM.test(r.end_time) || r.start_time >= r.end_time));

  return (
    <Screen
      header={<AppBar title="เวลาทำงาน" subtitle={data.clinic?.clinic_name ?? null} back />}
      footer={data.clinic ? <Button label="บันทึกเวลาทำงาน" size="lg" full loading={save.isPending} disabled={invalid} onPress={() => save.mutate()} /> : undefined}
    >
      {!data.clinic ? (
        <Notice tone="warn">ยังไม่ได้ผูกคลินิก — ตั้งเวลาทำงานได้เมื่อเข้าร่วมคลินิกแล้ว</Notice>
      ) : (
        <>
          <SectionTitle>ทุกสัปดาห์ที่ {data.clinic.clinic_name}</SectionTitle>
          <Card padded={false}>
            {ORDER.map((d, i) => {
              const r = rows.find((x) => x.day_of_week === d)!;
              return (
                <View key={d} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}>
                  <Toggle value={r.active} onChange={(v) => setRow(d, { active: v })} label={TH_DAYS[d]} />
                  <Txt weight="medium" style={{ width: 74 }} tone={r.active ? "default" : "faint"}>
                    {TH_DAYS[d]}
                  </Txt>
                  {r.active ? (
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={{ flex: 1 }}>
                        <Field value={r.start_time} onChangeText={(v) => setRow(d, { start_time: v })} keyboardType="numbers-and-punctuation" />
                      </View>
                      <Txt tone="muted">–</Txt>
                      <View style={{ flex: 1 }}>
                        <Field value={r.end_time} onChangeText={(v) => setRow(d, { end_time: v })} keyboardType="numbers-and-punctuation" />
                      </View>
                    </View>
                  ) : (
                    <Txt tone="faint" style={{ flex: 1 }}>
                      ไม่เข้าเวร
                    </Txt>
                  )}
                </View>
              );
            })}
          </Card>
          {invalid && <Notice tone="danger">เวลาต้องเป็น HH:MM และเวลาเริ่มต้องก่อนเวลาเลิก</Notice>}
        </>
      )}

      <SectionTitle
        action={
          <Pressable onPress={() => setOffOpen(true)} style={{ flexDirection: "row", gap: 4, alignItems: "center" }} hitSlop={8}>
            <Plus size={16} color={c.brand} />
            <Txt size={13.5} weight="semibold" tone="brand">
              เพิ่มวันลา
            </Txt>
          </Pressable>
        }
      >
        วันลาที่กำลังจะถึง
      </SectionTitle>
      {data.time_off.length === 0 ? (
        <Card style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <CalendarOff size={20} color={c.textFaint} />
          <Txt tone="muted">ยังไม่มีวันลา</Txt>
        </Card>
      ) : (
        <Card padded={false}>
          {data.time_off.map((t, i) => (
            <View key={t.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}>
              <View style={{ flex: 1 }}>
                <Txt weight="medium">
                  {formatDateShort(t.start_at)} {formatTime(t.start_at)} – {formatDateShort(t.end_at)} {formatTime(t.end_at)}
                </Txt>
                <Txt size={12.5} tone="muted">
                  {[t.clinic_name ?? "ทุกคลินิก", t.reason].filter(Boolean).join(" · ")}
                </Txt>
              </View>
              <Pressable
                hitSlop={8}
                accessibilityLabel="ลบวันลา"
                onPress={async () => {
                  if (await confirmAsync("ลบวันลานี้?", t.reason ?? "", "ลบ")) del.mutate(t.id);
                }}
              >
                <Trash2 size={18} color={c.textFaint} />
              </Pressable>
            </View>
          ))}
        </Card>
      )}
      <TimeOffSheet open={offOpen} onClose={() => setOffOpen(false)} clinic={data.clinic} />
    </Screen>
  );
}

function TimeOffSheet({ open, onClose, clinic }: { open: boolean; onClose: () => void; clinic: { clinic_id: string; clinic_name: string } | null }) {
  const qc = useQueryClient();
  const [startDate, setStartDate] = useState(bkkDateKey());
  const [endDate, setEndDate] = useState(bkkDateKey());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [scope, setScope] = useState<"all" | "this">("all");
  const [reason, setReason] = useState("");
  const [picking, setPicking] = useState<"start" | "end">("start");
  const m = useMutation({
    mutationFn: () =>
      vetStaffApi.addTimeOff({
        clinic_id: scope === "this" && clinic ? clinic.clinic_id : "all",
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("เพิ่มวันลาแล้ว");
      void qc.invalidateQueries({ queryKey: ["vet"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Sheet open={open} onClose={onClose} title="เพิ่มวันลา" footer={<Button label="บันทึกวันลา" full loading={m.isPending} onPress={() => m.mutate()} />}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Chip label={`เริ่ม ${formatDateShort(startDate)}`} selected={picking === "start"} onPress={() => setPicking("start")} />
        <Chip label={`ถึง ${formatDateShort(endDate)}`} selected={picking === "end"} onPress={() => setPicking("end")} />
      </View>
      {picking === "start" ? (
        <CalendarPicker
          value={startDate}
          onChange={(d) => {
            setStartDate(d);
            if (endDate < d) setEndDate(d);
          }}
          min={bkkDateKey()}
        />
      ) : (
        <CalendarPicker value={endDate} onChange={setEndDate} min={startDate} />
      )}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="ตั้งแต่เวลา" value={startTime} onChangeText={setStartTime} keyboardType="numbers-and-punctuation" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="ถึงเวลา" value={endTime} onChangeText={setEndTime} keyboardType="numbers-and-punctuation" />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Chip label="ทุกคลินิก" selected={scope === "all"} onPress={() => setScope("all")} />
        {clinic && <Chip label={`เฉพาะ ${clinic.clinic_name}`} selected={scope === "this"} onPress={() => setScope("this")} />}
      </View>
      <Field label="เหตุผล" value={reason} onChangeText={setReason} placeholder="เช่น ลาพักร้อน ประชุมวิชาการ" />
    </Sheet>
  );
}
