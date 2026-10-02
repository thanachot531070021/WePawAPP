import { API_BASE_URL } from "./config";

/**
 * fetch wrapper ของ petcare API
 * - แนบ `Authorization: Bearer <jwt>` อัตโนมัติ
 * - 401 → แจ้ง session ให้ออกจากระบบ (token หมดอายุ/บัญชีถูกปิด)
 * - error ของ route ที่ห่อ server action มาเป็น `{ error, fieldErrors }`
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string> | null = null
  ) {
    super(message);
  }
}

type TokenGetter = () => string | null;
type UnauthorizedHandler = () => void;

let getToken: TokenGetter = () => null;
let onUnauthorized: UnauthorizedHandler = () => {};

export function configureApi(opts: { getToken: TokenGetter; onUnauthorized: UnauthorizedHandler }) {
  getToken = opts.getToken;
  onUnauthorized = opts.onUnauthorized;
}

/** ข้อความ error จาก server เป็นรหัส (เช่น "forbidden") → แปลงเป็นภาษาไทยที่ผู้ใช้อ่านเข้าใจ */
const ERROR_TEXT: Record<string, string> = {
  unauthorized: "กรุณาเข้าสู่ระบบอีกครั้ง",
  unauthenticated: "กรุณาเข้าสู่ระบบอีกครั้ง",
  forbidden: "คุณไม่มีสิทธิ์ทำรายการนี้",
  not_found: "ไม่พบข้อมูล",
  "not found": "ไม่พบข้อมูล",
  invalid_input: "ข้อมูลไม่ถูกต้อง",
  invalid_type: "รองรับเฉพาะไฟล์รูปภาพ",
  file_too_large: "ไฟล์ใหญ่เกินไป",
  upload_failed: "อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง",
  storage_not_configured: "ระบบไฟล์ยังไม่พร้อมใช้งาน",
  thread_closed: "ห้องแชทนี้ปิดแล้ว",
  read_only: "ห้องนี้อ่านได้อย่างเดียว",
  empty_message: "พิมพ์ข้อความก่อนส่ง",
};

function readableError(raw: unknown, status: number): string {
  if (typeof raw === "string" && raw) return ERROR_TEXT[raw] ?? raw;
  if (status >= 500) return "เซิร์ฟเวอร์ขัดข้อง ลองใหม่อีกครั้ง";
  return "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง";
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  form?: FormData;
  query?: Record<string, string | number | boolean | string[] | null | undefined>;
  /** ไม่ต้องแนบ token (login / signup) */
  anonymous?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const qs: string[] = [];
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === null || v === undefined || v === "") continue;
    const values = Array.isArray(v) ? v : [v];
    for (const one of values) qs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(one))}`);
  }
  return `${API_BASE_URL}${path}${qs.length ? `?${qs.join("&")}` : ""}`;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = opts.anonymous ? null : getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? (body ? "POST" : "GET"),
      headers,
      body,
      signal: opts.signal,
    });
  } catch {
    throw new ApiError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่", 0);
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const err = (json ?? {}) as { error?: string; fieldErrors?: Record<string, string> | null };
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(readableError(err.error, res.status), res.status, err.fieldErrors ?? null);
  }
  // route ที่ server ยังไม่มี Next ตอบเป็นหน้า HTML (บางครั้งสถานะ 200) — อย่าถือว่าเป็นข้อมูล
  if (text && json === null) {
    throw new ApiError("ฟีเจอร์นี้ยังไม่เปิดบนเซิร์ฟเวอร์ — อัปเดตระบบหลังบ้านก่อน", 404);
  }
  return json as T;
}
