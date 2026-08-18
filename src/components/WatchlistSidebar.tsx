import { useState } from 'react';
import { Star, Plus, X, Trash2 } from 'lucide-react';

interface WatchlistSidebarProps {
  watchlist: string[];
  activeSymbol: string;
  onPick: (sym: string) => void;
  onAdd: (sym: string) => void;
  onRemove: (sym: string) => void;
}

const POPULAR = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'AMD'];

export default function WatchlistSidebar({ watchlist, activeSymbol, onPick, onAdd, onRemove }: WatchlistSidebarProps) {
  const [adding, setAdding] = useState(false);
  const [newSym, setNewSym] = useState('');

  const handleAdd = () => {
    const sym = newSym.trim().toUpperCase();
    if (sym && !watchlist.includes(sym)) {
      onAdd(sym);
    }
    setNewSym('');
    setAdding(false);
  };

  const suggestions = POPULAR.filter((s) => !watchlist.includes(s)).slice(0, 4);

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-warn" />
          <h3 className="text-sm font-semibold text-white/90">Watchlist</h3>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="w-6 h-6 rounded-md bg-bg-elevated border border-edge hover:border-accent/50 flex items-center justify-center transition-colors"
        >
          {adding ? <X className="w-3.5 h-3.5 text-neutral-text" /> : <Plus className="w-3.5 h-3.5 text-neutral-text" />}
        </button>
      </div>

      {adding && (
        <div className="mb-3 animate-fade-in">
          <div className="flex gap-1">
            <input
              type="text"
              value={newSym}
              onChange={(e) => setNewSym(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="TICKER"
              maxLength={6}
              autoFocus
              className="w-full bg-bg-elevated border border-edge rounded-md px-2 py-1.5 text-xs tabular focus:outline-none focus:border-accent/60"
            />
            <button
              onClick={handleAdd}
              className="px-2 py-1.5 rounded-md bg-accent/20 border border-accent/40 text-accent text-[10px] font-medium hover:bg-accent/30 transition-colors"
            >
              Add
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { onAdd(s); }}
                  className="text-[10px] px-2 py-1 rounded bg-bg-elevated border border-edge text-neutral-text hover:border-accent/40 hover:text-accent transition-colors tabular"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {watchlist.length === 0 ? (
        <p className="text-xs text-neutral-muted text-center py-4">No tickers saved. Add one to get started.</p>
      ) : (
        <div className="space-y-1">
          {watchlist.map((sym) => (
            <div
              key={sym}
              className={`group flex items-center justify-between rounded-md px-3 py-2 cursor-pointer transition-colors ${
                sym === activeSymbol
                  ? 'bg-accent/15 border border-accent/40'
                  : 'bg-bg-elevated/40 border border-edge/40 hover:bg-bg-hover/50'
              }`}
              onClick={() => onPick(sym)}
            >
              <span className="text-sm font-semibold tabular">{sym}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(sym); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-bear-soft"
              >
                <Trash2 className="w-3.5 h-3.5 text-neutral-muted hover:text-bear" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
