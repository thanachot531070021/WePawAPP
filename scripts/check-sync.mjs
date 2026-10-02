#!/usr/bin/env node
/**
 * เทียบไฟล์กติกาที่ copy มาจาก petcare (src/shared/*) กับต้นฉบับ — ต้องเหมือนกันทุกบรรทัด
 * (ยกเว้นบรรทัด import ที่ต่างกันตามโครงสร้างโปรเจค)
 *
 * ใช้: npm run sync:check   (ต้องมี repo petcare อยู่ที่ ../petcare หรือกำหนด PETCARE_DIR)
 * ถ้าไม่ตรง → แก้ที่ petcare ก่อน แล้ว copy มาใหม่ อย่าแก้ฝั่งแอปเอง
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const petcare = resolve(process.env.PETCARE_DIR ?? join(root, "..", "petcare"));

const PAIRS = [
  ["src/shared/petStatus.ts", "lib/petStatus.ts"],
  ["src/shared/petAge.ts", "lib/petAge.ts"],
  ["src/shared/phone.ts", "lib/phone.ts"],
];

/** ค่าที่พอร์ตด้วยมือ (ไม่ได้ copy ทั้งไฟล์) — ตรวจว่าค่าสีของทุกสถานะยังตรงกัน */
const TONE_APP = "src/shared/apptTone.ts";
const TONE_WEB = "components/account/MobileAccountView.tsx";
/** สี brand ใน globals.css ↔ src/theme/tokens.ts */
const TOKENS_APP = "src/theme/tokens.ts";
const TOKENS_WEB = "app/globals.css";

if (!existsSync(petcare)) {
  console.error(`ไม่พบ repo petcare ที่ ${petcare} — ตั้ง PETCARE_DIR ให้ชี้ไปที่ repo`);
  process.exit(2);
}

const norm = (s) =>
  s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => !/^import\s/.test(l))
    .join("\n")
    .trim();

let failed = 0;
for (const [app, web] of PAIRS) {
  const a = norm(readFileSync(join(root, app), "utf8"));
  const w = norm(readFileSync(join(petcare, web), "utf8"));
  if (a === w) console.log(`✓ ${app} = petcare/${web}`);
  else {
    failed++;
    console.error(`✗ ${app} ไม่ตรงกับ petcare/${web}`);
  }
}

// APPT_TONE: เทียบ hex ทุกค่าที่อยู่ในบล็อก requested…no_show
const hexes = (s) => (s.match(/#[0-9a-f]{6}/gi) ?? []).map((x) => x.toLowerCase());
const webTone = readFileSync(join(petcare, TONE_WEB), "utf8");
const block = webTone.slice(webTone.indexOf("const APPT_TONE"), webTone.indexOf("function toneOf"));
const appTone = readFileSync(join(root, TONE_APP), "utf8");
const appBlock = appTone.slice(appTone.indexOf("export const APPT_TONE"), appTone.indexOf("export function toneOf"));
if (JSON.stringify(hexes(block)) === JSON.stringify(hexes(appBlock))) console.log(`✓ ${TONE_APP} สีตรงกับ APPT_TONE ของเว็บ`);
else {
  failed++;
  console.error(`✗ ${TONE_APP} สีไม่ตรงกับ APPT_TONE ใน petcare/${TONE_WEB}`);
}

// brand-50…900
const css = readFileSync(join(petcare, TOKENS_WEB), "utf8");
const tokens = readFileSync(join(root, TOKENS_APP), "utf8");
for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
  const web = css.match(new RegExp(`--brand-${step}:\\s*(#[0-9a-f]{6})`, "i"))?.[1]?.toLowerCase();
  const app = tokens.match(new RegExp(`\\b${step}:\\s*"(#[0-9a-f]{6})"`, "i"))?.[1]?.toLowerCase();
  if (web !== app) {
    failed++;
    console.error(`✗ brand-${step}: เว็บ ${web} ≠ แอป ${app}`);
  }
}
if (!failed) console.log("✓ brand 50–900 ตรงกับ globals.css");

process.exit(failed ? 1 : 0);
