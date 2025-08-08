import { ar } from "./ar";

export const t = (k: keyof typeof ar, locale: "en" | "ar", fallback: string) =>
  locale === "ar" ? ar[k] ?? fallback : fallback;

// Type-safe translation function with better key checking
export function translate(key: keyof typeof ar, locale: "en" | "ar", fallback: string): string {
  if (locale === "ar") {
    return ar[key] || fallback;
  }
  return fallback;
}

// Get all available translation keys
export const getTranslationKeys = () => Object.keys(ar) as (keyof typeof ar)[];

// Check if a translation exists
export const hasTranslation = (key: string, locale: "en" | "ar"): boolean => {
  if (locale === "ar") {
    return key in ar;
  }
  return false;
};
