"use client";

import { useEffect, useState } from "react";
import { Clock, Calendar } from "lucide-react";

export function DigitalClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl bg-slate-900/90 px-4 py-2 text-slate-400 text-xs shadow-inner">
        <Clock className="h-4 w-4 animate-spin text-emerald-400" />
        <span>Loading live watch...</span>
      </div>
    );
  }

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const ampm = time.getHours() >= 12 ? "PM" : "AM";
  const hours12 = (time.getHours() % 12 || 12).toString().padStart(2, "0");

  const dateFormatted = time.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="inline-flex flex-col sm:flex-row items-center gap-2.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-2 sm:px-4 sm:py-2 border border-slate-800 shadow-xl shadow-slate-950/40">
      {/* Date Pill */}
      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
        <Calendar className="h-3.5 w-3.5 text-blue-400" />
        <span>{dateFormatted}</span>
      </div>

      {/* Digital Watch Display */}
      <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-xl border border-emerald-500/20 shadow-inner">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <Clock className="h-3.5 w-3.5 text-emerald-400" />
        
        {/* Monospace 12h Digital Time */}
        <div className="font-mono text-sm sm:text-base font-extrabold tracking-wider text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
          <span>{hours12}</span>
          <span className="animate-pulse text-emerald-300">:</span>
          <span>{minutes}</span>
          <span className="animate-pulse text-emerald-300">:</span>
          <span className="text-emerald-300">{seconds}</span>
        </div>

        {/* AM / PM Badge */}
        <span className="ml-1 rounded bg-emerald-950/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300 border border-emerald-700/50">
          {ampm}
        </span>

        {/* 24h Military Format Subscript */}
        <span className="ml-1 text-[10px] font-mono text-slate-400 hidden md:inline">
          ({hours}:{minutes}:{seconds} 24h)
        </span>
      </div>
    </div>
  );
}
