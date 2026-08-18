import { useState, useRef, useEffect } from 'react';
import { Search, Settings, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { QuoteData } from '@/lib/types';

interface HeaderProps {
  quote: QuoteData | null;
  searchValue: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit: (v: string) => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
  watchlist: string[];
  onPickWatchlist: (sym: string) => void;
}

export default function Header({ quote, searchValue, onSearchChange, onSearchSubmit, onOpenSettings, hasApiKey, watchlist, onPickWatchlist }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const rec = quote?.current && quote?.prevClose ? (quote.current >= quote.prevClose ? 'UP' : 'DOWN') : 'FLAT';
  const badge = quote?.current && quote?.prevClose
    ? quote.current > quote.prevClose * 1.001
      ? 'BUY'
      : quote.current < quote.prevClose * 0.999
        ? 'SELL'
        : 'HOLD'
    : 'HOLD';

  const badgeColor = badge === 'BUY' ? 'text-bull bg-bull-soft border-bull/40' : badge === 'SELL' ? 'text-bear bg-bear-soft border-bear/40' : 'text-neutral-text bg-bg-elevated border-edge';
  const priceColor = rec === 'UP' ? 'text-bull' : rec === 'DOWN' ? 'text-bear' : 'text-neutral-text';

  const filtered = watchlist.filter((w) => w.toLowerCase().includes(searchValue.toLowerCase()) && w.toLowerCase() !== searchValue.toLowerCase());

  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  return (
    <header className="glass sticky top-0 z-40 border-b border-edge/60">
      <div className="mx-auto max-w-[1600px] px-4 lg:px-6 py-3 flex items-center gap-4 flex-wrap">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-accent/30 to-bull/20 border border-edge flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-bull" />
          </div>
          <div className="hidden sm:block">
            <div className="font-bold text-lg leading-none tracking-tight">PulseMarket</div>
            <div className="text-[10px] text-neutral-muted leading-none mt-0.5 tabular">AI FORECAST</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md min-w-[200px]" ref={inputRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => { onSearchChange(e.target.value.toUpperCase()); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearchSubmit(searchValue);
                setShowDropdown(false);
                inputRef.current?.blur();
              }
            }}
            placeholder="Search ticker (e.g. AAPL)"
            className="w-full bg-bg-elevated border border-edge rounded-lg pl-9 pr-3 py-2 text-sm font-medium tabular focus:outline-none focus:border-accent/60 transition-colors"
          />
          {showDropdown && filtered.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 glass-panel rounded-lg overflow-hidden z-50 animate-fade-in">
              {filtered.slice(0, 5).map((sym) => (
                <button
                  key={sym}
                  onClick={() => { onPickWatchlist(sym); setShowDropdown(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-bg-hover text-sm tabular transition-colors"
                >
                  {sym}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quote info */}
        {quote && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-base sm:text-lg">{quote.name}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${badgeColor} tabular`}>
                {badge}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`tabular text-xl font-semibold ${priceColor}`}>
                ${quote.current.toFixed(2)}
              </span>
              <span className={`tabular text-sm flex items-center gap-0.5 ${quote.change >= 0 ? 'text-bull' : 'text-bear'}`}>
                {quote.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        )}

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="ml-auto shrink-0 w-9 h-9 rounded-lg bg-bg-elevated border border-edge hover:border-accent/50 flex items-center justify-center transition-colors relative"
          title="API Settings"
        >
          <Settings className="w-4 h-4 text-neutral-text" />
          {!hasApiKey && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-warn border-2 border-bg-base" />
          )}
        </button>
      </div>
    </header>
  );
}
