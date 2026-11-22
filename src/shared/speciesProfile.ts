// กติกาการเก็บข้อมูลสัตว์ตามชนิด — ที่เดียวที่ตัดสินว่าชนิดไหนถามค่าอะไร หน่วยอะไร รับช่วงไหน
// ไฟล์นี้ไม่แตะ DB ใช้ได้ทั้ง server (ตรวจค่า) และ client (ฟอร์ม/การ์ด/กราฟ)
//
// หลักคิด: ไม่ตัดคอลัมน์ทิ้ง — ค่าที่ไม่เหมาะกับชนิดแค่ "ไม่ถามตามปกติ" (hidden)
// ฝั่งคลินิกยังเปิด "แสดงทุกช่อง" บันทึกได้ และประวัติเดิมแสดงครบทุกค่าที่มี

export type MetricKey =
  | "weight_kg"
  | "body_length_cm"
  | "height_cm"
  | "body_condition_score"
  | "temperature_c"
  | "heart_rate_bpm"
  | "respiratory_rate_bpm";

/** primary = โชว์ทันที · optional = อยู่ใต้ "ค่าอื่น ๆ" · hidden = ไม่ถามตามปกติ */
export type MetricLevel = "primary" | "optional" | "hidden";
export type Audience = "owner" | "clinic";
export type WeightUnit = "kg" | "g";

type Range = readonly [min: number, max: number];
/** [เจ้าของกรอก, คลินิกกรอก] */
type Levels = Record<MetricKey, readonly [MetricLevel, MetricLevel]>;

export type IntakeQuestion = {
  key: string;
  label: string;
  kind?: "text" | "number" | "choice";
  unit?: string;
  placeholder?: string;
  options?: string[];
};

type SpeciesProfile = {
  /** หน่วยที่ฟอร์มเปิดมาให้ — ผู้กรอกสลับ กก./กรัม เองได้ */
  weightUnit: WeightUnit;
  levels: Levels;
  /** ช่วงที่ "เป็นไปได้" ไว้กันพิมพ์ผิดหรือสลับหน่วย — ไม่ใช่ค่าปกติ */
  ranges: Record<MetricKey, Range>;
  /** ค่าปกติโดยประมาณ (ตัวโตเต็มวัยขณะพัก) — คำใบ้อย่างเดียว ชนิดที่ต่างกันมากในกลุ่มเดียวไม่ใส่ */
  normal?: Partial<Record<MetricKey, string>>;
  lengthLabel: string;
  lengthHint?: string;
  weightHint?: string;
  /** มีวัคซีนพื้นฐานที่ควรฉีดทุกตัว — ถ้าไม่มี จะไม่เตือน "ยังไม่มีประวัติวัคซีน" */
  routineVaccines: boolean;
  neuterRelevant: boolean;
  microchipRelevant: boolean;
  vaccineHint: string;
  /** คำถามการเลี้ยงดูตอน Intake (เก็บใน clinic_intake_forms.answers) */
  intake: IntakeQuestion[];
};

const P = "primary" as const;
const O = "optional" as const;
const H = "hidden" as const;

// ── คำถาม Intake ─────────────────────────────────────────────────────────────
const APPETITE: IntakeQuestion = {
  key: "appetite",
  label: "การกินอาหาร",
  kind: "choice",
  options: ["กินปกติ", "กินน้อยลง", "ไม่กินเลย", "กินมากขึ้น"],
};
const STOOL: IntakeQuestion = {
  key: "stool",
  label: "การขับถ่าย",
  kind: "choice",
  options: ["ปกติ", "ถ่ายเหลว", "ท้องผูก/ถ่ายน้อย", "ไม่ถ่าย"],
};
const PARASITE: IntakeQuestion = {
  key: "parasite_prevention",
  label: "ยาป้องกันเห็บหมัด/พยาธิหนอนหัวใจล่าสุด",
  placeholder: "ยี่ห้อ + ให้ล่าสุดเมื่อไร",
};
const DEWORM: IntakeQuestion = {
  key: "deworming",
  label: "ถ่ายพยาธิล่าสุด",
  placeholder: "เช่น 2 เดือนก่อน",
};
const DIET: IntakeQuestion = { key: "diet", label: "อาหารหลัก", placeholder: "ชนิด/ยี่ห้อ และปริมาณ" };
const ENCLOSURE: IntakeQuestion = { key: "enclosure", label: "ที่อยู่/กรง", placeholder: "ขนาด วัสดุรองพื้น" };
const LAST_EAT_POOP: IntakeQuestion = {
  key: "last_eat_poop",
  label: "กิน/ถ่ายครั้งล่าสุด",
  placeholder: "เช่น ไม่กินตั้งแต่เมื่อวานเย็น ยังถ่ายปกติ",
};

// ── ระดับการถาม ──────────────────────────────────────────────────────────────
const MAMMAL_LEVELS: Levels = {
  weight_kg: [P, P],
  body_condition_score: [O, P],
  temperature_c: [O, P],
  heart_rate_bpm: [O, P],
  respiratory_rate_bpm: [O, P],
  height_cm: [O, O],
  body_length_cm: [O, O],
};

// สัตว์ตัวเล็ก/ตื่นตกใจง่าย: เจ้าของไม่ควรวัดไข้ทางทวารเอง แต่นับการหายใจได้
const SMALL_MAMMAL_LEVELS: Levels = {
  weight_kg: [P, P],
  body_condition_score: [O, O],
  temperature_c: [H, O],
  heart_rate_bpm: [H, O],
  respiratory_rate_bpm: [O, P],
  height_cm: [H, H],
  body_length_cm: [H, O],
};

const PROFILES: Record<string, SpeciesProfile> = {
  dog: {
    weightUnit: "kg",
    levels: MAMMAL_LEVELS,
    ranges: {
      weight_kg: [0.05, 150],
      body_length_cm: [1, 300],
      height_cm: [1, 150],
      body_condition_score: [1, 9],
      temperature_c: [30, 45],
      heart_rate_bpm: [20, 350],
      respiratory_rate_bpm: [2, 300],
    },
    normal: {
      temperature_c: "37.5–39.2",
      heart_rate_bpm: "60–140 (พันธุ์เล็ก/ลูกสุนัขสูงกว่า)",
      respiratory_rate_bpm: "10–30 ตอนหลับ",
    },
    lengthLabel: "ความยาวลำตัว",
    lengthHint: "ต้นคอถึงโคนหาง",
    routineVaccines: true,
    neuterRelevant: true,
    microchipRelevant: true,
    vaccineHint: "เช่น พิษสุนัขบ้า (Rabies), DHPPi/L, ไอกรนสุนัข",
    intake: [
      APPETITE,
      STOOL,
      {
        key: "housing",
        label: "การเลี้ยง",
        kind: "choice",
        options: ["เลี้ยงในบ้าน", "เลี้ยงนอกบ้าน", "ทั้งในและนอกบ้าน"],
      },
      PARASITE,
      DEWORM,
    ],
  },
  cat: {
    weightUnit: "kg",
    levels: { ...MAMMAL_LEVELS, height_cm: [H, O] },
    ranges: {
      weight_kg: [0.05, 20],
      body_length_cm: [1, 150],
      height_cm: [1, 60],
      body_condition_score: [1, 9],
      temperature_c: [30, 45],
      heart_rate_bpm: [40, 400],
      respiratory_rate_bpm: [4, 200],
    },
    normal: {
      temperature_c: "38.0–39.2",
      heart_rate_bpm: "140–220",
      respiratory_rate_bpm: "20–30 ตอนหลับ",
    },
    lengthLabel: "ความยาวลำตัว",
    lengthHint: "ต้นคอถึงโคนหาง",
    routineVaccines: true,
    neuterRelevant: true,
    microchipRelevant: true,
    vaccineHint: "เช่น พิษสุนัขบ้า (Rabies), FVRCP (3 โรค/4 โรค), FeLV",
    intake: [
      APPETITE,
      STOOL,
      {
        key: "urination",
        label: "การปัสสาวะ/กระบะทราย",
        kind: "choice",
        options: ["ปกติ", "เข้ากระบะบ่อยแต่ออกน้อย", "ปัสสาวะนอกกระบะ", "มีเลือดปน"],
      },
      {
        key: "housing",
        label: "การเลี้ยง",
        kind: "choice",
        options: ["อยู่ในบ้านล้วน", "ออกนอกบ้านได้"],
      },
      PARASITE,
      DEWORM,
    ],
  },
  rabbit: {
    weightUnit: "kg",
    levels: SMALL_MAMMAL_LEVELS,
    ranges: {
      weight_kg: [0.03, 12],
      body_length_cm: [1, 100],
      height_cm: [1, 60],
      body_condition_score: [1, 9],
      temperature_c: [30, 45],
      heart_rate_bpm: [60, 400],
      respiratory_rate_bpm: [10, 300],
    },
    normal: {
      temperature_c: "38.5–40.0",
      heart_rate_bpm: "180–250",
      respiratory_rate_bpm: "30–60",
    },
    lengthLabel: "ความยาวลำตัว",
    routineVaccines: false,
    neuterRelevant: true,
    microchipRelevant: true,
    vaccineHint: "กระต่ายในไทยไม่มีวัคซีนประจำ — บันทึกถ้าเคยฉีด เช่น RHDV",
    intake: [
      APPETITE,
      {
        key: "hay",
        label: "หญ้าแห้ง (hay)",
        kind: "choice",
        options: ["กินได้ไม่จำกัด", "ให้บางมื้อ", "ไม่ได้ให้"],
      },
      {
        key: "droppings",
        label: "มูลล่าสุด",
        placeholder: "เม็ดเล็กลง/น้อยลง/ไม่ถ่ายตั้งแต่เมื่อไร",
      },
      {
        key: "housing",
        label: "การเลี้ยง",
        kind: "choice",
        options: ["อยู่ในกรง", "ปล่อยในบ้าน", "กรง + ปล่อยวิ่งบางเวลา"],
      },
    ],
  },
  rodent: {
    weightUnit: "g",
    levels: SMALL_MAMMAL_LEVELS,
    ranges: {
      weight_kg: [0.005, 20],
      body_length_cm: [1, 120],
      height_cm: [1, 60],
      body_condition_score: [1, 9],
      temperature_c: [30, 45],
      heart_rate_bpm: [60, 900],
      respiratory_rate_bpm: [10, 300],
    },
    lengthLabel: "ความยาวลำตัว",
    routineVaccines: false,
    neuterRelevant: true,
    microchipRelevant: true,
    vaccineHint: "สัตว์ฟันแทะไม่มีวัคซีนประจำ",
    intake: [
      APPETITE,
      STOOL,
      { ...DIET, placeholder: "อาหารเม็ด/ธัญพืช/ผัก + หญ้าแห้ง (หนูตะเภา/ชินชิล่า)" },
      {
        key: "vitamin_c",
        label: "เสริมวิตามินซี (หนูตะเภา)",
        kind: "choice",
        options: ["ให้ประจำ", "ไม่ได้ให้", "ไม่ใช่หนูตะเภา"],
      },
      { ...ENCLOSURE, placeholder: "ขนาดกรง วัสดุรองพื้น วงล้อ" },
    ],
  },
  bird: {
    weightUnit: "g",
    levels: {
      weight_kg: [P, P],
      // นกใช้ keel score ไม่ใช่ BCS 1–9 / วัดไข้นกไม่ทำเป็นปกติ (เครียด)
      body_condition_score: [H, H],
      temperature_c: [H, H],
      heart_rate_bpm: [H, O],
      respiratory_rate_bpm: [O, P],
      height_cm: [H, H],
      body_length_cm: [H, H],
    },
    ranges: {
      weight_kg: [0.003, 20],
      body_length_cm: [1, 200],
      height_cm: [1, 200],
      body_condition_score: [1, 9],
      temperature_c: [35, 46],
      heart_rate_bpm: [60, 1000],
      respiratory_rate_bpm: [5, 300],
    },
    lengthLabel: "ความยาวลำตัว",
    weightHint: "น้ำหนักคือสัญญาณสุขภาพหลักของนก ชั่งเป็นกรัม",
    routineVaccines: false,
    neuterRelevant: false,
    microchipRelevant: true,
    vaccineHint: "นกเลี้ยงส่วนใหญ่ไม่มีวัคซีนประจำ — ไก่/นกพิราบอาจมี เช่น นิวคาสเซิล ฝีดาษ",
    intake: [
      APPETITE,
      { ...DIET, placeholder: "เมล็ด / อาหารเม็ด / ผลไม้ผัก — สัดส่วนโดยประมาณ" },
      { key: "droppings", label: "ลักษณะมูล", placeholder: "สี ความเหลว ปริมาณ เทียบกับปกติ" },
      { ...ENCLOSURE, label: "กรง/เวลานอกกรง", placeholder: "ขนาดกรง ปล่อยบินวันละกี่ชั่วโมง" },
      { key: "other_birds", label: "นกตัวอื่น/นกใหม่ใน 3 เดือน", placeholder: "มีกี่ตัว เพิ่งรับนกใหม่ไหม" },
      {
        key: "egg_laying",
        label: "การออกไข่ (ตัวเมีย)",
        kind: "choice",
        options: ["ไม่เคย", "เคยออกไข่", "กำลังออกไข่", "ไม่ทราบเพศ"],
      },
    ],
  },
  reptile: {
    weightUnit: "g",
    levels: {
      weight_kg: [P, P],
      body_length_cm: [P, P],
      // อุณหภูมิร่างกายขึ้นกับสิ่งแวดล้อม — ถามอุณหภูมิตู้ใน Intake แทน
      body_condition_score: [H, H],
      temperature_c: [H, H],
      heart_rate_bpm: [H, O],
      respiratory_rate_bpm: [H, O],
      height_cm: [H, H],
    },
    ranges: {
      weight_kg: [0.001, 300],
      body_length_cm: [1, 1000],
      height_cm: [1, 200],
      body_condition_score: [1, 9],
      temperature_c: [10, 45],
      heart_rate_bpm: [1, 200],
      respiratory_rate_bpm: [1, 100],
    },
    lengthLabel: "ความยาว",
    lengthHint: "งู/กิ้งก่า: ปลายจมูกถึงปลายหาง · เต่า: ความยาวกระดองหลัง",
    routineVaccines: false,
    neuterRelevant: false,
    microchipRelevant: true,
    vaccineHint: "สัตว์เลื้อยคลานไม่มีวัคซีนประจำ",
    intake: [
      APPETITE,
      { key: "last_poop", label: "ถ่ายล่าสุด", placeholder: "เมื่อไร ลักษณะอย่างไร" },
      { ...ENCLOSURE, label: "ตู้/กรง" },
      { key: "basking_temp_c", label: "อุณหภูมิจุดอาบแดด", kind: "number", unit: "°C" },
      { key: "cool_temp_c", label: "อุณหภูมิฝั่งเย็น", kind: "number", unit: "°C" },
      { key: "humidity_pct", label: "ความชื้น", kind: "number", unit: "%" },
      { key: "uvb", label: "หลอด UVB", placeholder: "ชนิด ใช้มากี่เดือน ระยะห่าง" },
      { ...DIET, label: "อาหาร/แคลเซียม", placeholder: "แมลง/ผัก/หนู เสริมแคลเซียม-D3 บ่อยแค่ไหน" },
      { key: "last_shed", label: "ลอกคราบล่าสุด", placeholder: "เมื่อไร ลอกครบไหม" },
    ],
  },
  fish: {
    weightUnit: "g",
    levels: {
      body_length_cm: [P, P],
      // ปลาเล็กไม่ชั่งกัน — ชั่งเฉพาะตัวใหญ่ (คาร์ป อะโรวาน่า)
      weight_kg: [O, O],
      body_condition_score: [H, H],
      temperature_c: [H, H],
      heart_rate_bpm: [H, H],
      respiratory_rate_bpm: [H, H],
      height_cm: [H, H],
    },
    ranges: {
      weight_kg: [0.0005, 200],
      body_length_cm: [0.5, 300],
      height_cm: [0.5, 100],
      body_condition_score: [1, 9],
      temperature_c: [10, 40],
      heart_rate_bpm: [1, 300],
      respiratory_rate_bpm: [1, 300],
    },
    lengthLabel: "ความยาวทั้งตัว",
    lengthHint: "ปลายปากถึงปลายหาง",
    weightHint: "ไม่บังคับ — ชั่งเฉพาะปลาตัวใหญ่ เช่น คาร์ป อะโรวาน่า",
    routineVaccines: false,
    neuterRelevant: false,
    microchipRelevant: false,
    vaccineHint: "ปลาไม่มีวัคซีนประจำ",
    intake: [
      APPETITE,
      { key: "tank_volume_l", label: "ขนาดตู้/บ่อ", kind: "number", unit: "ลิตร" },
      { key: "water_temp_c", label: "อุณหภูมิน้ำ", kind: "number", unit: "°C" },
      { key: "water_ph", label: "pH", kind: "number" },
      { key: "ammonia_ppm", label: "แอมโมเนีย", kind: "number", unit: "ppm" },
      { key: "nitrite_ppm", label: "ไนไตรต์", kind: "number", unit: "ppm" },
      { key: "nitrate_ppm", label: "ไนเตรต", kind: "number", unit: "ppm" },
      { key: "filtration", label: "ระบบกรอง/ออกซิเจน", placeholder: "ชนิดกรอง ปั๊มลม" },
      { key: "water_change", label: "เปลี่ยนน้ำล่าสุด", placeholder: "เมื่อไร กี่ %" },
      {
        key: "tank_mates",
        label: "ปลาตัวอื่น/ลงปลาใหม่",
        placeholder: "มีกี่ตัว ลงปลาใหม่ล่าสุดเมื่อไร กักโรคไหม",
      },
    ],
  },
  exotic: {
    weightUnit: "g",
    levels: SMALL_MAMMAL_LEVELS,
    ranges: {
      weight_kg: [0.003, 300],
      body_length_cm: [1, 400],
      height_cm: [1, 200],
      body_condition_score: [1, 9],
      temperature_c: [10, 46],
      heart_rate_bpm: [1, 1000],
      respiratory_rate_bpm: [1, 400],
    },
    lengthLabel: "ความยาวลำตัว",
    routineVaccines: false,
    neuterRelevant: true,
    microchipRelevant: true,
    vaccineHint: "เช่น เฟอเรท: ไข้หัดสุนัข (Distemper), พิษสุนัขบ้า",
    intake: [APPETITE, STOOL, DIET, ENCLOSURE, LAST_EAT_POOP],
  },
  other: {
    weightUnit: "kg",
    levels: {
      weight_kg: [P, P],
      body_condition_score: [O, O],
      temperature_c: [O, O],
      heart_rate_bpm: [O, O],
      respiratory_rate_bpm: [O, O],
      height_cm: [O, O],
      body_length_cm: [O, O],
    },
    ranges: {
      weight_kg: [0.001, 1500],
      body_length_cm: [0.5, 1000],
      height_cm: [0.5, 300],
      body_condition_score: [1, 9],
      temperature_c: [10, 46],
      heart_rate_bpm: [1, 1000],
      respiratory_rate_bpm: [1, 400],
    },
    lengthLabel: "ความยาวลำตัว",
    routineVaccines: false,
    neuterRelevant: true,
    microchipRelevant: true,
    vaccineHint: "ชื่อวัคซีนตามที่คลินิกแจ้ง",
    intake: [APPETITE, STOOL, DIET, ENCLOSURE],
  },
};

export function speciesProfile(species: string | null | undefined): SpeciesProfile {
  return PROFILES[species ?? ""] ?? PROFILES.other;
}

// ── ค่าวัด ──────────────────────────────────────────────────────────────────
/** ลำดับมาตรฐานของค่าวัด — ฟอร์ม/การ์ด/กราฟเรียงตามนี้หลังจัดกลุ่มตามระดับ */
export const METRIC_KEYS: MetricKey[] = [
  "weight_kg",
  "body_length_cm",
  "body_condition_score",
  "temperature_c",
  "heart_rate_bpm",
  "respiratory_rate_bpm",
  "height_cm",
];

const METRIC_LABEL: Record<Exclude<MetricKey, "body_length_cm">, string> = {
  weight_kg: "น้ำหนัก",
  height_cm: "ส่วนสูง (ถึงไหล่)",
  body_condition_score: "BCS (1–9)",
  temperature_c: "อุณหภูมิร่างกาย",
  heart_rate_bpm: "ชีพจร",
  respiratory_rate_bpm: "อัตราการหายใจ",
};

const METRIC_SHORT: Record<MetricKey, string> = {
  weight_kg: "น้ำหนัก",
  body_length_cm: "ความยาว",
  height_cm: "ส่วนสูง",
  body_condition_score: "BCS",
  temperature_c: "อุณหภูมิ",
  heart_rate_bpm: "ชีพจร",
  respiratory_rate_bpm: "หายใจ",
};

const METRIC_UNIT: Record<Exclude<MetricKey, "weight_kg">, string> = {
  body_length_cm: "ซม.",
  height_cm: "ซม.",
  body_condition_score: "/9",
  temperature_c: "°C",
  heart_rate_bpm: "ครั้ง/นาที",
  respiratory_rate_bpm: "ครั้ง/นาที",
};

export const INTEGER_METRICS: ReadonlySet<MetricKey> = new Set([
  "body_condition_score",
  "heart_rate_bpm",
  "respiratory_rate_bpm",
]);

export function metricLabel(key: MetricKey, species?: string | null, short = false): string {
  if (short) return METRIC_SHORT[key];
  if (key === "body_length_cm") return speciesProfile(species).lengthLabel;
  return METRIC_LABEL[key];
}

/** หน่วยของค่า — น้ำหนักขึ้นกับหน่วยที่แสดง */
export function metricUnit(key: MetricKey, weightUnit: WeightUnit = "kg"): string {
  if (key === "weight_kg") return weightUnit === "g" ? "กรัม" : "กก.";
  return METRIC_UNIT[key];
}

export function metricLevel(species: string | null | undefined, key: MetricKey, audience: Audience): MetricLevel {
  const [owner, clinic] = speciesProfile(species).levels[key];
  return audience === "owner" ? owner : clinic;
}

/** ค่าวัดจัดกลุ่มตามระดับ เรียงตาม METRIC_KEYS */
export function metricsByLevel(species: string | null | undefined, audience: Audience) {
  const out: Record<MetricLevel, MetricKey[]> = { primary: [], optional: [], hidden: [] };
  for (const key of METRIC_KEYS) out[metricLevel(species, key, audience)].push(key);
  return out;
}

/** ค่าวัดเรียงจากสำคัญสุดของชนิดนี้ (ใช้เรียงการ์ด/ตัวเลือกกราฟ) */
export function metricsInPriority(species: string | null | undefined, audience: Audience = "clinic"): MetricKey[] {
  const g = metricsByLevel(species, audience);
  return [...g.primary, ...g.optional, ...g.hidden];
}

/** ค่าที่เป็นตัวแทน "การเติบโต" ของชนิดนี้ — ปลาใช้ความยาว ที่เหลือใช้น้ำหนัก */
export function primaryGrowthMetric(species: string | null | undefined): "weight_kg" | "body_length_cm" {
  return metricLevel(species, "weight_kg", "owner") === "primary" ? "weight_kg" : "body_length_cm";
}

export function weightUnitFor(species: string | null | undefined): WeightUnit {
  return speciesProfile(species).weightUnit;
}

/** กก. ↔ หน่วยที่กรอก — ปัดที่ 0.1 กรัม (0.0001 กก.) */
export function toKg(value: number, unit: WeightUnit): number {
  const kg = unit === "g" ? value / 1000 : value;
  return Math.round(kg * 10000) / 10000;
}

export function fromKg(kg: number, unit: WeightUnit): number {
  return unit === "g" ? Math.round(kg * 10000) / 10 : Math.round(kg * 10000) / 10000;
}

function toNumber(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** หน่วยที่อ่านง่ายสำหรับน้ำหนักนี้ — สัตว์ตัวเล็กเป็นกรัม แต่ถ้าหนักเกิน 1 กก. ก็แสดงเป็น กก. */
export function displayWeightUnit(kg: number, species?: string | null): WeightUnit {
  if (kg < 0.1) return "g";
  if (weightUnitFor(species) === "g" && kg < 1) return "g";
  return "kg";
}

/** "35 กรัม" / "5.2 กก." — null ถ้าไม่มีค่า */
export function formatWeight(kg: string | number | null | undefined, species?: string | null): string | null {
  const n = toNumber(kg);
  if (n === null) return null;
  const unit = displayWeightUnit(n, species);
  const value = fromKg(n, unit);
  return `${value.toLocaleString("th-TH", { maximumFractionDigits: unit === "g" ? 1 : 2 })} ${metricUnit("weight_kg", unit)}`;
}

/** ค่าวัด 1 ช่องพร้อมหน่วย — null ถ้าไม่มีค่า */
export function formatMetric(
  key: MetricKey,
  value: string | number | null | undefined,
  species?: string | null
): string | null {
  if (key === "weight_kg") return formatWeight(value, species);
  const n = toNumber(value);
  if (n === null) return null;
  const unit = metricUnit(key);
  const text = n.toLocaleString("th-TH", { maximumFractionDigits: 1 });
  return key === "body_condition_score" ? `${text}${unit}` : `${text} ${unit}`;
}

export type MeasurementLike = Partial<Record<MetricKey, string | number | null>>;

/** ค่าที่มีในการวัดครั้งนี้ เรียงตามความสำคัญของชนิด — ใช้แสดงการ์ดประวัติ */
export function measurementItems(m: MeasurementLike, species?: string | null) {
  return metricsInPriority(species)
    .map((key) => ({ key, label: metricLabel(key, species, true), value: formatMetric(key, m[key], species) }))
    .filter((x): x is { key: MetricKey; label: string; value: string } => x.value !== null);
}

/** ข้อความช่วงที่รับได้ เช่น "5 กรัม – 20 กก." */
export function rangeText(species: string | null | undefined, key: MetricKey): string {
  const [min, max] = speciesProfile(species).ranges[key];
  if (key === "weight_kg") return `${formatWeight(min, species)} – ${formatWeight(max, species)}`;
  return `${min}–${max} ${metricUnit(key)}`;
}

// ── Intake ───────────────────────────────────────────────────────────────────
export function intakeQuestions(species: string | null | undefined): IntakeQuestion[] {
  return speciesProfile(species).intake;
}

const INTAKE_LABELS: Record<string, IntakeQuestion> = Object.fromEntries(
  Object.values(PROFILES).flatMap((p) => p.intake.map((q) => [q.key, q] as const))
);

/** แปลง answers JSONB เป็นบรรทัดอ่านได้ (ข้าม key ภายในที่ขึ้นต้นด้วย _) */
export function intakeAnswerLines(answers: unknown): { label: string; value: string }[] {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return [];
  return Object.entries(answers as Record<string, unknown>)
    .filter(([key, value]) => !key.startsWith("_") && value !== null && value !== "")
    .map(([key, value]) => {
      const q = INTAKE_LABELS[key];
      const text = typeof value === "number" ? value.toLocaleString("th-TH") : String(value);
      return { label: q?.label ?? key, value: q?.unit ? `${text} ${q.unit}` : text };
    });
}

/** ตัวอย่างสายพันธุ์ใต้ช่อง "สายพันธุ์" ตามชนิดที่เลือก — เดิมขึ้น "Persian, Golden Retriever" แม้เลือกนก */
const BREED_HINTS: Record<string, string> = {
  dog: "เช่น ไทยหลังอาน, ชิวาวา, โกลเด้น รีทรีฟเวอร์",
  cat: "เช่น เปอร์เซีย, สก็อตติช โฟลด์, ไทย",
  bird: "เช่น หงส์หยก, ค็อกคาเทล, เลิฟเบิร์ด",
  rabbit: "เช่น ฮอลแลนด์ลอป, เนเธอร์แลนด์ดวาร์ฟ",
  rodent: "เช่น แฮมสเตอร์ไจแอนท์, หนูแกสบี้, ชินชิลล่า",
  reptile: "เช่น เต่าซูลคาต้า, อิกัวน่า, งูบอลไพธอน",
  fish: "เช่น ปลาทอง, ปลากัด, ปลาหมอสี",
  exotic: "เช่น ชูการ์ไกลเดอร์, เฟอร์เร็ต",
};

export function breedHint(species: string): string {
  return BREED_HINTS[species] ?? "ระบุชนิดหรือสายพันธุ์ (ถ้ารู้)";
}
