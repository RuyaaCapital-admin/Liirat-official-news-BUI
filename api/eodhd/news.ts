import { eodFetch } from '../../src/server/eodhdClient';

export default async function handler(req: Request): Promise<Response> {
  const u = new URL(req.url); 
  const s = u.searchParams.get('s'); 
  const t = u.searchParams.get('t');
  if (!s && !t) return new Response(JSON.stringify({ok:false, code:'MISSING_S_OR_T'}), {status:400});
  
  const raw = await (await eodFetch(`/news`, { 
    s: s||undefined, 
    t: t||undefined, 
    from:u.searchParams.get('from')||undefined, 
    to:u.searchParams.get('to')||undefined, 
    limit:u.searchParams.get('limit')||'50', 
    offset:u.searchParams.get('offset')||'0' 
  })).json();
  
  if (!raw.ok) return new Response(JSON.stringify(raw), {status:502});
  
  const items = (raw.data||raw).map((n:any)=>({ 
    datetime:n.date, 
    title:n.title, 
    source:(n.source||'').toString(), 
    symbols:n.symbols||[], 
    url:n.link||n.url||'' 
  }));
  
  return new Response(JSON.stringify({ok:true, items}), {
    status:200, 
    headers:{
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'s-maxage=15, stale-while-revalidate=60'
    }
  });
}
