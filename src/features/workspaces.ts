import { useQuery } from "@tanstack/react-query";
import { meApi } from "@/api/endpoints";

/** บัญชีนี้มีพื้นที่ใช้งานมากกว่า 1 ที่ไหม (เช่น เจ้าของสัตว์ที่เป็นพนักงานคลินิกด้วย) — โชว์เมนู "สลับพื้นที่ใช้งาน" */
export function useHasManyWorkspaces(): boolean {
  const { data } = useQuery({
    queryKey: ["me", "workspaces"],
    queryFn: () => meApi.get(),
    staleTime: 5 * 60_000,
  });
  return (data?.workspaces ?? []).filter((w) => w.kind !== "admin").length > 1;
}
