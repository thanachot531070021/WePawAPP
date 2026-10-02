import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { reviewApi } from "@/api/endpoints";
import { ReviewForm } from "@/components/ReviewForm";
import { AppBar, Chip, LoadingView, Screen, SectionTitle, toast } from "@/components/ui";
import { useClinic, usePets } from "@/features/queries";
import { qk } from "@/lib/queryClient";

/** เขียนรีวิวคลินิก — createReview() ของเว็บ (1 รีวิวทั่วไปต่อคลินิก) */
export default function ClinicReviewScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const qc = useQueryClient();
  const clinic = useClinic(slug);
  const pets = usePets();
  const [petId, setPetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: (args: { input: Parameters<typeof reviewApi.create>[0] }) => reviewApi.create(args.input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.clinic(slug) });
      toast.success("ขอบคุณสำหรับรีวิว");
      router.back();
    },
    onError: (e: Error) => setError(e.message),
  });

  if (clinic.isLoading) return <LoadingView />;
  const ownPets = (pets.data ?? []).filter((p) => p.my_role === "owner");

  return (
    <Screen header={<AppBar title="เขียนรีวิว" subtitle={clinic.data?.clinic.name} back />}>
      {ownPets.length > 0 && (
        <>
          <SectionTitle>รีวิวในนามน้อง (ไม่บังคับ)</SectionTitle>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {ownPets.map((p) => (
              <Chip key={p.id} label={p.name} selected={petId === p.id} onPress={() => setPetId(petId === p.id ? null : p.id)} />
            ))}
          </View>
        </>
      )}
      <ReviewForm
        allowImages
        submitting={m.isPending}
        error={error}
        onSubmit={(input, image_urls) =>
          m.mutate({ input: { ...input, clinic_id: clinic.data!.clinic.id, pet_id: petId, image_urls } })
        }
      />
    </Screen>
  );
}
