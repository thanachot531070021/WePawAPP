# WePaw — แอปมือถือ PetCare (Android + iOS)

แอปมือถือของ PetCare สำหรับ **เจ้าของสัตว์เลี้ยง, สัตวแพทย์ และคลินิก** — ใช้ backend / database / บัญชีเดียวกับเว็บ `C:\web_source\petcare` · login แล้วแอปเลือกหน้าตาม role ของบัญชี
เขียนด้วย **Expo SDK 57 (React Native + TypeScript)** build Android/iOS ผ่าน **EAS Build** ได้จาก Windows

แผนและการตัดสินใจทั้งหมด: [plan.md](plan.md)

## ทำอะไรได้บ้าง

| ส่วน | ฟีเจอร์ |
|---|---|
| บัญชี | สมัคร — เลือก เจ้าของสัตว์ / คลินิก (5 ขั้น รออนุมัติ) / สัตวแพทย์ (เปิดบัญชีผ่านคลินิก) (consent PDPA ครบ), เข้าสู่ระบบ, ต่ออายุ token อัตโนมัติ, แก้โปรไฟล์/รูป, เปลี่ยนรหัสผ่าน, **ลบบัญชี** |
| ค้นหา | ค้นคลินิก (ชื่อ/ย่าน), ใกล้ฉัน (GPS), เปิดอยู่ตอนนี้, ชนิดสัตว์, เรียงลำดับ, แผนที่, บันทึกคลินิก |
| คลินิก | เวลาทำการ, บริการ+ราคา, สัตวแพทย์, รูป, รีวิว, โทร/แชท/นำทาง, เขียนรีวิว+รูป |
| นัด | ส่งคำขอจองคิว (รวมบริการฝากไว้), ขอหมอเยี่ยมบ้าน (ปักหมุด), รายละเอียด, ยกเลิก, ตอบเวลาที่คลินิกเสนอ, รีวิวหลังใช้บริการ, โน้ตปฏิทิน |
| น้อง | เพิ่ม/แก้/ลบ + รูป, สถานะ "ต้องทำอะไรต่อ", กราฟน้ำหนัก, ค่าวัด, วัคซีน, ประวัติรักษา, QR ประจำตัว, แชร์ให้คนในบ้าน/เปลี่ยนสิทธิ์/โอนเจ้าของ, รับคำเชิญ |
| อื่น ๆ | แชทกับคลินิก (ข้อความ+รูป), แจ้งเตือนในแอป + push, ชุมชนถาม-ตอบ (ถาม/ตอบ/โหวต/รายงาน), โหมดมืด |
| **หมอ** | งานวันนี้ (เริ่มตรวจ / จบเคส + เวชระเบียน), ตารางสัปดาห์, แฟ้มน้อง, แชทเคส, คำเชิญจากคลินิก, สลับคลินิก, เวลาทำงาน + วันลา, โปรไฟล์ — เมนูของหมอเท่านั้น |
| **คลินิก** | ภาพรวม, เคสวันนี้ (น้องมาถึง / ไม่มา), คำขอจอง (รับ / ปฏิเสธ / หมอเยี่ยมบ้าน), แฟ้มน้อง, รีวิว + ตอบ, บริการ + ราคา, ข้อมูลคลินิก, เพิ่มหมอ + ส่งลิงก์เปิดใช้งานทาง LINE, แชท · **คลินิกที่มีหมอคนเดียว** เริ่มตรวจ / จบเคสจากบัญชีคลินิกได้ด้วย · POS / สต็อก ใช้เว็บ |

หน้าตา: สี / ฟอนต์ Sarabun / การ์ดนัด / สถานะน้อง พอร์ตจาก mobile web ของ petcare (`globals.css`, `APPT_TONE`, `petStatus.ts`)

## รันครั้งแรก (dev)

```bash
# 1) backend — ที่ C:\web_source\petcare
npm run dev                         # http://localhost:3000

# 2) แอป — ที่โฟลเดอร์นี้
npm install
npm start                           # แล้วกด a = Android emulator
```

| เครื่องที่รัน | ตั้ง API |
|---|---|
| Android emulator | อัตโนมัติ `http://10.0.2.2:3000` |
| iOS simulator | อัตโนมัติ `http://localhost:3000` |
| มือถือจริงใน Wi-Fi เดียวกัน | `EXPO_PUBLIC_API_URL=http://<IP เครื่อง dev>:3000 npm start` |
| ต่อเว็บจริงบน Vercel | `npm run start:prod` (→ https://petcare-servers-9pqpixb37.vercel.app) |

> แผนที่ / push / กล้อง ต้องใช้ **development build** (Expo Go ใช้ได้แค่ส่วนอื่น):
> `npx eas-cli@latest build --profile development --platform android`

## ตรวจคุณภาพ

```bash
npm run check        # typecheck + lint + unit test + sync:check
npm run sync:check   # ไฟล์กติกาใน src/shared ต้องตรงกับ ../petcare (แก้ที่ petcare แล้ว copy มา)
```

## Build / ส่ง store

```bash
npx eas-cli@latest login
# โปรเจคผูกกับ EAS แล้ว (บัญชี jame_jomchanpan, projectId อยู่ใน app.config.ts)
EAS_NO_VCS=1 npx eas-cli@latest build --profile preview --platform android   # APK แจกทดสอบ (EAS_NO_VCS=1 จนกว่าจะ commit repo)
npx eas-cli@latest build --profile production --platform all      # AAB + IPA
npx eas-cli@latest submit --platform android|ios
npx eas-cli@latest update --channel production --message "..."   # แก้ JS โดยไม่ผ่าน store
```

ค่าที่ต้องตั้งก่อน build จริง (ดู `app.config.ts`, `eas.json`):

| ค่า | ใช้ทำอะไร |
|---|---|
| `EXPO_PUBLIC_API_URL` (ใน `eas.json` ต่อ profile) | URL ของ petcare — preview/production ชี้เว็บจริง `https://petcare-servers-9pqpixb37.vercel.app` แล้ว |
| `GOOGLE_MAPS_ANDROID_KEY` | แผนที่บน Android |
| `APP_DOMAIN` | universal link / app link (ลิงก์แชร์น้อง/claim/คลินิก เปิดในแอป) |
| ฝั่ง petcare: `EXPO_ACCESS_TOKEN` (ไม่บังคับ) | ถ้าเปิด enhanced push security ใน Expo |

## โครงสร้าง

```
src/
├── app/                 # expo-router — (auth) ก่อนเข้าระบบ · (app) เจ้าของสัตว์ · (vet) หมอ · (clinic) คลินิก · (shared) แชท/แจ้งเตือน/ตั้งค่าที่ทุก role ใช้
├── api/                 # client (Bearer + error ภาษาไทย), endpoints, types ของ /api/mobile/* (+ staffEndpoints/staffTypes ของหมอ/คลินิก)
├── features/            # queries.ts / staffQueries.ts — hook ดึงข้อมูล (TanStack Query) หน้าจอดึงผ่านสองไฟล์นี้เท่านั้น
├── components/          # ui/ (ปุ่ม การ์ด ช่องกรอก ปฏิทิน ...) + การ์ดคลินิก/นัด/น้อง, ฟอร์มจอง/รีวิว/น้อง, staff/ (ฟอร์มจบเคส, แฟ้มน้อง, การ์ดคำขอ)
├── shared/              # ⚠️ กติกาที่ copy จาก petcare (petStatus, petAge, phone) + พอร์ต (apptTone, species)
├── theme/               # token สีจาก globals.css + ฟอนต์ Sarabun + โหมดมืด
├── state/               # session (JWT ใน SecureStore), prefs (ธีม)
└── lib/                 # format วันเวลาไทย, ลิงก์เว็บ→แอป, push, รูป, storage
tests/                   # jest-expo
scripts/check-sync.mjs   # เทียบไฟล์กติกากับ petcare
```
