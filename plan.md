# WePawAPP — แอปมือถือ PetCare: เจ้าของสัตว์ · สัตวแพทย์ · คลินิก (Android + iOS)

> สถานะ: **ทำ Phase 0–3 + ส่วนใหญ่ของ Phase 4 แล้ว ทดสอบผ่าน — เหลือ social login และงานที่ต้องมีบัญชี/คีย์ของ store** · อัปเดต 2 ต.ค. 2026 · ดูข้อ S
> ระบบแม่: `C:\web_source\petcare` (Next.js 16 + Supabase Postgres + JWT) — WePawAPP เป็น **หน้าบ้านอีกช่องทางหนึ่ง** ของระบบนั้น ไม่มี DB ของตัวเอง
> ขอบเขต: role `pet_owner` (ครบ) + `vet` และ `clinic_admin` (งานประจำวัน — ดูข้อ S.R, เพิ่ม 3 ต.ค. 2026) · POS / สต็อก / สมาชิก / รายงาน / super_admin ยังใช้เว็บ

---

## S.R Role หมอ + คลินิก (3 ต.ค. 2026)

กติกาสิทธิ์ทั้งหมดตามเว็บ — route ฝั่ง petcare เรียก server action / helper ตัวเดิม (`requireClinicAdmin`, `requireVet`, `lib/clinic/visibility.ts`)

| | หมอ (`vet`) | คลินิก (`clinic_admin`) |
|---|---|---|
| กลุ่มหน้า | `src/app/(vet)/vet/*` แท็บ วันนี้ · ตาราง · แชท · ฉัน | `src/app/(clinic)/clinic-admin/*` แท็บ หน้าหลัก · นัด · แชท · จัดการ |
| เข้าได้เมื่อ | เปลี่ยนรหัสชั่วคราวแล้ว (`must_change_password` → บังคับตั้งใหม่ในแอป) + `vets.account_status = active` | มีคลินิก (ล่าสุดตาม `created_at`) และอนุมัติแล้ว — pending แสดงหน้ารอ, ไม่มีคลินิกพาไปสมัครบนเว็บ |
| ทำอะไรได้ | งานวันนี้ (เริ่มตรวจ / จบเคส + เวชระเบียน / ปิดเคสค้าง), ตารางสัปดาห์, แฟ้มน้องที่มีนัดในคลินิกที่สังกัด, แชทเคส (เปิด/ปิด), ตอบรับ/ปฏิเสธคำเชิญคลินิก, สลับคลินิก (header `x-vet-clinic`), เวลาทำงาน + วันลา, แก้โปรไฟล์/รูป | ภาพรวม + สถิติ, เคสวันนี้ (น้องมาถึง / ไม่มาตามนัด), คำขอจอง (รับ / ปฏิเสธ / ยกเลิก / ยืนยันหมอเยี่ยมบ้าน / ลงเวลาตอนน้องมาถึง), แฟ้มน้อง (กรองตามกติกา visibility), รีวิว + ตอบ, บริการ + ราคา, ข้อมูลคลินิก, อนุมัติ/ถอดหมอ, แชท |
| ไม่ทำในแอป | — | POS, สต็อก, สมาชิก, รายงาน, เพิ่มหมอใหม่ (มีลิงก์ไปเว็บ) |

- **เมนูหมอมีแค่ของหมอ** — บัญชีหมอไม่เห็นเมนูจัดการคลินิก
- **คลินิกที่มีหมอคนเดียว** (`vet_clinics.link_status = 'active'` และ `vets.is_active` เหลือ 1 คน — `loadSoloVet()` ใน `petcare/lib/mobile/staff.ts`) → บัญชีคลินิกได้ปุ่ม **เริ่มตรวจ / จบเคส** ที่แท็บนัดด้วย (หมอใช้ไอดีร้านร่วม) · ถ้ามีหมอ ≥ 2 คน ปุ่มนี้หายไป
- เวชระเบียนที่บัญชีคลินิกบันทึก **ไม่ขึ้น "บันทึกโดยคุณหมอ"** (`is_verified = false`) ตามกติกาเว็บ — ของบัญชีหมอขึ้น
- หน้าที่ใช้ร่วมกันทุก role อยู่ `src/app/(shared)/` (แชท, แจ้งเตือน, ตั้งค่าแจ้งเตือน, เปลี่ยนรหัส) · `src/app/_layout.tsx` ใช้ `Stack.Protected` แยกกลุ่มตาม role และพากลับหน้าแรกของ role ถ้าเข้าผิดกลุ่ม
- ลิงก์แจ้งเตือนของเว็บ (`/clinic-admin/...`, `/vet/...`) แปลงเป็นหน้าในแอปที่ `src/lib/links.ts`
- ลบบัญชีในแอปมีเฉพาะเจ้าของสัตว์ (บัญชีหมอ/คลินิกจัดการบนเว็บ)

**Endpoint ใหม่ใน petcare** (`app/api/mobile/`): `clinic/overview`, `clinic/requests`(+`[id]`), `clinic/appointments/[id]/arrived`, `clinic/appointments/[id]/schedule`, `clinic/reviews/[id]/reply`, `clinic/profile`, `clinic/services`(+`[id]`), `clinic/vets`(+`[id]`), `clinic/pets/[id]`, `appointments/[id]/status`, `appointments/[id]/complete`, `vet/home`, `vet/week`, `vet/invites/[clinicId]`, `vet/availability`, `vet/time-off`(+`[id]`), `vet/profile`, `vet/pets/[id]`, `chat/threads/[id]/close`, `chat/appointments/[id]` · helper `lib/mobile/staff.ts`

**แก้ใน petcare ระหว่างทำ**: `clinic/reviews` เดิมดึงรีวิวของทุกคลินิกที่บัญชีเป็นเจ้าของ (ตอบรีวิวไม่ได้ — "ไม่พบรีวิวนี้") → จำกัดที่คลินิกล่าสุดแบบ `requireClinicAdmin` · `pets/[id]` ฝั่งคลินิกเดิมไม่กรองด้วยกติกา visibility → ใช้ `measurementVisibleSql` / `vaccinationVisibleSql` / `medicalRecordVisibleSql` แล้ว · `me` คืน `must_change_password`, `solo_vet`, `vet.account_status`

**ทดสอบ**: API E2E ฝั่ง staff 45 ข้อ + ฝั่งเจ้าของ 67 ข้อ ผ่านทั้งหมด (DB ทดสอบในเครื่อง) · unit test 50 ข้อ · `tsc` / `expo lint` ผ่าน · Playwright เดินจริงบนเวอร์ชันเว็บ: คลินิก (หน้าหลัก → เคสวันนี้ → น้องมาถึง → รับคำขอจอง → แฟ้มน้อง → จัดการทุกหน้า), โหมดหมอคนเดียว (ปิดบัญชีหมอคนที่สอง → ปุ่มเริ่มตรวจ/จบเคสโผล่), หมอ (จบเคส + เวชระเบียน → แฟ้มน้องเห็นทันที, วันลา, โปรไฟล์, ตอบรับคำเชิญ), หมอที่ต้องเปลี่ยนรหัสผ่านก่อนใช้ · role ผิดกลุ่มถูกพากลับหน้าของตัวเอง

## S. สถานะล่าสุดฝั่งเจ้าของสัตว์ (2 ต.ค. 2026)

### ทำแล้ว

| ส่วน | ที่อยู่ | สถานะ |
|---|---|---|
| โปรเจค Expo SDK 57 + expo-router + TanStack Query + zustand + SecureStore | `WePawAPP/` | ✅ |
| ธีมเหมือนเว็บ: brand emerald / stone / Sarabun / โหมดมืด / `APPT_TONE` / ภาพสัตว์ประจำชนิด / ไอคอน species | `src/theme`, `src/shared`, `assets/pets` | ✅ `npm run sync:check` ยืนยันว่าตรงกับเว็บ |
| หน้าจอ 32 หน้า (ข้อ 4 ครบทุกแถว ยกเว้น social login) | `src/app/**` | ✅ |
| ไอคอนแอป / adaptive icon / splash สีแบรนด์ | `assets/images` | ✅ |
| `app.config.ts` (bundle id `app.wepaw.owner`, สิทธิ์ภาษาไทย, push, universal link ผ่าน `APP_DOMAIN`) + `eas.json` 3 profile | | ✅ `expo-doctor` 21/21 |
| petcare: `getSession()` อ่าน Bearer ได้ | `lib/auth/session.ts` | ✅ |
| petcare: route ใหม่/แก้ 30 ไฟล์ ใต้ `/api/mobile/*` + helper `lib/mobile/http.ts` | ดูข้อ S.3 | ✅ |
| petcare: ลบบัญชี | `lib/account/deleteAccount.ts` | ✅ |
| petcare: push ผ่าน Expo → `notification_deliveries(channel='push')` | `lib/push.ts`, `lib/notifications.ts` | ✅ |

### ผลทดสอบ
- **API E2E 67 ข้อ** บน petcare local (`next dev` + Postgres 17/PostGIS ใน Docker `wepaw-testdb` — **ไม่แตะ Supabase**): login/refresh/สมัคร, โปรไฟล์, เพิ่ม/แก้/ลบน้อง, ค่าวัด/วัคซีน (+ ซ่อนแถวที่ลบ), อัปโหลดรูปด้วย Bearer, จองคิว/ฝากไว้/หมอเยี่ยมบ้าน/ยกเลิก, แชท, รีวิว, โน้ตปฏิทิน, ชุมชน, แชร์น้องข้าม 2 บัญชี (viewer บันทึกไม่ได้, เพิกถอนแล้วเข้าไม่ได้), เปลี่ยนรหัส, ลบบัญชี (token เดิมใช้ไม่ได้, login ไม่ได้)
- Push: ลงทะเบียน token → ส่งแชท → server เรียก Expo จริง → บันทึก delivery `failed` + ปิด token ที่ไม่ได้ลงทะเบียน (token ทดสอบเป็นของปลอม)
- **Unit test 36 ข้อ** (jest-expo): ลิงก์เว็บ→แอป, วันเวลาไทยข้ามเที่ยงคืน, API client, กติกาสถานะน้อง
- `tsc` / `expo lint` ผ่านทั้งแอป · `tsc` ของ petcare ผ่าน
- `expo export` Android + iOS ได้ Hermes bytecode ทั้งคู่ (bundle ผ่านโดยไม่ต้องมีเครื่อง)
- **UI**: รันเวอร์ชันเว็บของแอปบน Edge จอ 390×844 ผ่าน Playwright เดินจริง — welcome → login → ค้นหา → คลินิก → จองคิว → นัด → แฟ้มน้อง → บันทึกน้ำหนัก/วัคซีน → แชท → แจ้งเตือน → ชุมชน → โปรไฟล์ → โหมดมืด และ สมัครใหม่ → เพิ่มน้อง → แชร์ → หมอเยี่ยมบ้าน → รีวิว → ตั้งคำถาม → ลบบัญชี

### บั๊กที่เจอระหว่างทำ (แก้แล้ว)
- **`GET /api/mobile/pets/{id}` (route เดิม) ไม่กรองแถวที่ลบ** — ค่าวัด/วัคซีน/ประวัติที่ลบแล้วยังโผล่ในแอป (และใน petcareApp)
- **route เดียวกันส่งคอลัมน์ DATE เป็น timestamp UTC** (`2026-10-26T17:00:00Z` แทน `2026-10-27`) → วันเลื่อน 1 วันและ `derivePetStatus` คิดไม่ได้ (ขึ้น "วัคซีนครบ" ทั้งที่ใกล้ครบกำหนด) — เปลี่ยนเป็น `to_char(...,'YYYY-MM-DD')` แบบ route รายการ; `preferred_date` ของนัดก็แก้แบบเดียวกัน
- `getLastNotificationResponse` ไม่มีบนเว็บ → จอขาวหลัง login (เฉพาะเว็บ) — ข้ามบนเว็บ

### ต่างจากแผนเดิม (ตั้งใจ)
| แผนเดิม | ที่ทำจริง | เหตุผล |
|---|---|---|
| แยก core ออกจาก server action ทีละตัว (ข้อ 5.2) | ให้ `getSession()` อ่าน Bearer แล้ว **route เรียก server action ตัวเดิมตรง ๆ** (แปลง JSON→FormData ใน `lib/mobile/http.ts`) | กติกาอยู่ที่เดียวเหมือนกัน แต่ไม่ต้องแก้ไฟล์ action ของเว็บเลย — ความเสี่ยงต่อเว็บเป็นศูนย์ และ route เดิม (`/api/*/upload`, `booking-data`, `/api/chat/threads`) ใช้กับแอปได้ทันที |
| NativeWind | `StyleSheet` + token (`src/theme`) + `useColors()` | ไม่พึ่ง babel/tailwind config ที่เปลี่ยนบ่อยตาม SDK · สีทุกตัวยังมาจาก globals.css |
| react-hook-form | `useState` + validate เบา ๆ ฝั่งแอป แล้วโชว์ `fieldErrors` จาก server | กติกาจริงอยู่ที่ zod ของเว็บอยู่แล้ว ฟอร์มในแอปสั้น |
| ลิงก์ claim ทำในแอป | เปิดหน้าเว็บ `/claim/[token]` (in-app browser) | flow ตั้งบัญชีจากคลินิกซับซ้อน (`pet-claim.ts`) ใช้หน้าเว็บตัวจริงปลอดภัยกว่า |
| Maestro E2E | Playwright บนเวอร์ชันเว็บ + API E2E | เครื่องนี้ยังไม่มี Android emulator — Maestro ทำได้เมื่อมี dev build |

### ที่เหลือ / ติดอยู่
1. **Social login (LINE / Google / Facebook + Sign in with Apple)** — ต้องมี client id ของแต่ละเจ้า + endpoint แลก token ฝั่ง petcare (`POST /api/mobile/auth/oauth/{provider}`) · Apple บังคับต้องมี Sign in with Apple ถ้าเปิด social login
2. **บัญชี store** — Apple Developer ($99/ปี) / Google Play Console ($25) ตามที่ตกลงไว้ว่ายังไม่ทำ · iOS build บน EAS ทำได้เมื่อมีบัญชี Apple
3. ✅ `eas init` แล้ว (บัญชี `jame_jomchanpan`, projectId ใน `app.config.ts`, keystore Android เก็บบน EAS) · `EXPO_PUBLIC_API_URL` ของ preview/production ชี้เว็บจริง `https://petcare-servers-9pqpixb37.vercel.app` แล้ว
4. Universal link: วาง `apple-app-site-association` / `assetlinks.json` ใน `petcare/public/.well-known/` (ต้องใช้ Team ID + SHA-256 ของ key เซ็นแอป)
5. Google Maps API key สำหรับ Android (`GOOGLE_MAPS_ANDROID_KEY`)
6. ทดสอบบนเครื่องจริง/emulator ด้วย dev build — กล้อง, ตำแหน่ง, push จริง
7. Sentry + tracking `conversion_events` (Phase 4 เดิม)
8. **seed ใน Supabase มีคลินิก 3 แห่งที่ id ไม่ใช่ UUID v4** (`aaaaaaaa-…`, `bbbbbbbb-…`, `cccccccc-…`) → zod v4 `.uuid()` ใน `requestBooking` / `createReview` ปฏิเสธ = จองคิว/รีวิวคลินิกพวกนี้ไม่ได้ทั้งเว็บและแอป (ตรวจจาก `/api/mobile/clinics` ของ production 2 ต.ค.) — แก้ได้ด้วย `z.guid()` แบบที่ WePawPOS ทำ หรือเปลี่ยน id ของ seed
9. ✅ **deploy petcare แล้ว** — commit `83c2307` (2 ต.ค. 2026) · migration 042/043 อยู่บน Supabase แล้ว · APK preview ตัวแรกติดตั้งบน Galaxy Z Fold4 ผ่าน EAS Build

### S.3 Endpoint ใหม่ใน petcare (`app/api/mobile/`)
`auth/refresh`, `auth/signup`, `me` (PATCH/DELETE), `me/avatar`, `me/password`, `me/devices`, `pets` (POST), `pets/[id]` (PATCH/DELETE), `pets/[id]/measurements`, `measurements/[id]`, `pets/[id]/vaccinations`, `vaccinations/[id]`, `pets/[id]/shares`, `pets/[id]/transfer`, `pet-shares/[id]`, `pet-share-invitations/[id]`, `pet-share-invitations/accept`, `appointments` (POST), `appointments/[id]` (GET), `appointments/[id]/proposal`, `appointments/home-visit`, `reviews`, `review-requests/[id]`, `calendar-notes`(+`[id]`), `community`, `community/[id]`, `community/[id]/answers`, `community/vote`, `community/report`
— route เดิมของเว็บที่แอปเรียกด้วย Bearer: `/api/pets/upload`, `/api/account/avatar`, `/api/reviews/upload`, `/api/chat/upload`, `/api/chat/threads` (POST), `/api/clinic/[id]/booking-data`

---

## 0. สรุปการตัดสินใจ (อ่านข้อนี้ข้อเดียวพอ)

| เรื่อง | ตัดสินใจ | เหตุผลสั้น ๆ |
|---|---|---|
| เขียนด้วยอะไร | **Expo (React Native) + TypeScript** | ภาษาเดียวกับ petcare / WePawPOS · build iOS บน cloud ได้จาก Windows ไม่ต้องมี Mac |
| Build Android / iOS | **EAS Build** (cloud) + EAS Submit | เครื่องนี้เป็น Windows — Flutter / native iOS ต้องมี Mac + Xcode |
| อัปเดตแก้บั๊กเร็ว | **EAS Update** (OTA) | แก้ JS ส่งถึงเครื่องผู้ใช้ได้โดยไม่ต้องรอรีวิว store |
| Backend | ใช้ **`/api/mobile/*` ของ petcare** ต่อ + เพิ่ม endpoint ฝั่งเขียนข้อมูล | backend / DB / JWT ตัวเดียวกับเว็บ — ห้ามมี logic ธุรกิจซ้ำสองที่ |
| ความสัมพันธ์กับ `petcareApp` (Flutter) | WePawAPP **แทนที่ส่วนเจ้าของสัตว์** ของ petcareApp | petcareApp ยังไม่เคย compile (ไม่มี Flutter SDK) และรวม 3 role — ดูข้อ 9 |

---

## 1. ภาพรวมสถาปัตยกรรม

```
┌──────────── WePawAPP (Expo / React Native) ────────────┐
│  expo-router (หน้าจอ)                                    │
│  TanStack Query (cache ข้อมูลจาก server)                 │
│  zustand (session / ธีม)   expo-secure-store (JWT)       │
└───────────────┬─────────────────────────────────────────┘
                │ HTTPS  Authorization: Bearer <JWT>
                ▼
┌──────────── petcare (Next.js บน Vercel) ───────────────┐
│  /api/mobile/*        ← REST ชั้นบาง ๆ (มีอยู่แล้วบางส่วน)  │
│  /api/*/upload        ← อัปโหลดรูป (ต้องรองรับ Bearer)     │
│  lib/** core          ← กติกาธุรกิจ ใช้ร่วมกับ Server Action │
└───────────────┬─────────────────────────────────────────┘
                ▼
        Supabase Postgres 17 + PostGIS / Storage (R2)

Push:  petcare ── Expo Push API ──▶ FCM (Android) / APNs (iOS) ──▶ แอป
```

**ทำไมต้องผ่าน `/api/mobile/*`:** เว็บใช้ Server Action เป็นหลัก ซึ่งแอปภายนอกเรียกไม่ได้
ทุก endpoint ใหม่ต้องใช้รูปแบบเดียวกับ `lib/booking/cancelOwner.ts` คือ **แยก core ออกจาก server action → ให้ทั้ง action และ route เรียก core ตัวเดียวกัน**

---

## 2. ใช้ Tool อะไร

### 2.1 เครื่องมือหลัก

| ชั้น | Tool | ใช้ทำอะไร / ทำไมเลือก |
|---|---|---|
| Framework | **Expo SDK (ล่าสุด)** + React Native + **TypeScript strict** | ภาษา/ทักษะเดียวกับเว็บ, ใช้ zod / date-fns ตัวเดียวกันได้ |
| Routing | **expo-router** (file-based, typed routes) | โครงคล้าย Next.js App Router · deep link ได้ทุกหน้าโดยอัตโนมัติ |
| Server state | **@tanstack/react-query** (+ persist ลง storage) | cache, pull-to-refresh, retry, เปิดแอปตอนเน็ตไม่ดีก็ยังเห็นข้อมูลล่าสุด |
| Client state | **zustand** | session, ธีม, badge — เล็ก ไม่ต้องใช้ Redux |
| เก็บ token | **expo-secure-store** | JWT อยู่ใน Keychain / Keystore (ไม่ใช่ AsyncStorage ธรรมดา) |
| Styling | **NativeWind** (Tailwind สำหรับ RN) | ใช้ชื่อ class ชุดเดียวกับเว็บ (`bg-brand-600`, `text-stone-500`) พอร์ต token จาก `globals.css` ตรง ๆ |
| ฟอนต์ | **@expo-google-fonts/sarabun** | ฟอนต์เดียวกับเว็บ, ฝังในแอป (ไม่ต้องโหลดจากเน็ตเหมือน google_fonts ของ Flutter) |
| ไอคอน | **lucide-react-native** | ชุดเดียวกับ `lucide-react` ของเว็บ |
| ฟอร์ม | **react-hook-form** + **zod** | ใช้ schema ชุดเดียวกับ server (`RequestBookingSchema`, `PetSchema` ฯลฯ) |
| วันที่ | **date-fns** + locale `th` | ตัวเดียวกับเว็บ, แสดง พ.ศ. |
| รูปภาพ | **expo-image**, **expo-image-picker**, **expo-image-manipulator** | แสดงรูปพร้อม cache · เลือก/ถ่ายรูปน้อง · **แปลง HEIC → JPEG + ย่อก่อนอัปโหลด** (HEIC จาก iPhone เปิดบน Chrome ไม่ได้) |
| แผนที่ / ตำแหน่ง | **react-native-maps**, **expo-location** | ค้นหาคลินิกใกล้ฉัน (API รองรับ `lat/lng/radius` แล้ว), ปักหมุดที่อยู่ home visit |
| QR | **react-native-qrcode-svg** | QR ประจำตัวน้อง `petcare:pet:<uuid>` (รูปแบบเดียวกับที่ `PetQrScanner` ฝั่งคลินิกอ่าน) + QR ลิงก์แชร์ |
| Push | **expo-notifications** + Expo Push Service | ได้ทั้ง FCM / APNs ผ่าน API เดียว |
| Social login | **expo-auth-session** + **expo-web-browser**, **expo-apple-authentication** | LINE / Google / Facebook + **Sign in with Apple (App Store บังคับถ้ามี social login)** |
| OTA | **expo-updates** (EAS Update) | ส่งแก้บั๊กฝั่ง JS โดยไม่ผ่าน store |
| Error tracking | **@sentry/react-native** | ดู crash จากเครื่องผู้ใช้จริง |

### 2.2 Build / Release

| งาน | Tool | หมายเหตุ |
|---|---|---|
| Build Android (AAB / APK) | **EAS Build** — หรือ local: `npx expo prebuild` + Gradle | เครื่องนี้มี JDK 17 แล้ว ต้องลง Android Studio + SDK เพิ่มถ้าจะ build/emulator ในเครื่อง |
| Build iOS (IPA) | **EAS Build** (cloud macOS) | ไม่ต้องมี Mac · ต้องมี **Apple Developer Program ($99/ปี)** |
| ส่งขึ้น store | **EAS Submit** | Google Play Console ($25 จ่ายครั้งเดียว) + App Store Connect API key |
| ทดสอบบนมือถือจริง | **Development build** (`eas build --profile development`) | Expo Go ใช้ได้แค่ช่วงแรก — พอมี maps / push / social login ต้องใช้ dev build |
| แจกทีมทดสอบ | EAS internal distribution (Android APK / iOS ad-hoc) → TestFlight / Play Internal testing | |

### 2.3 คุณภาพโค้ด / ทดสอบ

| Tool | ใช้ทำอะไร |
|---|---|
| **eslint** (`eslint-config-expo`) + **prettier** + `tsc --noEmit` | lint / typecheck ก่อน commit |
| **jest-expo** + **@testing-library/react-native** | unit test: กติกาที่พอร์ตจากเว็บ, hook, component |
| **Maestro** | E2E บน emulator: login → เพิ่มน้อง → จองนัด → ยกเลิก |
| `scripts/check-sync.mjs` | เทียบไฟล์กติกาที่ copy มากับต้นฉบับใน `../petcare` (แบบเดียวกับที่ WePawPOS เทียบสูตรบิล) |
| GitHub Actions | lint + typecheck + test ทุก PR · สั่ง `eas build` เมื่อ tag release |

---

## 3. โครงสร้างโปรเจค

```
WePawAPP/
├── plan.md
├── app.config.ts              ← ชื่อแอป, bundle id, scheme "wepaw", permission (ข้อความไทย), plugins
├── eas.json                   ← build profile: development / preview / production + EXPO_PUBLIC_API_URL
├── tailwind.config.js         ← token พอร์ตจาก petcare/app/globals.css
├── assets/                    ← icon, adaptive-icon, splash, รูปประกอบ
├── scripts/
│   └── check-sync.mjs         ← diff ไฟล์ใน src/shared กับ ../petcare
│
├── app/                       ← expo-router: 1 ไฟล์ = 1 หน้าจอ
│   ├── _layout.tsx            ← providers (QueryClient, fonts, theme, session gate)
│   ├── (auth)/
│   │   ├── welcome.tsx
│   │   ├── sign-in.tsx        ← email/password (+ ปุ่ม social ใน Phase 4)
│   │   └── sign-up.tsx        ← ฟิลด์ + consent PDPA ชุดเดียวกับ SignUpForm ของเว็บ
│   ├── (tabs)/                ← แถบล่าง ลำดับเดียวกับ mobile web: ค้นหา · นัด · น้องของฉัน · ฉัน
│   │   ├── _layout.tsx
│   │   ├── index.tsx          ← ค้นหาคลินิก (list / map, ใกล้ฉัน, filter ชนิดสัตว์/เปิดอยู่)
│   │   ├── appointments.tsx   ← นัดของฉัน (กำลังจะถึง/ผ่านไปแล้ว) + โน้ตปฏิทิน
│   │   ├── pets.tsx           ← น้องของฉัน + สถานะ "ต้องทำอะไรต่อ"
│   │   └── me.tsx             ← โปรไฟล์, บันทึกไว้, ตั้งค่า, ออกจากระบบ
│   ├── clinic/[slug]/
│   │   ├── index.tsx          ← โปรไฟล์คลินิก: เวลาเปิด บริการ หมอ รีวิว แกลเลอรี
│   │   ├── book.tsx           ← ส่งคำขอจอง (วัน + ช่วงเวลา + บริการ + ฝากไว้)
│   │   ├── home-visit.tsx     ← ขอหมอเยี่ยมบ้าน (ปักหมุด)
│   │   └── review.tsx         ← เขียนรีวิว + แนบรูป
│   ├── pets/
│   │   ├── new.tsx
│   │   └── [id]/
│   │       ├── index.tsx      ← แฟ้มน้อง: ค่าวัด (กราฟ), วัคซีน, ประวัติรักษา, นัด, QR
│   │       ├── edit.tsx
│   │       ├── measurement.tsx
│   │       ├── vaccination.tsx
│   │       └── sharing.tsx    ← แชร์ให้คนในบ้าน/คลินิก, เปลี่ยนสิทธิ์, โอนเจ้าของ
│   ├── appointments/[id].tsx  ← รายละเอียดนัด + ยกเลิก + เปิดแชทเคส
│   ├── chat/
│   │   ├── index.tsx
│   │   └── [id].tsx           ← ห้องแชท (ข้อความ + รูป)
│   ├── notifications.tsx
│   ├── favorites.tsx
│   ├── community/             ← (Phase 3) ถาม-ตอบ
│   ├── share/[token].tsx      ← deep link รับการแชร์น้อง  (= เว็บ /pets/share/[token])
│   ├── claim/[token].tsx      ← deep link รับน้องจากคลินิก (= เว็บ /claim/[token])
│   └── settings/
│       ├── profile.tsx
│       ├── password.tsx
│       ├── notifications.tsx  ← เปิด/ปิด push รายหมวด
│       └── delete-account.tsx ← App Store บังคับ
│
└── src/
    ├── api/
    │   ├── client.ts          ← fetch + Bearer + จัดการ 401 (เคลียร์ session) + ApiError
    │   ├── schemas.ts         ← zod ของ response (parse ทุกครั้ง — API เปลี่ยนแล้วรู้ทันที)
    │   └── endpoints/         ← auth, me, clinics, pets, appointments, chat, notifications, ...
    ├── features/              ← hook ต่อเรื่อง: usePets(), useClinic(slug), useBookingRequest() ...
    ├── components/
    │   ├── ui/                ← Button, Card, Pill, Sheet, Input, ThaiPhoneInput, EmptyState
    │   ├── clinic/            ← ClinicCard, HoursTable, ServiceList, ReviewList
    │   ├── pets/              ← PetCard, PetStatusBar, HealthTrendChart, VaccineList
    │   ├── appointments/      ← AppointmentCard (สีตาม APPT_TONE)
    │   └── chat/              ← MessageBubble, Composer
    ├── shared/                ← ⚠️ copy จาก petcare — แก้ฝั่งนั้นต้องแก้ฝั่งนี้ (check-sync เตือน)
    │   ├── petStatus.ts       ← = petcare/lib/petStatus.ts
    │   ├── petAge.ts          ← = petcare/lib/petAge.ts
    │   ├── phone.ts           ← = petcare/lib/phone.ts
    │   └── apptTone.ts        ← = APPT_TONE ใน components/account/MobileAccountView.tsx
    ├── theme/                 ← tokens (brand emerald / stone), dark mode
    ├── state/                 ← session.ts (zustand), theme.ts
    └── lib/                   ← secureStorage, push.ts (ลงทะเบียน token), upload.ts, format.ts
```

**กติกาโครงสร้าง**
- หน้าจอใน `app/` บางที่สุด — ดึงข้อมูลผ่าน hook ใน `src/features/` เท่านั้น ไม่เรียก `fetch` ตรง
- ไฟล์ใน `src/shared/` ห้ามแก้เอง — แก้ที่ petcare แล้ว copy มา (`npm run sync:check` ต้องผ่าน)
- ข้อความ UI เป็นภาษาไทยทั้งหมด (เหมือนเว็บ) ยังไม่ทำ i18n

---

## 4. ฟีเจอร์ฝั่งเจ้าของสัตว์ ↔ API

✅ = มีใน petcare แล้ว · 🔧 = มีแล้วแต่ต้องแก้ให้รับ Bearer · 🆕 = ต้องเพิ่ม

| ฟีเจอร์ | หน้าเว็บที่เทียบ | API | Phase |
|---|---|---|---|
| Login email/password | `/auth/signin` | ✅ `POST /api/mobile/auth/login` (แอปรับเฉพาะ `pet_owner`) | 0 |
| ข้อมูลตัวเอง | — | ✅ `GET /api/mobile/me` | 0 |
| ต่ออายุ token | — | 🆕 `POST /api/mobile/auth/refresh` | 0 |
| ค้นหาคลินิก (ชื่อ/ชนิดสัตว์/ใกล้ฉัน/เปิดอยู่) | `/search` | ✅ `GET /api/mobile/clinics` | 1 |
| โปรไฟล์คลินิก + รีวิว | `/clinic/[slug]` | ✅ `GET /api/mobile/clinics/{slug}` | 1 |
| บันทึกคลินิก | `/account/favorites` | ✅ `GET/POST /api/mobile/favorites` | 1 |
| น้องของฉัน + สถานะ | `/account/pets` | ✅ `GET /api/mobile/pets` | 1 |
| แฟ้มน้อง | `/account/pets/[id]` | ✅ `GET /api/mobile/pets/{id}` | 1 |
| นัดของฉัน + ยกเลิก | `/account/appointments` | ✅ `GET /api/mobile/appointments`, `POST …/{id}/cancel` | 1 |
| แจ้งเตือน | `/account/notifications` | ✅ `GET /api/mobile/notifications`, `…/{id}/read`, `…/read-all` | 1 |
| แชท อ่าน/ส่ง | `/account/messages` | ✅ `/api/mobile/chat/*` | 1 |
| สมัครสมาชิก | `/auth/signup` | 🆕 `POST /api/mobile/auth/signup` ← core จาก `signUpPetOwner` | 2 |
| แก้โปรไฟล์ / รหัสผ่าน | `/account` | 🆕 `PATCH /api/mobile/me`, `POST /api/mobile/me/password` | 2 |
| อัปโหลดอวาตาร์ | `/account` | 🔧 `POST /api/account/avatar` | 2 |
| **ลบบัญชี** | ไม่มีบนเว็บ | 🆕 `DELETE /api/mobile/me` (soft delete + ล้างข้อมูลส่วนตัว) | 2 |
| เพิ่ม/แก้/ลบน้อง + รูป | `/account/pets/new`, `…/edit` | 🆕 `POST /api/mobile/pets`, `PATCH/DELETE …/{id}` ← core จาก `addPet/updatePet/deletePet` · 🔧 `POST /api/pets/upload` | 2 |
| บันทึกน้ำหนัก / วัคซีน | `…/edit` | 🆕 `POST/DELETE /api/mobile/pets/{id}/measurements`, `…/vaccinations` | 2 |
| ส่งคำขอจองนัด | BookingDialog | 🔧 `GET /api/clinic/{id}/booking-data` · 🆕 `POST /api/mobile/appointments` ← core จาก `requestBooking` | 2 |
| ขอหมอเยี่ยมบ้าน | HomeVisitMapPicker | 🆕 `POST /api/mobile/appointments/home-visit` ← core จาก `requestHomeVisit` | 2 |
| ตอบข้อเสนอเวลา (นัดเก่าสถานะ `proposed`) | ProposalActions | 🆕 `POST …/{id}/proposal` ← `acceptProposedSlot/declineProposal` | 2 |
| เขียนรีวิว + รูป | `/clinic/[slug]/review`, `/account/reviews/[id]` | 🆕 `POST /api/mobile/reviews` ← `createReview/submitReviewFromRequest` · 🔧 `POST /api/reviews/upload` | 2 |
| QR ประจำตัวน้อง | แฟ้มน้อง | ไม่ต้องใช้ API (`petcare:pet:<id>`) | 2 |
| Push notification | — | 🆕 `POST/DELETE /api/mobile/me/devices` (ตาราง `user_devices` มีแล้ว) + ช่อง `push` ใน `lib/notifications.ts` | 3 |
| แชร์น้อง / รับแชร์ / โอนเจ้าของ | ShareManagementSection, `/pets/share/[token]` | 🆕 `/api/mobile/pets/{id}/shares*`, `POST /api/mobile/shares/{token}/accept` ← `pet-shares.ts` | 3 |
| รับน้องจากคลินิก (claim) | `/claim/[token]` | 🆕 `GET/POST /api/mobile/claim/{token}` ← `pet-claim.ts` | 3 |
| เริ่มแชทกับคลินิก + แนบรูป | StartChatButton | 🆕 `POST /api/mobile/chat/threads` · 🔧 `POST /api/chat/upload` | 3 |
| โน้ตปฏิทิน | AppointmentCalendar | 🆕 `/api/mobile/calendar-notes` ← `calendar-notes.ts` | 3 |
| ชุมชนถาม-ตอบ | `/community` | 🆕 `/api/mobile/community/*` ← `community.ts` | 3 |
| LINE / Google / Facebook / Apple login | `/api/auth/*` | 🆕 `POST /api/mobile/auth/oauth/{provider}` (แลก code/id_token → JWT) | 4 |

**ไม่ทำในแอป:** จ่ายเงินออนไลน์, telemedicine, ทุกอย่างของคลินิก/หมอ/POS/admin

---

## 5. สิ่งที่ต้องแก้ใน repo `petcare`

1. **`lib/auth/session.ts` — `getSession()` อ่าน `Authorization: Bearer` ก่อน cookie** (ผ่าน `headers()`)
   → route เดิมที่ใช้ `getCurrentUser()` (upload ทั้งหมด, `booking-data`, `slots`) ใช้กับแอปได้ทันทีโดยไม่ต้องเขียนซ้ำ
   แล้ว `lib/auth/mobileSession.ts` ค่อยเหลือเป็น wrapper ของตัวนี้
2. **แยก core ออกจาก server action** (แบบ `cancelOwner.ts`) — action เหลือแค่ auth + เรียก core + `revalidatePath`
   - `lib/auth/signupCore.ts` ← `signUpPetOwner`
   - `lib/pets/petCore.ts` ← `addPet / updatePet / deletePet` (เปลี่ยนรับ object แทน `FormData`)
   - `lib/pets/measurementCore.ts`, `vaccinationCore.ts`, `shareCore.ts`
   - `lib/booking/requestCore.ts` ← `requestBooking`, `requestHomeVisit`, `acceptProposedSlot`, `declineProposal`
   - `lib/reviews/createCore.ts` ← `createReview`, `submitReviewFromRequest`
3. **เพิ่ม route ใน `app/api/mobile/`** ตามตารางข้อ 4 — validate ด้วย zod ตัวเดียวกับ action
4. **Push:** `lib/push.ts` ส่งผ่าน Expo Push API ไปยัง token ใน `user_devices` → เพิ่มช่อง `push` ใน `lib/notifications.ts` (บันทึกลง `notification_deliveries` เหมือนช่องอื่น) + ลบ token ที่ Expo ตอบ `DeviceNotRegistered`
5. **Deep link:** `public/.well-known/apple-app-site-association` + `assetlinks.json` ให้ลิงก์ `/pets/share/*`, `/claim/*`, `/clinic/*` เปิดในแอปถ้าติดตั้งไว้
6. **ลบบัญชี:** core + route ใหม่ (เว็บยังไม่มี) — soft delete `users`, ยกเลิกนัดที่ยังไม่ถึง, ล้าง PII ตาม PDPA
7. **Token อายุ:** JWT ตอนนี้ 7 วัน → แอปต่ออายุผ่าน `/auth/refresh` ตอนเปิดแอป (sliding) ผู้ใช้ไม่ต้อง login ใหม่ทุกสัปดาห์
8. อัปเดต `CLAUDE.md` ของ petcare หัวข้อ Mobile REST API ให้ชี้มาที่ WePawAPP ด้วย

> ⚠️ ห้าม copy SQL / กติกาธุรกิจมาไว้ใน route — ต้องเรียก core ใน `lib/` เท่านั้น ไม่งั้นเว็บกับแอปจะเพี้ยนกัน (เคยเกือบเกิดกับกฎยกเลิกนัดก่อน 1 ชม.)

---

## 6. UX/UI

- เดินตาม **mobile web ของ petcare** (`MobileAccountView`, `MobilePetList`, `MobilePetProfile`, `MobileSearchView`) — ผู้ใช้ที่เคยใช้เว็บบนมือถือต้องไม่งง
- แถบล่าง 4 แท็บ: **ค้นหา · นัด · น้องของฉัน · ฉัน** · ปุ่มแชท/กระดิ่งบน app bar พร้อม badge
- สี: brand emerald `#10b981`/`#059669` + neutral stone, **รองรับโหมดมืด** ตามระบบ
- ไฟล์ที่ต้องตรงกับเว็บเสมอ: `globals.css` → `tailwind.config.js` · `APPT_TONE` → `src/shared/apptTone.ts` · `lib/petStatus.ts` → `src/shared/petStatus.ts`
- คำขอจองสถานะ `requested / proposed / accepted`: `scheduled_at` เป็นแค่ placeholder → แสดง `preferred_date` + `preferred_periods` แทน (กติกาเดียวกับเว็บ)
- Permission ขอเมื่อจะใช้จริงเท่านั้น (ตำแหน่ง → ตอนกด "ใกล้ฉัน", กล้อง → ตอนกดถ่ายรูปน้อง, แจ้งเตือน → หลังจองนัดครั้งแรก) พร้อมข้อความอธิบายภาษาไทย

---

## 7. แผนงานแบ่ง Phase

### Phase 0 — ตั้งโปรเจค + login (≈ 1 สัปดาห์)
- [ ] `npx create-expo-app@latest` (template TypeScript + expo-router) ใน WePawAPP
- [ ] ตั้ง eslint / prettier / tsconfig strict / jest-expo / NativeWind / ฟอนต์ Sarabun / token + dark mode
- [ ] `eas init`, `eas.json` 3 profile, bundle id (เช่น `app.wepaw.owner`), scheme `wepaw`
- [ ] petcare: `getSession()` รับ Bearer + `/api/mobile/auth/refresh`
- [ ] `src/api/client.ts` + session (secure-store) + หน้า sign-in + gate ตาม session (role ≠ pet_owner → แจ้งให้ใช้เว็บ)
- [ ] `scripts/check-sync.mjs` + copy `petStatus / petAge / phone / apptTone`
- **เสร็จเมื่อ:** login ได้บน Android emulator และ iPhone จริง (dev build จาก EAS) ชี้ไป petcare local/staging

### Phase 1 — อ่านข้อมูลครบ (เท่ากับฝั่ง owner ของ petcareApp) (≈ 2 สัปดาห์)
- [ ] ค้นหาคลินิก list + map + ใกล้ฉัน + filter, โปรไฟล์คลินิก, บันทึกคลินิก
- [ ] น้องของฉัน + สถานะ, แฟ้มน้อง (ค่าวัด/กราฟ, วัคซีน, ประวัติ, นัด)
- [ ] นัดของฉัน + ยกเลิก, แจ้งเตือน, แชทอ่าน/ส่ง (polling ทุก ~10 วิ ตอนเปิดห้อง)
- **เสร็จเมื่อ:** ทุกหน้าใน Phase 1 แสดงข้อมูลบัญชีทดสอบตรงกับเว็บ + มี test ของ `petStatus` เทียบกับต้นฉบับ

### Phase 2 — เขียนข้อมูล (≈ 3 สัปดาห์)
- [ ] petcare: แยก core + route ข้อ 5.2 / 5.3 / 5.6
- [ ] สมัครสมาชิก (consent PDPA ครบ — ห้ามตัด field ตาม Founder Mindset), แก้โปรไฟล์/อวาตาร์/รหัสผ่าน, ลบบัญชี
- [ ] เพิ่ม/แก้/ลบน้อง + รูป, บันทึกน้ำหนัก/วัคซีน, QR ประจำตัวน้อง
- [ ] ส่งคำขอจองนัด (รวมบริการฝากไว้), ขอหมอเยี่ยมบ้าน, ตอบข้อเสนอเวลาเก่า
- [ ] เขียนรีวิว + รูป
- **เสร็จเมื่อ:** Maestro flow `สมัคร → เพิ่มน้อง → จองนัด → คลินิกรับบนเว็บ → แอปเห็นสถานะ accepted` ผ่าน

### Phase 3 — Engagement (≈ 2 สัปดาห์)
- [ ] Push notification (ลงทะเบียน token, เปิดแจ้งเตือนแล้วพาไปหน้าที่ถูกต้อง, ตั้งค่ารายหมวด)
- [ ] Deep link / universal link: แชร์น้อง, claim, คลินิก
- [ ] จัดการการแชร์น้อง / โอนเจ้าของ, โน้ตปฏิทิน
- [ ] เริ่มแชทจากหน้าคลินิก + แนบรูป, ชุมชนถาม-ตอบ

### Phase 4 — Social login + ขึ้น store (≈ 2 สัปดาห์)
- [ ] LINE / Google / Facebook + **Sign in with Apple**
- [ ] ไอคอน, splash, screenshot, คำอธิบาย store (ไทย), privacy policy URL
- [ ] App Store: privacy nutrition label · Google Play: Data safety form
- [ ] Sentry + EAS Update channel `production`
- [ ] Tracking: บันทึก install source / conversion event ลง `conversion_events` (schema รออยู่แล้ว)
- [ ] TestFlight + Play Internal testing → รีวิว → เปิดจริง

---

## 8. Build & Release (ขั้นตอนจริง)

```bash
# ครั้งแรก
npm i -g eas-cli
eas login
eas init                                  # ผูกโปรเจคกับบัญชี Expo

# dev บนเครื่อง (backend petcare ต้องรัน: npm run dev ที่ C:\web_source\petcare)
npx expo start                            # Android emulator ใช้ http://10.0.2.2:3000
                                          # มือถือจริงใน LAN: EXPO_PUBLIC_API_URL=http://<IP>:3000

# dev build (ต้องใช้เมื่อมี native module เช่น maps / push)
eas build --profile development --platform android
eas build --profile development --platform ios     # ลงทะเบียน iPhone ก่อน: eas device:create

# แจกทีมทดสอบ
eas build --profile preview --platform all          # Android = APK, iOS = ad-hoc

# ขึ้น store
eas build  --profile production --platform all       # AAB + IPA
eas submit --platform android
eas submit --platform ios                            # → TestFlight → ส่งรีวิว

# แก้บั๊ก JS หลังปล่อย (ไม่ต้องผ่าน store)
eas update --channel production --message "fix: ..."
```

| Profile | API | Android | iOS | ใช้ตอน |
|---|---|---|---|---|
| development | local / LAN | dev client APK | dev client (อุปกรณ์ที่ลงทะเบียน) | เขียนโค้ด |
| preview | staging | APK | ad-hoc | ทีมทดสอบ |
| production | `https://<โดเมนจริง>` | AAB | App Store | ปล่อยจริง |

**สิ่งที่ต้องเตรียม (ไม่ใช่โค้ด):** บัญชี Expo · Apple Developer ($99/ปี) · Google Play Console ($25) · Firebase project (FCM สำหรับ Android push) · APNs key · Google Maps API key (Android) · โดเมนสำหรับ universal link · หน้า privacy policy

> HTTP ไม่เข้ารหัสใช้ได้แค่ตอน dev — production ต้องเป็น HTTPS เท่านั้น (iOS ATS / Android cleartext block)

---

## 9. ความเสี่ยง / เรื่องที่ต้องตัดสินใจ

| เรื่อง | รายละเอียด | ข้อเสนอ |
|---|---|---|
| ซ้ำกับ `petcareApp` (Flutter) | ฝั่ง owner ทับกันทั้งหมด | WePawAPP แทนส่วน owner · petcareApp จะเก็บไว้ทำแอปคลินิก/หมอ หรือหยุดก็ได้ — **ต้องเลือก** ก่อนเพิ่ม endpoint ฝั่งคลินิก/หมอ |
| Login รับทุก role | `/api/mobile/auth/login` ปล่อย clinic_admin / vet เข้าได้ (petcareApp ใช้อยู่) | แอปเช็ค role เอง ไม่แก้ endpoint จนกว่าจะเลิก petcareApp |
| Apple บังคับ | มี social login → ต้องมี Sign in with Apple · ต้องลบบัญชีในแอปได้ | อยู่ใน Phase 2 / 4 แล้ว |
| Supabase free tier pause | ไม่มีคนใช้ 7 วัน → DB หยุด แอปขึ้น error | มี cron keep-alive ตาม DEPLOY.md แล้ว — ตรวจว่ายังทำงาน |
| Migration ไม่มี tracking | endpoint ใหม่ที่ query ตารางใหม่ → 500 ถ้าลืมรัน migration | ทุก PR ฝั่ง petcare ที่มี migration ต้องรันบน Supabase ก่อน deploy |
| Realtime แชท | ยังไม่มี websocket | Phase 1 ใช้ polling · push แจ้งข้อความใหม่ใน Phase 3 |
| รูปจาก iPhone (HEIC) | เว็บบน Chrome เปิด HEIC ไม่ได้ | แปลงเป็น JPEG ในแอปก่อนอัปโหลดทุกครั้ง |

---

## 10. หลักการทำงาน (สรุป)

1. **กติกาธุรกิจอยู่ที่ petcare ที่เดียว** — แอปแสดงผล + validate เบื้องต้นเท่านั้น
2. ไฟล์ที่ copy จากเว็บอยู่ใน `src/shared/` และต้องผ่าน `check-sync` เสมอ
3. Endpoint ใหม่ = แยก core ออกจาก server action ก่อน แล้วให้ทั้งสองฝั่งเรียก
4. ทำเล็ก ทำเร็ว ปล่อยเป็น phase — Phase 1 ใช้ได้จริงก่อนค่อยเพิ่มการเขียนข้อมูล
5. ไม่ตัด field consent / tracking ออก (Founder Mindset ของ petcare)
