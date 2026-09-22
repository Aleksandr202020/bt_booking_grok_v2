import type { CarCategory } from "./rules";

export const PRICE_CENTS: Readonly<Record<CarCategory, number>> = {
  passenger: 2500,
  crossover: 3000,
  minivan: 3500,
  commercial: 3500,
};

export const CATEGORY_LABELS_LV: Record<CarCategory, string> = {
  passenger: "Pasažieru auto",
  crossover: "Crossover / SUV",
  minivan: "Minivans",
  commercial: "Komerctransports",
};

export function getPriceCents(category: string): number {
  if (category in PRICE_CENTS) return PRICE_CENTS[category as CarCategory];
  return PRICE_CENTS.passenger;
}

export function isCarCategory(value: string): value is CarCategory {
  return value in PRICE_CENTS;
}
