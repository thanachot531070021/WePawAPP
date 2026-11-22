import { useMutation } from "@tanstack/react-query";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { Camera, Check, Clock, FolderOpen, Lock, ScanLine, Search, Send } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import { clinicStaffApi } from "@/api/staffEndpoints";
import type { ClinicPetScan } from "@/api/staffTypes";
import { AppBar, Button, Card, Field, Notice, PetAvatar, Screen, toast, Txt } from "@/components/ui";
import { SPECIES_LABEL, type PetSpecies } from "@/shared/species";
import { radius, useColors } from "@/theme";

/** หลังส่งคำขอ ตรวจซ้ำทุก 5 วิ นานสุด 5 นาที (เจ้าของมักยืนอยู่หน้าเคาน์เตอร์) */
const POLL_MS = 5000;
const POLL_MAX = 60;
const POLL_FAST = 12;

/**
 * สแกน QR ประจำตัวน้อง (ป้ายห้อยคอ/ในแอปเจ้าของ) — กติกาเดียวกับหน้า "ข้อมูลสัตว์เลี้ยง" ของเว็บ
 * เปิดแฟ้มแล้ว → เปิดเลย · เคยมีนัด/บิล → เพิ่มเข้าคลินิก · ยังไม่เคยมา → ขออนุญาตจากเจ้าของ
 */
export default function ScanPetScreen() {
  const c = useColors();
  const [perm, requestPerm] = useCameraPermissions();
  const [camera, setCamera] = useState(false);
  const [manual, setManual] = useState("");
  const [scan, setScan] = useState<ClinicPetScan | null>(null);
  const [requested, setRequested] = useState(false);
  const codeRef = useRef("");
  const busyRef = useRef(false);

  const preview = useMutation({
    mutationFn: (code: string) => clinicStaffApi.petScan(code),
    onSuccess: (r) => {
      setScan(r.data);
      setRequested(false);
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => {
      busyRef.current = false;
    },
  });
  const link = useMutation({
    mutationFn: (petId: string) => clinicStaffApi.petScanLink(petId),
    onSuccess: (r) => router.replace(`/clinic-admin/patients/${r.data.petId}`),
    onError: (e: Error) => toast.error(e.message),
  });
  const ask = useMutation({
    mutationFn: (petId: string) => clinicStaffApi.petScanRequest(petId),
    onSuccess: () => {
      setRequested(true);
      toast.success("ส่งคำขอถึงเจ้าของแล้ว");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // รอเจ้าของกดอนุญาต → ตรวจซ้ำเงียบ ๆ
  useEffect(() => {
    if (!requested || scan?.access !== "needs_consent") return;
    let n = 0;
    const t = setInterval(async () => {
      n += 1;
      if (n > POLL_MAX) return clearInterval(t);
      // ประหยัด: นาทีแรกถามทุก 5 วิ หลังจากนั้นทุก 15 วิ · แอปอยู่เบื้องหลังไม่ถาม
      if ((n > POLL_FAST && n % 3 !== 0) || AppState.currentState !== "active") return;
      const r = await clinicStaffApi.petScan(codeRef.current).catch(() => null);
      if (r?.data && r.data.access !== "needs_consent") {
        clearInterval(t);
        setScan(r.data);
        setRequested(false);
        toast.success("เจ้าของอนุญาตแล้ว");
      }
    }, POLL_MS);
    return () => clearInterval(t);
  }, [requested, scan?.access]);

  function check(raw: string) {
    const code = raw.trim();
    if (!code || busyRef.current) return;
    busyRef.current = true;
    codeRef.current = code;
    setCamera(false);
    setScan(null);
    preview.mutate(code);
  }

  async function openCamera() {
    if (!perm?.granted) {
      const r = await requestPerm();
      if (!r.granted) {
        toast.error("ต้องอนุญาตให้ใช้กล้องก่อน");
        return;
      }
    }
    setScan(null);
    setCamera(true);
  }

  const needsConsent = scan?.access === "needs_consent";
  const species = scan?.species ? (SPECIES_LABEL[scan.species as PetSpecies] ?? scan.species) : null;

  return (
    <Screen header={<AppBar title="สแกน QR น้อง" subtitle="QR ให้คลินิก · รหัส 6 หลัก · QR ประจำตัว" back />}>
      {camera ? (
        <View style={{ borderRadius: radius.lg, overflow: "hidden", aspectRatio: 1, backgroundColor: "#000" }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={(e) => check(e.data)}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: "18%",
              left: "18%",
              right: "18%",
              bottom: "18%",
              borderWidth: 3,
              borderColor: "rgba(255,255,255,0.85)",
              borderRadius: 20,
            }}
          />
        </View>
      ) : (
        <Button label="สแกนด้วยกล้อง" icon={Camera} size="lg" full onPress={openCamera} />
      )}
      {camera && <Button label="ปิดกล้อง" variant="ghost" onPress={() => setCamera(false)} />}

      <Card style={{ gap: 10 }}>
        <Field
          label="หรือพิมพ์รหัส 6 หลัก / วางลิงก์ QR"
          value={manual}
          onChangeText={setManual}
          placeholder="เช่น 482 913"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button label="ตรวจ" icon={Search} variant="outline" loading={preview.isPending} onPress={() => check(manual)} />
      </Card>

      {scan && (
        <Card style={{ gap: 12, borderWidth: 1, borderColor: needsConsent ? c.warn : c.brand }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <PetAvatar species={scan.species} seed={scan.pet_id} url={scan.avatar_url} size={52} radius={16} />
            <View style={{ flex: 1 }}>
              <Txt size={16} weight="bold">
                {scan.pet_name}
              </Txt>
              <Txt size={13} tone="muted">
                {[species, scan.breed].filter(Boolean).join(" · ") || "ไม่ระบุชนิด"}
              </Txt>
            </View>
          </View>
          <View style={{ backgroundColor: c.surfaceAlt, borderRadius: radius.md, padding: 10, gap: 4 }}>
            <Txt size={13}>
              เจ้าของ: {scan.owner_name ? (needsConsent ? `คุณ${scan.owner_name}` : scan.owner_name) : "-"}
              {scan.owner_phone ? ` · ${scan.owner_phone}` : ""}
            </Txt>
            {scan.owner_email && (
              <Txt size={12.5} tone="muted">
                {scan.owner_email}
              </Txt>
            )}
            {scan.member_code && (
              <Txt size={12.5} weight="semibold" tone="brand">
                สมาชิกในร้าน: {scan.member_code}
              </Txt>
            )}
          </View>

          {scan.access === "linked" ? (
            <Button label="เปิดแฟ้ม" icon={FolderOpen} full onPress={() => router.replace(`/clinic-admin/patients/${scan.pet_id}`)} />
          ) : scan.access === "related" ? (
            <>
              <Txt size={13} tone="muted">
                น้องเคยมีนัด/บิลกับคลินิกนี้ เพิ่มเข้าแฟ้มคลินิกได้เลย
              </Txt>
              <Button label="เพิ่มเข้าคลินิก" icon={Check} full loading={link.isPending} onPress={() => link.mutate(scan.pet_id)} />
            </>
          ) : (
            <>
              <Notice tone="warn" icon={Lock}>
                น้องยังไม่เคยมาคลินิกนี้ — ให้เจ้าของเปิด “QR ให้คลินิก” ในแอปแล้วสแกนอีกครั้ง (เปิดแฟ้มได้ทันที) หรือถามชื่อ/เบอร์ 4 ตัวท้ายให้ตรงกันแล้วขออนุญาตจากเจ้าของ
              </Notice>
              {requested && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Clock size={16} color={c.warn} />
                  <Txt size={13} tone="muted" style={{ flex: 1 }}>
                    รอเจ้าของกดอนุญาต… หน้านี้อัปเดตเองเมื่ออนุญาตแล้ว
                  </Txt>
                </View>
              )}
              <Button
                label={requested ? "ส่งคำขออีกครั้ง" : "ขออนุญาตจากเจ้าของ"}
                icon={Send}
                full
                variant={requested ? "outline" : undefined}
                loading={ask.isPending}
                onPress={() => ask.mutate(scan.pet_id)}
              />
            </>
          )}
          <Button
            label="สแกนตัวอื่น"
            icon={ScanLine}
            variant="ghost"
            onPress={() => {
              setScan(null);
              setRequested(false);
              setManual("");
            }}
          />
        </Card>
      )}
    </Screen>
  );
}
