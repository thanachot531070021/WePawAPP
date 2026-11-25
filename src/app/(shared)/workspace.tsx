import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Building2, ChevronRight, Clock, LogOut, PawPrint, Stethoscope, type LucideIcon } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { meApi, type Workspace } from "@/api/endpoints";
import { BrandMark, Card, ErrorView, LoadingView, Screen, Txt } from "@/components/ui";
import { unregisterPush } from "@/lib/push";
import { areaFor, homeForArea, useSession } from "@/state/session";
import { radius, useColors } from "@/theme";

const KIND: Record<string, { Icon: LucideIcon; bg: string; fg: string }> = {
  personal: { Icon: PawPrint, bg: "#ecfdf5", fg: "#059669" },
  vet: { Icon: Stethoscope, bg: "#ecfeff", fg: "#0891b2" },
  clinic: { Icon: Building2, bg: "#f5f3ff", fg: "#7c3aed" },
};

/**
 * เลือกพื้นที่ใช้งาน — เหมือนหน้า /workspace ของเว็บ (ตัดสินใจ 25 พ.ย. 2026: เข้าสู่ระบบใหม่ถามทุกครั้ง)
 * มีที่เดียว = ไปเลย · เปิดซ้ำได้จากเมนู "สลับพื้นที่ใช้งาน"
 */
export default function WorkspaceScreen() {
  const c = useColors();
  const user = useSession((s) => s.user);
  const current = useSession((s) => s.workspace);
  const setWorkspace = useSession((s) => s.setWorkspace);
  const signOut = useSession((s) => s.signOut);
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["me", "workspaces"],
    queryFn: () => meApi.get(),
  });
  // admin ใช้เว็บอย่างเดียว
  const list = (data?.workspaces ?? []).filter((w) => w.kind !== "admin");

  function choose(w: Workspace) {
    setWorkspace(w.key);
    router.replace(homeForArea(areaFor(user?.role, w.key)));
  }

  // มีพื้นที่เดียว (หรือเซิร์ฟเวอร์รุ่นเก่าไม่ส่งรายการ) → ไปเลยไม่ต้องถาม
  const only = data && list.length <= 1 ? (list[0] ?? null) : undefined;
  useEffect(() => {
    if (only === undefined) return;
    setWorkspace(only?.key ?? null);
    router.replace(homeForArea(areaFor(user?.role, only?.key ?? null)));
  }, [only, setWorkspace, user?.role]);

  if (isLoading || only !== undefined) return <LoadingView />;
  if (error) return <ErrorView message={(error as Error).message} onRetry={refetch} />;

  const firstName = (user?.full_name ?? "").trim().split(/\s+/)[0];

  return (
    <Screen>
      <View style={{ alignItems: "center", gap: 8, paddingTop: 36, paddingBottom: 12 }}>
        <BrandMark size={60} />
        <Txt size={22} weight="bold" align="center">
          {firstName ? `สวัสดี คุณ${firstName}` : "สวัสดี"}
        </Txt>
        <Txt tone="muted" align="center">
          วันนี้จะเข้าใช้งานส่วนไหน
        </Txt>
      </View>

      <View style={{ gap: 10 }}>
        {list.map((w) => {
          const k = KIND[w.kind] ?? KIND.clinic;
          const isCurrent = w.key === current;
          return (
            <Pressable key={w.key} onPress={() => choose(w)} accessibilityRole="button" accessibilityLabel={w.title}>
              {({ pressed }) => (
                <Card
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    borderWidth: 1,
                    borderColor: isCurrent ? c.brand : c.border,
                    opacity: pressed ? 0.85 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: radius.md,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: c.isDark ? c.surfaceAlt : k.bg,
                    }}
                  >
                    <k.Icon size={24} color={k.fg} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt size={16} weight="bold" numberOfLines={1}>
                      {w.title}
                    </Txt>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      {w.pending && <Clock size={13} color={c.warn} />}
                      <Txt size={12.5} tone="muted" numberOfLines={1} style={{ flex: 1 }}>
                        {w.sub}
                      </Txt>
                    </View>
                  </View>
                  <ChevronRight size={20} color={isCurrent ? c.brand : c.textFaint} />
                </Card>
              )}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={async () => {
          await unregisterPush();
          await signOut();
        }}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 24 }}
      >
        <LogOut size={16} color={c.textMuted} />
        <Txt size={13} tone="muted" weight="semibold">
          ไม่ใช่บัญชีของคุณ? ออกจากระบบ
        </Txt>
      </Pressable>
    </Screen>
  );
}
