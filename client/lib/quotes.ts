const asNum = (v:any)=> v==null || v==="NA" ? undefined : Number(v);
export function normalizeQuotes(payload:any){
  const out:any[]=[]; const push=(r:any)=>{ const code=r?.code||r?.symbol||r?.ticker; if(!code) return;
    out.push({ code,
      price: asNum(r.price??r.close??r.last??r.adjusted_close??r.c),
      change: asNum(r.change??r.d),
      changePercent: asNum(r.change_percent??r.dp)
    });
  };
  if (Array.isArray(payload)) payload.forEach(push);
  else if (payload && typeof payload==="object"){ if (payload.code||payload.symbol) push(payload); else Object.values(payload).forEach(push); }
  return out.filter(r=>Number.isFinite(r.price));
}
export async function getBatchQuotes(symbols:string[], opts:{signal?:AbortSignal}={}){
  const u=new URL("/api/eodhd/quotes", location.origin); u.searchParams.set("symbols", symbols.join(","));
  const r=await fetch(u.toString(), { signal: opts.signal });
  const ct=r.headers.get("content-type")||""; if(!ct.includes("application/json")) throw new Error("Non-JSON response");
  if(!r.ok) throw new Error("quotes"); return normalizeQuotes(await r.json());
}
