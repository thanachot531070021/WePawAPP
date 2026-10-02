import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useState } from "react";
import { ApiError } from "@/api/client";
import { petApi } from "@/api/endpoints";
import { PetForm, toPetInput, type PetFormValue } from "@/components/PetForm";
import { AppBar, Button, confirmAsync, ErrorView, LoadingView, Screen, toast } from "@/components/ui";
import { usePet } from "@/features/queries";
import type { PetDetail } from "@/api/types";
import { qk } from "@/lib/queryClient";

function fromPet(p: PetDetail["pet"]): PetFormValue {
  return {
    name: p.name,
    species: p.species,
    breed: p.breed ?? "",
    gender: (p.gender as PetFormValue["gender"]) ?? "unknown",
    birth_date: p.birth_date,
    weight_kg: p.weight_kg ? String(Number(p.weight_kg)) : "",
    color: p.color ?? "",
    distinctive_marks: p.distinctive_marks ?? "",
    is_neutered: !!p.is_neutered,
    microchip_id: p.microchip_id ?? "",
    allergies: p.allergies ?? "",
    avatar_url: p.avatar_url || null,
  };
}

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = usePet(id);
  if (isLoading) return <LoadingView />;
  if (error || !data) return <ErrorView message={(error as Error)?.message ?? "ไม่พบสัตว์เลี้ยง"} />;
  return <EditPetForm id={id} data={data} />;
}

/** ฟอร์มเริ่มจากข้อมูลล่าสุดตอนเปิดหน้า (ไม่ sync ทับระหว่างผู้ใช้กำลังแก้) */
function EditPetForm({ id, data }: { id: string; data: PetDetail }) {
  const qc = useQueryClient();
  const [value, setValue] = useState<PetFormValue>(() => fromPet(data.pet));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: () => petApi.update(id, toPetInput(value)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.pets });
      toast.success("บันทึกแล้ว");
      router.back();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
      toast.error(e.message);
    },
  });

  const remove = useMutation({
    mutationFn: () => petApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.pets });
      toast.success("ลบสัตว์เลี้ยงแล้ว");
      router.navigate("/pets");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isOwner = data.access_role === "owner";

  return (
    <Screen
      header={<AppBar title={`แก้ไขข้อมูล${data.pet.name}`} back />}
      footer={<Button label="บันทึก" size="lg" full loading={save.isPending} onPress={() => save.mutate()} />}
    >
      <PetForm value={value} onChange={setValue} errors={errors} petId={id} />
      {isOwner && (
        <Button
          label="ลบสัตว์เลี้ยง"
          icon={Trash2}
          variant="dangerOutline"
          full
          loading={remove.isPending}
          onPress={async () => {
            if (await confirmAsync(`ลบ${data.pet.name}?`, "ประวัติทั้งหมดของน้องจะหายจากบัญชีของคุณ", "ลบ")) remove.mutate();
          }}
        />
      )}
    </Screen>
  );
}
