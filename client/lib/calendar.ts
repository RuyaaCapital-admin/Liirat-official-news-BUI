export async function fetchCalendar({
  from,
  to,
  countries,
  limit = 50,
}: {
  from: string;
  to: string;
  countries?: string;
  limit?: number;
}) {
  const u = new URL("/api/eodhd/calendar", location.origin);
  u.searchParams.set("from", from);
  u.searchParams.set("to", to);
  if (countries) u.searchParams.set("countries", countries);
  u.searchParams.set("limit", String(limit));
  const r = await fetch(u);
  if (!r.ok) throw new Error("calendar");
  return r.json();
}
export const adaptCal = (x: any) => ({
  // NO FALLBACK LABELS. EXACT FIELDS ONLY.
  date: x.date ?? x.event_date ?? x.released ?? "",
  time: x.time ?? x.event_time ?? "",
  country: x.country ?? x.country_code ?? "",
  title: x.title ?? x.event ?? "",
  importance: x.importance ?? x.impact ?? null,
  actual: x.actual ?? x.value ?? "",
  forecast: x.forecast ?? "",
  previous: x.previous ?? "",
});

// Gregorian-only short datetime formatter
export const shortDT = (d: string, t: string, locale = "en") => {
  const dt = new Date(`${d}T${t || "00:00"}Z`);
  const day = String(dt.getUTCDate()).padStart(2, "0");
  const mon = new Intl.DateTimeFormat(locale, {
    month: "short",
    timeZone: "UTC",
  }).format(dt); // Aug
  const yy = String(dt.getUTCFullYear()).slice(-2);
  const hm = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(dt);
  return `${day}-${mon}-${yy} ${hm}`; // e.g., 25-Aug-25 07:30
};

// Sort calendar events by nearest time
export function sortCalendarByTime(events: any[]) {
  const toISO = (d: string, t: string) => `${d}T${t || "00:00"}:00Z`;
  return events.sort(
    (a, b) =>
      Date.parse(toISO(a.date, a.time)) - Date.parse(toISO(b.date, b.time)),
  );
}

// Filter functions for exact matching
export function matchImportance(val: any, filterImportance: string) {
  if (filterImportance === "all" || !filterImportance) return true;
  return String(val || "").toLowerCase() === filterImportance;
}

// Calendar data fetching utilities with Gregorian-only formatting
export function formatCalendarDate(
  dateString: string,
  locale: string = "en-US",
): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const timeFmt = new Intl.DateTimeFormat(locale, {
      calendar: "gregory",
      timeZone: "UTC",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    return timeFmt.format(date);
  } catch (error) {
    console.warn("Date formatting error:", error);
    return dateString;
  }
}

// Get date range for current week
export function getCurrentWeekRange(): { from: string; to: string } {
  const today = new Date();
  const to = new Date(today);
  to.setDate(to.getDate() + 7); // next 7 days
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return {
    from: fmt(today),
    to: fmt(to),
  };
}

// Alias for backward compatibility
export const adaptCalendar = adaptCal;
