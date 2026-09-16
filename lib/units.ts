export type WeightUnit = "kg" | "lbs";

export const LB_PER_KG = 2.20462262185;

export const KG_PER_LB = 1 / LB_PER_KG;

export function toUnit(kg: number, unit: WeightUnit): number {
  return unit === "lbs" ? kg * LB_PER_KG : kg;
}

export function toKg(value: number, unit: WeightUnit): number {
  return unit === "lbs" ? value / LB_PER_KG : value;
}

export function stepFor(unit: WeightUnit, kgStep: number): number {
  return unit === "lbs" ? Math.round(kgStep * LB_PER_KG) : kgStep;
}

export function fmt(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function displayWeight(kg: number, unit: WeightUnit): string {
  return fmt(toUnit(kg, unit));
}