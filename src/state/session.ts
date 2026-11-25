import { create } from "zustand";
import { configureApi } from "@/api/client";
import { API_BASE_URL } from "@/api/config";
import { authApi, type AuthResult } from "@/api/endpoints";
import type { User } from "@/api/types";
import { storage } from "@/lib/storage";
import { queryClient } from "@/lib/queryClient";

const TOKEN_KEY = "wepaw.token";
const USER_KEY = "wepaw.user";
const VET_CLINIC_KEY = "wepaw.vetClinic";
const WORKSPACE_KEY = "wepaw.workspace";

/** role ที่แอปรองรับ — super_admin ใช้เว็บอย่างเดียว (server ปฏิเสธที่ login อยู่แล้ว) */
export type AppRole = "pet_owner" | "clinic_admin" | "vet";
export const APP_ROLES: AppRole[] = ["pet_owner", "clinic_admin", "vet"];

/** หน้าแรกของแต่ละ role — เส้นทางเดียวกับเว็บ (/clinic-admin, /vet) */
export function homeFor(role: string | undefined): "/" | "/clinic-admin" | "/vet" {
  if (role === "clinic_admin") return "/clinic-admin";
  if (role === "vet") return "/vet";
  return "/";
}

/**
 * พื้นที่ใช้งาน — 1 บัญชีเข้าได้หลายที่ (น้องของฉัน / ฝั่งหมอ / หลังบ้านคลินิกแต่ละแห่ง) เหมือน /workspace ของเว็บ
 * workspace: "personal" | "vet" | "clinic:<id>" | "clinic-signup" | null (= ตาม role เดิม)
 */
export type Area = "app" | "clinic" | "vet";
export function areaFor(role: string | undefined, workspace: string | null): Area {
  if (workspace?.startsWith("clinic")) return "clinic";
  if (workspace === "vet") return "vet";
  if (workspace === "personal") return "app";
  if (role === "clinic_admin") return "clinic";
  if (role === "vet") return "vet";
  return "app";
}
export function homeForArea(area: Area): "/" | "/clinic-admin" | "/vet" {
  return area === "clinic" ? "/clinic-admin" : area === "vet" ? "/vet" : "/";
}
/** คลินิกที่เลือก → header x-clinic-id (server ตรวจว่าเป็นสมาชิกจริงทุก request) */
export function clinicIdOf(workspace: string | null): string | null {
  return workspace?.startsWith("clinic:") ? workspace.slice(7) : null;
}

type Status = "loading" | "signedOut" | "signedIn";

interface SessionState {
  status: Status;
  token: string | null;
  user: User | null;
  /** โหลด token จากเครื่อง แล้วต่ออายุกับ server (sliding 7 วัน) */
  bootstrap: () => Promise<void>;
  /** เข้าสู่ระบบใหม่ → ถามพื้นที่ใช้งานก่อน (ถ้ามีหลายที่) · ต่ออายุ token ไม่ถามซ้ำ */
  signIn: (result: AuthResult, opts?: { keepWorkspace?: boolean }) => Promise<void>;
  workspace: string | null;
  /** true = เพิ่งเข้าสู่ระบบ ต้องเลือกพื้นที่ใช้งานก่อน (หน้า /workspace) */
  choosingWorkspace: boolean;
  setWorkspace: (key: string | null) => void;
  /** เปิดหน้าเลือกพื้นที่ใช้งาน (เมนู "สลับพื้นที่ใช้งาน") */
  askWorkspace: () => void;
  signOut: () => Promise<void>;
  setUser: (user: User) => void;
  /** คลินิกที่หมอเลือก (หมอสังกัดหลายคลินิก) — ส่งเป็น header x-vet-clinic แทน cookie ของเว็บ */
  vetClinicId: string | null;
  setVetClinic: (clinicId: string | null) => void;
}

export const UNSUPPORTED_ROLE_MESSAGE = "บัญชีผู้ดูแลระบบใช้งานผ่านเว็บเท่านั้น";

export const useSession = create<SessionState>((set, get) => ({
  status: "loading",
  token: null,
  user: null,
  vetClinicId: null,
  workspace: null,
  choosingWorkspace: false,

  bootstrap: async () => {
    const token = await storage.get(TOKEN_KEY);
    const cachedUser = await storage.get(USER_KEY);
    set({ vetClinicId: await storage.get(VET_CLINIC_KEY), workspace: await storage.get(WORKSPACE_KEY) });
    if (!token) {
      set({ status: "signedOut" });
      return;
    }
    // แสดงแอปด้วยข้อมูลที่จำไว้ก่อน แล้วค่อยต่ออายุเบื้องหลัง — เปิดแอปตอนเน็ตช้าก็ไม่ค้างที่ splash
    set({
      token,
      user: cachedUser ? (JSON.parse(cachedUser) as User) : null,
      status: "signedIn",
    });
    try {
      const fresh = await authApi.refresh();
      await get().signIn(fresh, { keepWorkspace: true });
    } catch {
      // 401 → client เรียก signOut ให้แล้ว · เน็ตหลุด → ใช้ token เดิมต่อ
    }
  },

  signIn: async (result, opts) => {
    await storage.set(TOKEN_KEY, result.token);
    await storage.set(USER_KEY, JSON.stringify(result.user));
    if (opts?.keepWorkspace) {
      set({ token: result.token, user: result.user, status: "signedIn" });
      return;
    }
    // เข้าสู่ระบบใหม่ทุกครั้ง: ลืมพื้นที่เดิม แล้วถามใหม่ (มีที่เดียว หน้า /workspace พาไปเอง)
    await storage.remove(WORKSPACE_KEY);
    queryClient.clear();
    set({ token: result.token, user: result.user, status: "signedIn", workspace: null, choosingWorkspace: true });
  },

  setWorkspace: (key) => {
    if (key) void storage.set(WORKSPACE_KEY, key);
    else void storage.remove(WORKSPACE_KEY);
    // ข้อมูลผูกกับพื้นที่ (คลินิกคนละแห่ง / ฝั่งเจ้าของ) — ล้าง cache ทั้งชุด
    queryClient.clear();
    set({ workspace: key, choosingWorkspace: false });
  },

  askWorkspace: () => set({ choosingWorkspace: true }),

  signOut: async () => {
    await storage.remove(TOKEN_KEY);
    await storage.remove(USER_KEY);
    await storage.remove(VET_CLINIC_KEY);
    await storage.remove(WORKSPACE_KEY);
    queryClient.clear();
    set({ token: null, user: null, status: "signedOut", vetClinicId: null, workspace: null, choosingWorkspace: false });
  },

  setVetClinic: (clinicId) => {
    if (clinicId) void storage.set(VET_CLINIC_KEY, clinicId);
    else void storage.remove(VET_CLINIC_KEY);
    set({ vetClinicId: clinicId });
    // ข้อมูลของหมอผูกกับคลินิกที่เลือก — โหลดใหม่ทั้งชุด
    void queryClient.invalidateQueries({ queryKey: ["vet"] });
  },

  setUser: (user) => {
    void storage.set(USER_KEY, JSON.stringify(user));
    set({ user });
  },
}));

/**
 * 401 จาก route ใด route หนึ่งไม่ได้แปลว่า token หมดอายุเสมอ — route เดิมของเว็บที่ยังอ่านแค่ cookie
 * (backend เวอร์ชันเก่า) ก็ตอบ 401 → ถามซ้ำที่ /api/mobile/me ก่อน ถ้าตรงนั้น 401 ด้วยจึงออกจากระบบ
 */
let verifying = false;
async function verifyThenSignOut() {
  if (verifying || useSession.getState().status !== "signedIn") return;
  verifying = true;
  try {
    const token = useSession.getState().token;
    const res = await fetch(`${API_BASE_URL}/api/mobile/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) await useSession.getState().signOut();
  } catch {
    // เน็ตหลุด — ยังไม่ออกจากระบบ
  } finally {
    verifying = false;
  }
}

configureApi({
  getToken: () => useSession.getState().token,
  onUnauthorized: () => void verifyThenSignOut(),
  getExtraHeaders: (): Record<string, string> => {
    const { user, vetClinicId, workspace } = useSession.getState();
    const h: Record<string, string> = {};
    if (user?.role === "vet" && vetClinicId) h["x-vet-clinic"] = vetClinicId;
    // พื้นที่คลินิกที่เลือก — route clinic/*, แชท, นัด ใช้คลินิกนี้ (พนักงาน/หมอ/เจ้าของหลายคลินิก)
    const clinicId = clinicIdOf(workspace);
    if (clinicId) h["x-clinic-id"] = clinicId;
    return h;
  },
});
