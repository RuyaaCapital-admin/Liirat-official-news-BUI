export async function fetchCalendar(params: { from:string; to:string; countries?:string; limit?:number }) {
  const u = new URL("/api/eodhd/calendar", location.origin);
  u.searchParams.set("from", params.from);
  u.searchParams.set("to", params.to);
  if (params.countries) u.searchParams.set("countries", params.countries);
  u.searchParams.set("limit", String(params.limit ?? 50));
  const r = await fetch(u); if (!r.ok) throw new Error("calendar"); return r.json();
}
export const adaptCalendar = (x:any)=>({
  date: x.date || x.event_date || x.released || "",
  time: x.time || x.event_time || "",
  country: x.country || x.country_code || "",
  event: x.title || x.event || "",
  category: x.category || "",
  importance: parseInt(String(x.importance || x.impact || "1")) || 1,
  actual: x.actual ?? x.value ?? "",
  forecast: x.forecast ?? "",
  previous: x.previous ?? ""
});

// Calendar data fetching utilities with Gregorian-only formatting
export function formatCalendarDate(dateString: string, locale: string = "en-US"): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const timeFmt = new Intl.DateTimeFormat(locale,{ calendar:"gregory", timeZone:"UTC", hour12:false,
      year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
    
    return timeFmt.format(date);
  } catch (error) {
    console.warn("Date formatting error:", error);
    return dateString;
  }
}

// Get date range for current week
export function getCurrentWeekRange(): { from: string; to: string } {
  const today = new Date();
  const to = new Date(today); to.setDate(to.getDate()+7); // next 7 days
  const pad = (n:number)=>String(n).padStart(2,"0");
  const fmt = (d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  
  return {
    from: fmt(today),
    to: fmt(to)
  };
}
