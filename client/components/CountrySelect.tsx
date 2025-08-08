import { useState } from "react";
import { createPortal } from "react-dom";
import ReactCountryFlag from "react-country-flag";
import { Button } from "@/components/ui/button";

export function CountrySelect({value,onChange,options}:{value:string[];onChange:(v:string[])=>void;options:{code:string;name:string}[]}) {
  const [open,setOpen]=useState(false);
  const [q,setQ]=useState("");
  const list=options.filter(o=>o.name.toLowerCase().includes(q.toLowerCase()));

  const dropdown = open ? (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-4">
      <div className="fixed inset-0 bg-black/20" onClick={() => setOpen(false)} />
      <div className="relative z-[101] w-64 rounded-lg bg-background border border-border p-3 shadow-lg">
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Search countries…"
          className="w-full mb-2 px-3 py-2 rounded border bg-background text-foreground placeholder:text-muted-foreground"
          autoFocus
        />
        <div className="max-h-72 overflow-auto space-y-1">
          {list.map(o=>(
            <label key={o.code} className="flex items-center gap-2 text-sm p-2 hover:bg-muted rounded cursor-pointer">
              <input
                type="checkbox"
                checked={value.includes(o.code)}
                onChange={()=>{
                  onChange(value.includes(o.code)? value.filter(v=>v!==o.code) : [...value,o.code]);
                }}
                className="rounded"
              />
              {o.code ? (
                <ReactCountryFlag countryCode={o.code} svg className="w-4 h-3" />
              ) : (
                <div className="w-4 h-3 bg-muted rounded" />
              )}
              <span>{o.name || o.code}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-between pt-3 border-t mt-2">
          <Button variant="ghost" size="sm" onClick={()=>onChange([])} className="text-xs">Clear</Button>
          <Button variant="ghost" size="sm" onClick={()=>setOpen(false)} className="text-xs">Close</Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={()=>setOpen(v=>!v)}
        className="justify-between w-full"
      >
        {value.length ? `${value.length} selected` : "All countries"}
      </Button>
      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </>
  );
}
