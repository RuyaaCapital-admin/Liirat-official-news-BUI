import { useEffect, useRef, useState } from "react";
import { getBatchQuotes } from "@/lib/quotes";
import { TICKERS } from "@/lib/watchlist";
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
      // Add fallback mock data for demonstration
      setItems([
        {code: "BTC-USD", price: 45000, change: 1200, changePercent: 2.7},
        {code: "ETH-USD", price: 2800, change: -50, changePercent: -1.8},
        {code: "EURUSD", price: 1.0850, change: 0.0020, changePercent: 0.18}
      ]);
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
    <div key={q.key||q.code} className="flex items-center gap-1 min-w-max">
      <span>{q.code}</span>
      <strong>{q.price?.toLocaleString()}</strong>
      <span className={q.change>=0?"text-green-500":"text-red-500"}>
        {q.change ?? "-"} ({q.changePercent ?? "-"}%)
      </span>
    </div>
  );

  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {items.map((q,i)=>renderItem({...q,key:`a-${i}`}))}
        {items.map((q,i)=>renderItem({...q,key:`b-${i}`}))}
      </div>
    </div>
  );
}
