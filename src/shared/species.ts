/**
 * ชนิดสัตว์ — คู่กับ petcare/lib/utils.ts (SPECIES_LABEL, ALL_SPECIES)
 * และ components/pets/SpeciesIcon.tsx (SPECIES_TINT, SPECIES_PHOTOS, pickPhoto)
 */
import type { ImageSourcePropType } from "react-native";

export type PetSpecies =
  | "dog"
  | "cat"
  | "bird"
  | "rabbit"
  | "rodent"
  | "reptile"
  | "fish"
  | "exotic"
  | "other";

export const ALL_SPECIES: PetSpecies[] = [
  "dog",
  "cat",
  "bird",
  "rabbit",
  "rodent",
  "reptile",
  "fish",
  "exotic",
  "other",
];

export const SPECIES_LABEL: Record<PetSpecies, string> = {
  dog: "สุนัข",
  cat: "แมว",
  bird: "นก",
  rabbit: "กระต่าย",
  rodent: "หนู/แฮมสเตอร์",
  reptile: "สัตว์เลื้อยคลาน",
  fish: "ปลา",
  exotic: "สัตว์พิเศษ",
  other: "อื่นๆ",
};

export function getSpeciesLabel(species: string | null | undefined): string {
  if (!species) return "";
  if (species.startsWith("other:")) return species.slice("other:".length);
  return SPECIES_LABEL[species as PetSpecies] ?? species;
}

export function normalizeSpecies(species: string | null | undefined): PetSpecies {
  return species && species in SPECIES_LABEL ? (species as PetSpecies) : "other";
}

/** พื้น pastel ของอวาตาร์ (เว็บใช้ gradient 100→200, fg = เฉด 700) */
export const SPECIES_TINT: Record<PetSpecies, { from: string; to: string; fg: string }> = {
  dog: { from: "#d1fae5", to: "#a7f3d0", fg: "#047857" },
  cat: { from: "#fef3c7", to: "#fde68a", fg: "#b45309" },
  rabbit: { from: "#ede9fe", to: "#ddd6fe", fg: "#6d28d9" },
  bird: { from: "#dbeafe", to: "#bfdbfe", fg: "#1d4ed8" },
  rodent: { from: "#ffedd5", to: "#fed7aa", fg: "#c2410c" },
  reptile: { from: "#ecfccb", to: "#d9f99d", fg: "#4d7c0f" },
  fish: { from: "#cffafe", to: "#a5f3fc", fg: "#0e7490" },
  exotic: { from: "#fce7f3", to: "#fbcfe8", fg: "#be185d" },
  other: { from: "#f5f5f4", to: "#e7e5e4", fg: "#57534e" },
};

const PHOTO: Record<string, ImageSourcePropType> = {
  "dog-golden": require("../../assets/pets/dog-golden.png"),
  "dog-corgi": require("../../assets/pets/dog-corgi.png"),
  "dog-bichon": require("../../assets/pets/dog-bichon.png"),
  "cat-tabby": require("../../assets/pets/cat-tabby.png"),
  "cat-ragdoll": require("../../assets/pets/cat-ragdoll.png"),
  "cat-scottish": require("../../assets/pets/cat-scottish.png"),
  "rabbit-lop": require("../../assets/pets/rabbit-lop.png"),
  hamster: require("../../assets/pets/hamster.png"),
  guineapig: require("../../assets/pets/guineapig.png"),
  "bird-cockatiel": require("../../assets/pets/bird-cockatiel.png"),
  "fish-goldfish": require("../../assets/pets/fish-goldfish.png"),
};

const SPECIES_PHOTOS: Partial<Record<PetSpecies, string[]>> = {
  dog: ["dog-golden", "dog-corgi", "dog-bichon"],
  cat: ["cat-tabby", "cat-ragdoll", "cat-scottish"],
  rabbit: ["rabbit-lop"],
  rodent: ["hamster", "guineapig"],
  bird: ["bird-cockatiel"],
  fish: ["fish-goldfish"],
};

/**
 * ภาพประจำชนิด — seed ด้วย pet id ให้หน้าตาน้องตัวเดิมตรงกับเว็บทุกหน้า
 * (สูตร hash เดียวกับ pickPhoto ใน SpeciesIcon.tsx)
 */
export function getSpeciesPhoto(
  species: string | null | undefined,
  seed?: string | null
): ImageSourcePropType | null {
  const list = SPECIES_PHOTOS[normalizeSpecies(species)];
  if (!list) return null;
  if (!seed || list.length === 1) return PHOTO[list[0]];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PHOTO[list[h % list.length]];
}

export const GENDER_LABEL: Record<string, string> = {
  male: "ผู้",
  female: "เมีย",
  unknown: "ไม่ระบุ",
};
