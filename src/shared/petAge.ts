import type { PetSpecies } from "./species";

export type HumanAgeEstimate = {
  label: string;
  method: string;
  note: string | null;
};

export function ageYearsFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  if (birth > now) return null;
  const days = (now.getTime() - birth.getTime()) / 86_400_000;
  return days / 365.2425;
}

export function formatPetAge(birthDate: string | null): string {
  const yearsFloat = ageYearsFromBirthDate(birthDate);
  if (yearsFloat === null) return "ยังไม่ระบุวันเกิด";

  const birth = new Date(`${birthDate}T00:00:00`);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0 && months <= 0) return "น้อยกว่า 1 เดือน";
  if (years <= 0) return `${months} เดือน`;
  if (months <= 0) return `${years} ปี`;
  return `${years} ปี ${months} เดือน`;
}

export function estimateHumanAge(
  species: PetSpecies,
  birthDate: string | null
): HumanAgeEstimate | null {
  const petYears = ageYearsFromBirthDate(birthDate);
  if (petYears === null) return null;

  if (species === "dog") {
    if (petYears < 1) {
      return {
        label: "ยังไม่คำนวณ",
        method: "Dog DNA methylation",
        note: "สูตร DNA methylation เหมาะกับสุนัขอายุ 1 ปีขึ้นไป จึงยังไม่เทียบเป็นอายุคนในช่วงลูกสุนัข",
      };
    }

    const humanYears = 16 * Math.log(petYears) + 31;
    return {
      label: `ประมาณ ${Math.round(humanYears)} ปีคน`,
      method: "Dog DNA methylation",
      note: "คำนวณจากสูตร 16 x ln(อายุสุนัขเป็นปี) + 31 โดย Math.log คือ ln และผลลัพธ์เป็นค่าประมาณ",
    };
  }

  return null;
}
