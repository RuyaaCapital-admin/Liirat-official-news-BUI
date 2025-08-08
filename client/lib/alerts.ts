// Real-time price fetching for alerts
export async function fetchSpot(symbol:string){
  const u=new URL("/api/eodhd/price", location.origin); u.searchParams.set("s", symbol);
  const r=await fetch(u); if(!r.ok) throw new Error("price"); return r.json(); // {raw, price}
}
