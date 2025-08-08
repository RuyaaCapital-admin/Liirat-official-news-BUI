// client/lib/calendar.ts
export async function fetchCalendar({
  from,
  to,
  countries = "",
  limit = 50,
  signal,
}: {
  from: string;
  to: string;
  countries?: string;
  limit?: number;
  signal?: AbortSignal;
}) {
  const qs = new URLSearchParams({
    from,
    to,
    countries,
    limit: String(limit),
  }).toString();

  const res = await fetch(`/api/eodhd/calendar?${qs}`, {
    signal,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`calendar HTTP ${res.status} ${text.slice(0,120)}`);
  }
  return res.json();
}

export const adaptCal = (x: any) => ({
  date: x.date ?? x.event_date ?? x.released ?? "",
  time: x.time ?? x.event_time ?? "",
  country: x.country ?? x.country_code ?? "",
  title: x.title ?? x.event ?? "",
  importance: x.importance ?? x.impact ?? null,
  actual: x.actual ?? x.value ?? "",
  forecast: x.forecast ?? "",
  previous: x.previous ?? "",
});

export const shortDT = (d: string, t: string, locale = "en") => {
  const dt = new Date(`${d}T${t || "00:00"}Z`);
  const day = String(dt.getUTCDate()).padStart(2, "0");
  const mon = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(dt);
  const yy = String(dt.getUTCFullYear()).slice(-2);
  const hm = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(dt);
  return `${day}-${mon}-${yy} ${hm}`;
};

export function sortCalendarByTime(events: any[]) {
  const toISO = (d: string, t: string) => `${d}T${t || "00:00"}:00Z`;
  return events.sort((a, b) => Date.parse(toISO(a.date, a.time)) - Date.parse(toISO(b.date, b.time)));
}

export function matchImportance(val: any, filterImportance: string) {
  if (filterImportance === "all" || !filterImportance) return true;
  return String(val || "").toLowerCase() === filterImportance;
}

export function formatCalendarDate(dateString: string, locale = "en-US"): string {
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
  } catch {
    return dateString;
  }
}

export function getCurrentWeekRange(): { from: string; to: string } {
  const today = new Date();
  const to = new Date(today);
  to.setDate(to.getDate() + 7);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { from: fmt(today), to: fmt(to) };
}

export const adaptCalendar = adaptCal;
