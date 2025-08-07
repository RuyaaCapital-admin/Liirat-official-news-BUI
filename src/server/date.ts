export function toIsoUtc(input: unknown): string | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(+input) ? null : input.toISOString();
  if (typeof input === "number") {
    // epoch seconds or ms
    const ms = input > 1e12 ? input : input * 1000;
    const d = new Date(ms);
    return isNaN(+d) ? null : d.toISOString();
  }
  if (typeof input === "string") {
    // Handle "YYYY-MM-DD HH:mm:ss" and already-ISO strings
    const s = input.includes("T") ? input : input.replace(" ", "T");
    const iso = s.endsWith("Z") ? s : s + "Z";
    const d = new Date(iso);
    return isNaN(+d) ? null : d.toISOString();
  }
  return null;
}
