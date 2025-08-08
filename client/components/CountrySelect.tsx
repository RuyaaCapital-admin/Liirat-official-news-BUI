import { useState } from "react";

export function CountrySelect({value,onChange,options}:{value:string[];onChange:(v:string[])=>void;options:{code:string;name:string}[]}) {
  const [open,setOpen]=useState(false);
  const [q,setQ]=useState("");
  const list=options.filter(o=>o.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="relative">
      <button onClick={()=>setOpen(v=>!v)} className="btn btn-sm">{value.length?`${value.length} selected`:"All countries"}</button>
      {open && (
        <div className="absolute z-30 mt-2 w-64 rounded-lg bg-zinc-900 border border-zinc-700 p-2">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" className="w-full mb-2 px-2 py-1 rounded bg-zinc-800"/>
          <div className="max-h-72 overflow-auto space-y-1">
            {list.map(o=>(
              <label key={o.code} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={value.includes(o.code)} onChange={()=>{
                  onChange(value.includes(o.code)? value.filter(v=>v!==o.code) : [...value,o.code]);
                }}/>
                <span>{o.name}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={()=>onChange([])} className="text-xs opacity-70">Clear</button>
            <button onClick={()=>setOpen(false)} className="text-xs">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
