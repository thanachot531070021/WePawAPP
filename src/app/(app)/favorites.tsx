import { router } from "expo-router";
import { Heart, Search } from "lucide-react-native";
import { ClinicCard } from "@/components/ClinicCard";
import { AppBar, Button, EmptyState, ErrorView, LoadingView, Screen } from "@/components/ui";
import { useFavorites } from "@/features/queries";

/** คลินิกที่บันทึกไว้ — = แท็บบันทึกไว้ของเว็บ */
export default function FavoritesScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useFavorites();
  return (
    <Screen header={<AppBar title="คลินิกที่บันทึกไว้" back />} refreshing={isRefetching} onRefresh={refetch}>
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={(error as Error).message} onRetry={refetch} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={Heart}
          title="ยังไม่ได้บันทึกคลินิก"
          body="กดหัวใจที่การ์ดคลินิกเพื่อเก็บไว้ดูภายหลัง"
          action={<Button label="ค้นหาคลินิก" icon={Search} full onPress={() => router.navigate("/")} />}
        />
      ) : (
        data!.map((c) => <ClinicCard key={c.id} clinic={c} favorited />)
      )}
    </Screen>
  );
}
