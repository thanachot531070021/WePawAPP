import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { CircleCheckBig, ImagePlus, Lock, SendHorizontal } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { absoluteUrl } from "@/api/config";
import { chatApi, uploadApi } from "@/api/endpoints";
import { caseApi } from "@/api/staffEndpoints";
import type { ChatMessage } from "@/api/types";
import { AppBar, confirmAsync, ErrorView, IconButton, LoadingView, toast, Txt } from "@/components/ui";
import { formatDateShort, formatTime } from "@/lib/format";
import { pickImageWithChoice } from "@/lib/images";
import { qk } from "@/lib/queryClient";
import { font, radius, useColors } from "@/theme";

type Row = ChatMessage | { divider: string; id: string };

const ROLE_NAME: Record<string, string> = { owner: "เจ้าของสัตว์", clinic: "คลินิก", vet: "คุณหมอ" };

function Bubble({ m, myRole }: { m: ChatMessage; myRole: string }) {
  const c = useColors();
  if (m.sender_role === "system") {
    return (
      <View style={{ alignSelf: "center", maxWidth: "88%", padding: 10, borderRadius: radius.md, backgroundColor: c.surfaceAlt, marginVertical: 6 }}>
        <Txt size={12.5} tone="muted" align="center">
          {m.body}
        </Txt>
      </View>
    );
  }
  // ข้อความของฉัน = ผู้ส่ง role เดียวกับฉันในห้องนี้ (my_role จาก server)
  const mine = m.sender_role === myRole;
  return (
    <View style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "80%", marginVertical: 3, gap: 2 }}>
      {!mine && (
        <Txt size={11.5} tone="faint" style={{ marginLeft: 6 }}>
          {m.sender_name ?? ROLE_NAME[m.sender_role]}
        </Txt>
      )}
      {m.attachments.map((a) =>
        a.type.startsWith("image/") ? (
          <Pressable key={a.url} onPress={() => Linking.openURL(absoluteUrl(a.url)!)}>
            <Image source={{ uri: absoluteUrl(a.url)! }} style={{ width: 200, height: 200, borderRadius: radius.lg }} contentFit="cover" />
          </Pressable>
        ) : (
          <Txt key={a.url} tone="brand" onPress={() => Linking.openURL(absoluteUrl(a.url)!)}>
            📎 {a.name}
          </Txt>
        )
      )}
      {!!m.body && (
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 18,
            borderBottomRightRadius: mine ? 6 : 18,
            borderBottomLeftRadius: mine ? 18 : 6,
            backgroundColor: mine ? c.brandSolid : c.surface,
            borderWidth: mine ? 0 : 1,
            borderColor: c.border,
          }}
        >
          <Txt size={15} color={mine ? "#fff" : c.text}>
            {m.body}
          </Txt>
        </View>
      )}
      <Txt size={10.5} tone="faint" align={mine ? "right" : "left"} style={{ marginHorizontal: 6 }}>
        {formatTime(m.created_at)}
      </Txt>
    </View>
  );
}

/** ห้องแชท — ข้อความ/รูป, ดึงใหม่ทุก 5 วิ, อ่านแล้วเคลียร์ badge (สิทธิ์ส่งตัดสินที่ server) */
export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const listRef = useRef<FlatList<Row>>(null);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);

  const q = useQuery({ queryKey: qk.chatMessages(id), queryFn: () => chatApi.messages(id), refetchInterval: 5000 });
  const count = q.data?.messages.length ?? 0;

  useEffect(() => {
    if (!count) return;
    void chatApi.read(id).then(() => {
      void qc.invalidateQueries({ queryKey: qk.chatUnread });
      void qc.invalidateQueries({ queryKey: qk.chatThreads });
    });
  }, [count, id, qc]);

  const send = useMutation({
    mutationFn: (body: Parameters<typeof chatApi.send>[1]) => chatApi.send(id, body),
    onSuccess: () => {
      setText("");
      void qc.invalidateQueries({ queryKey: qk.chatMessages(id) });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // หมอปิดห้องแชทเคส (กติกาเดียวกับเว็บ: ปิดแล้วทุกฝั่งส่งไม่ได้)
  const close = useMutation({
    mutationFn: () => caseApi.closeThread(id),
    onSuccess: () => {
      toast.success("ปิดเคสแล้ว");
      void qc.invalidateQueries({ queryKey: qk.chatMessages(id) });
      void qc.invalidateQueries({ queryKey: qk.chatThreads });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function attach() {
    const file = await pickImageWithChoice();
    if (!file) return;
    setUploading(true);
    try {
      const { attachment } = await uploadApi.chat(file);
      send.mutate({ attachments: [attachment] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  if (q.isLoading) return <LoadingView />;
  if (q.error || !q.data)
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <AppBar title="ข้อความ" back />
        <ErrorView message={(q.error as Error)?.message ?? "เปิดห้องแชทไม่ได้"} onRetry={q.refetch} />
      </View>
    );

  const { messages, thread, can_post, my_role } = q.data;
  const title = thread.subject ?? (my_role === "owner" ? "แชทกับคลินิก" : "แชทกับเจ้าของสัตว์");
  const canClose = my_role === "vet" && thread.kind === "case" && thread.status === "open";
  // แสดงวันที่คั่นเมื่อเปลี่ยนวัน
  const rows: Row[] = [];
  let lastDay = "";
  for (const m of messages) {
    const day = formatDateShort(m.created_at);
    if (day !== lastDay) {
      rows.push({ divider: day, id: `d-${day}` });
      lastDay = day;
    }
    rows.push(m);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <AppBar
        title={title}
        subtitle={thread.kind === "case" ? "แชทเคส · คุณหมอและคลินิกตอบร่วมกัน" : null}
        back
        right={
          canClose ? (
            <IconButton
              icon={CircleCheckBig}
              label="ปิดเคส"
              color={c.brand}
              onPress={async () => {
                if (await confirmAsync("ปิดห้องแชทเคสนี้?", "ปิดแล้วทุกฝั่งจะส่งข้อความไม่ได้อีก", "ปิดเคส", false)) close.mutate();
              }}
            />
          ) : undefined
        }
      />
      <FlatList
        ref={listRef}
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 12, gap: 2 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) =>
          "divider" in item ? (
            <Txt size={11.5} tone="faint" align="center" style={{ marginVertical: 8 }}>
              {item.divider}
            </Txt>
          ) : (
            <Bubble m={item} myRole={my_role} />
          )
        }
      />
      {can_post ? (
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
          <Pressable onPress={attach} disabled={uploading} hitSlop={6} style={{ padding: 8 }} accessibilityLabel="แนบรูป">
            <ImagePlus size={24} color={uploading ? c.textFaint : c.textMuted} />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="พิมพ์ข้อความ…"
            placeholderTextColor={c.textFaint}
            multiline
            maxLength={4000}
            style={{
              flex: 1,
              maxHeight: 120,
              minHeight: 42,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 21,
              backgroundColor: c.surfaceAlt,
              fontFamily: font.regular,
              fontSize: 15.5,
              color: c.text,
            }}
          />
          <Pressable
            onPress={() => text.trim() && send.mutate({ body: text.trim() })}
            disabled={!text.trim() || send.isPending}
            accessibilityLabel="ส่ง"
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: text.trim() ? c.brandSolid : c.surfaceAlt,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SendHorizontal size={20} color={text.trim() ? "#fff" : c.textFaint} />
          </Pressable>
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", padding: 14, paddingBottom: Math.max(insets.bottom, 14), backgroundColor: c.surfaceAlt }}>
          <Lock size={16} color={c.textMuted} />
          <Txt size={13.5} tone="muted">
            {thread.status === "closed" ? "ห้องนี้ปิดแล้ว" : "ห้องนี้อ่านได้อย่างเดียว"}
          </Txt>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
