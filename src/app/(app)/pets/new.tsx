import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ApiError } from "@/api/client";
import { petApi } from "@/api/endpoints";
import { EMPTY_PET, PetForm, toPetInput, type PetFormValue } from "@/components/PetForm";
import { AppBar, Button, Screen, toast } from "@/components/ui";
import { qk } from "@/lib/queryClient";

export default function NewPetScreen() {
  const qc = useQueryClient();
  const [value, setValue] = useState<PetFormValue>(EMPTY_PET);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const m = useMutation({
    mutationFn: () => petApi.create(toPetInput(value)),
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: qk.pets });
      toast.success(`เพิ่มน้อง${value.name}แล้ว`);
      router.replace(`/pets/${r.data.petId}`);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
      toast.error(e.message);
    },
  });

  return (
    <Screen
      header={<AppBar title="เพิ่มสัตว์เลี้ยง" back />}
      footer={
        <Button
          label="บันทึก"
          size="lg"
          full
          loading={m.isPending}
          onPress={() => {
            if (!value.name.trim()) {
              setErrors({ name: "กรุณากรอกชื่อสัตว์เลี้ยง" });
              return;
            }
            setErrors({});
            m.mutate();
          }}
          testID="save-pet"
        />
      }
    >
      <PetForm value={value} onChange={setValue} errors={errors} />
    </Screen>
  );
}
