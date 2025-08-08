// Calendar data fetching utilities with EODHD Economic Events
export async function fetchCalendar({
  from,
  to,
  country,
  limit = 200
}: {
  from: string;
  to: string;
  country?: string;
  limit?: number;
}) {
  const u = new URL("/api/eodhd/calendar", location.origin);
  u.searchParams.set("from", from);  // YYYY-MM-DD
  u.searchParams.set("to", to);      // YYYY-MM-DD
  if (country) u.searchParams.set("countries", country);
  u.searchParams.set("limit", String(limit));
  
  const r = await fetch(u.toString());
  if (!r.ok) throw new Error(`Calendar API error: ${r.status}`);
  
  return r.json();
}

// Adapt EODHD calendar data to our table format
export const adaptCalendar = (x: any) => ({
  date: x.date || x.event_date || x.released || "",
  time: x.time || x.event_time || "",
  country: x.country || x.country_code || "",
  title: x.title || x.event || "",
  importance: x.importance || x.impact || "",
  actual: x.actual ?? x.value ?? "",
  forecast: x.forecast ?? "",
  previous: x.previous ?? ""
});

// Gregorian formatter only - no Hijri calendar
export function formatCalendarDate(dateString: string, locale: string = "en-US"): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const fmt = new Intl.DateTimeFormat(locale, {
      calendar: "gregory", // Explicitly use Gregorian calendar only
      timeZone: "UTC",
      hour12: false,
      year: "numeric",
      month: "2-digit", 
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
    
    return fmt.format(date);
  } catch (error) {
    console.warn("Date formatting error:", error);
    return dateString;
  }
}

// Get date range for current week
export function getCurrentWeekRange(): { from: string; to: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Start of week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // End of week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return {
    from: startOfWeek.toISOString().split('T')[0], // YYYY-MM-DD
    to: endOfWeek.toISOString().split('T')[0]
  };
}
