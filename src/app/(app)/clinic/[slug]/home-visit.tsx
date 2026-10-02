import { useLocalSearchParams } from "expo-router";
import { BookingForm } from "@/components/BookingForm";

export default function HomeVisitScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <BookingForm slug={slug} mode="home" />;
}
