import { eodFetch } from '../../src/server/eodhdClient';

export default async function handler(req: Request): Promise<Response> {
  const {searchParams} = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return new Response(JSON.stringify({ok:false, code:'MISSING_Q'}), {status:400});
  return eodFetch(`/search/${encodeURIComponent(q)}`, { 
    limit: searchParams.get('limit')||'15', 
    type: searchParams.get('type')||'all' 
  });
}
