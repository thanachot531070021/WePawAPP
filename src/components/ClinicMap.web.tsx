import { MapPinned } from "lucide-react-native";
import type { ClinicListItem } from "@/api/types";
import { EmptyState } from "@/components/ui";

/** react-native-maps ไม่รองรับเว็บ — เวอร์ชันเว็บ (ใช้แค่ทดสอบใน browser) แสดงข้อความแทน */
export function ClinicMap(_props: { clinics: ClinicListItem[]; center: { lat: number; lng: number } | null }) {
  return <EmptyState icon={MapPinned} title="แผนที่ใช้ได้บนมือถือ" body="เปิดในแอปบน Android / iOS เพื่อดูคลินิกบนแผนที่" />;
}
