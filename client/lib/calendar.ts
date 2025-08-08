export async function fetchCalendar({from,to,countries,limit=50}:{from:string;to:string;countries?:string;limit?:number}){
  const u=new URL("/api/eodhd/calendar", location.origin);
  u.searchParams.set("from",from); u.searchParams.set("to",to);
  if(countries) u.searchParams.set("countries", countries);
  u.searchParams.set("limit", String(limit));
  const r=await fetch(u); if(!r.ok) throw new Error("calendar"); return r.json();
}
export const adaptCal=(x:any)=>({
  // NO FALLBACK LABELS. EXACT FIELDS ONLY.
  date: x.date ?? x.event_date ?? x.released ?? "",
  time: x.time ?? x.event_time ?? "",
  country: x.country ?? x.country_code ?? "",
  title: x.title ?? x.event ?? "",
  importance: x.importance ?? x.impact ?? null,
  actual: x.actual ?? x.value ?? "",
  forecast: x.forecast ?? "",
  previous: x.previous ?? ""
});

// Gregorian-only short datetime formatter
export const shortDT=(d:string,t:string,locale="en")=>{
  const dt=new Date(`${d}T${t||"00:00"}Z`);
  const day=String(dt.getUTCDate()).padStart(2,"0");
  const mon=new Intl.DateTimeFormat(locale,{month:"short",timeZone:"UTC"}).format(dt); // Aug
  const yy=String(dt.getUTCFullYear()).slice(-2);
  const hm=new Intl.DateTimeFormat(locale,{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"UTC"}).format(dt);
  return `${day}-${mon}-${yy} ${hm}`; // e.g., 25-Aug-25 07:30
};

// Sort calendar events by nearest time
export function sortCalendarByTime(events: any[]) {
  const toISO = (d:string,t:string)=> `${d}T${t||"00:00"}:00Z`;
  return events.sort((a,b)=> Date.parse(toISO(a.date,a.time)) - Date.parse(toISO(b.date,b.time)));
}

// Filter functions for exact matching
export function matchImportance(val:any, filterImportance:string){
  if(filterImportance==="all"||!filterImportance) return true;
  return String(val||"").toLowerCase()===filterImportance;
}
