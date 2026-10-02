import { useLocalSearchParams } from "expo-router";
import { BookingForm } from "@/components/BookingForm";

export default function BookScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <BookingForm slug={slug} mode="clinic" />;
}
