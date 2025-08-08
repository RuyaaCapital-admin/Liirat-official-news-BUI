import { useEffect, useRef, useState } from "react";
import { getBatchQuotes } from "@/lib/quotes";
import { TICKERS } from "@/lib/watchlist";
import { cn } from "@/lib/utils";
import "@/styles/ticker.css";

const POLL_MS = 12000;

export default function PriceTicker(){
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const timer=useRef<number|null>(null);
  const inFlight=useRef<AbortController|null>(null);

  const load=async()=>{
    inFlight.current?.abort();
    const ac=new AbortController(); inFlight.current=ac;
    try{
      setLoading(true);
      setError(null);
      const data = await getBatchQuotes(TICKERS,{signal:ac.signal});
      console.log("Ticker data:", data);
      setItems(data);
      setLoading(false);
    }catch(err){
      console.error("Ticker error:", err);
      setError(err instanceof Error ? err.message : "Failed to load ticker");
      setLoading(false);
      setItems([]);
    }
  };

  useEffect(()=>{ 
    const start=()=>{ if(timer.current) return; timer.current=window.setInterval(load,POLL_MS); };
    const stop =()=>{ if(timer.current){clearInterval(timer.current); timer.current=null;} inFlight.current?.abort(); };
    load(); start();
    const onVis=()=>{ document.hidden?stop():(load(),start()); };
    document.addEventListener("visibilitychange", onVis);
    return ()=>{ stop(); document.removeEventListener("visibilitychange", onVis); };
  },[]);

  const renderItem=(q:any)=>(
    <div key={q.key||q.code} className="flex items-center gap-1 sm:gap-2 min-w-max text-xs sm:text-sm">
      <span className="font-medium text-muted-foreground">{q.code}</span>
      <strong className="text-foreground">{q.price?.toLocaleString()}</strong>
      <span className={cn(
        "text-xs",
        q.change>=0 ? "text-green-500" : "text-red-500"
      )}>
        {q.change !== undefined ? (q.change >= 0 ? "+" : "") + q.change?.toFixed(2) : "-"}
        {q.changePercent !== undefined && (
          <span className="hidden sm:inline"> ({(q.changePercent >= 0 ? "+" : "") + q.changePercent?.toFixed(2)}%)</span>
        )}
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="ticker-wrap">
        <div className="ticker-track">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Loading market data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!items.length && !error) {
    return null;
  }

  return (
    <div className="ticker-wrap bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="ticker-track">
        {items.map((q,i)=>renderItem({...q,key:`first-${i}`}))}
        {items.map((q,i)=>renderItem({...q,key:`second-${i}`}))}
      </div>
      {error && (
        <div className="absolute top-0 right-4 text-xs text-red-500 py-1">
          {error}
        </div>
      )}
    </div>
  );
}
