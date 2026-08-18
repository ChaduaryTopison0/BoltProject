import { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';

// US Market: 9:30–16:00 ET (New York). We compute ET from UTC.
function getETDate(now: Date): Date {
  // ET = UTC-5 (EST) or UTC-4 (EDT). Approximate: use UTC-4 for Mar-Nov, UTC-5 for Nov-Mar
  const month = now.getUTCMonth(); // 0-11
  const day = now.getUTCDate();
  // Simplified DST: second Sunday of March to first Sunday of November
  const isDST = (month > 2 && month < 10) || (month === 2 && day >= 10) || (month === 10 && day < 7);
  const offset = isDST ? -4 : -5;
  return new Date(now.getTime() + offset * 3_600_000);
}

function getSaudiTime(now: Date): string {
  // Saudi Arabia = UTC+3, no DST
  const sa = new Date(now.getTime() + 3 * 3_600_000);
  return sa.toISOString().slice(11, 19);
}

export default function MarketStatusBanner() {
  const [now, setNow] = useState(new Date());
  const [marketOpen, setMarketOpen] = useState(false);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setNow(n);
      const et = getETDate(n);
      const day = et.getUTCDay(); // 0=Sun..6=Sat
      const hours = et.getUTCHours();
      const mins = et.getUTCMinutes();
      const totalMins = hours * 60 + mins;
      const isWeekday = day >= 1 && day <= 5;
      const isOpen = isWeekday && totalMins >= 570 && totalMins < 960; // 9:30–16:00
      setMarketOpen(isOpen);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const saTime = getSaudiTime(now);

  return (
    <div className="flex items-center gap-3 px-4 lg:px-6 py-2 glass border-b border-edge/40 text-xs">
      <div className="flex items-center gap-2">
        <span className={`relative flex h-2 w-2 ${marketOpen ? '' : 'opacity-40'}`}>
          {marketOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bull opacity-60" />}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${marketOpen ? 'bg-bull' : 'bg-neutral-muted'}`} />
        </span>
        <span className={`font-semibold tracking-wide ${marketOpen ? 'text-bull' : 'text-neutral-text'}`}>
          US MARKET {marketOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>
      <div className="h-3 w-px bg-edge" />
      <div className="flex items-center gap-1.5 text-neutral-text">
        <Clock className="w-3.5 h-3.5" />
        <span className="tabular">SA Time (UTC+3)</span>
        <span className="tabular text-white/90 font-medium">{saTime}</span>
      </div>
      <div className="ml-auto flex items-center gap-1.5 text-neutral-muted">
        <Activity className="w-3.5 h-3.5" />
        <span>AI Forecast Engine</span>
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-bull animate-pulse-slow" />
      </div>
    </div>
  );
}
