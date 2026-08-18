import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import type { QuoteData, ForecastResult } from '@/lib/types';

interface ProfitLossCalculatorProps {
  quote: QuoteData | null;
  forecast: ForecastResult;
  purchasePrice: number | null;
  onPurchasePriceChange: (price: number | null) => void;
}

export default function ProfitLossCalculator({ quote, forecast, purchasePrice, onPurchasePriceChange }: ProfitLossCalculatorProps) {
  const [shares, setShares] = useState('100');
  const [inputPrice, setInputPrice] = useState('');

  const current = quote?.current ?? 0;
  const target = forecast.consensusTarget ?? current;

  const purchase = purchasePrice ?? 0;
  const numShares = parseFloat(shares) || 0;

  const { unrealizedPL, unrealizedPct, targetPL, targetPct, isProfit, isTargetProfit } = useMemo(() => {
    if (purchase <= 0 || numShares <= 0) {
      return { unrealizedPL: 0, unrealizedPct: 0, targetPL: 0, targetPct: 0, isProfit: false, isTargetProfit: false };
    }
    const uPL = (current - purchase) * numShares;
    const uPct = ((current - purchase) / purchase) * 100;
    const tPL = (target - purchase) * numShares;
    const tPct = ((target - purchase) / purchase) * 100;
    return {
      unrealizedPL: uPL,
      unrealizedPct: uPct,
      targetPL: tPL,
      targetPct: tPct,
      isProfit: uPL >= 0,
      isTargetProfit: tPL >= 0,
    };
  }, [purchase, numShares, current, target]);

  const handleSetPurchase = () => {
    const p = parseFloat(inputPrice);
    if (!isNaN(p) && p > 0) {
      onPurchasePriceChange(p);
      setInputPrice('');
    }
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-white/90">Profit / Loss Calculator</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-[10px] text-neutral-muted mb-1 block">Purchase Price</label>
          <div className="flex gap-1">
            <input
              type="number"
              value={inputPrice}
              onChange={(e) => setInputPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetPurchase()}
              placeholder={purchase ? purchase.toFixed(2) : '0.00'}
              className="w-full bg-bg-elevated border border-edge rounded-md px-2 py-1.5 text-xs tabular focus:outline-none focus:border-accent/60"
            />
            <button
              onClick={handleSetPurchase}
              className="px-2 py-1.5 rounded-md bg-accent/20 border border-accent/40 text-accent text-[10px] font-medium hover:bg-accent/30 transition-colors whitespace-nowrap"
            >
              Set
            </button>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-neutral-muted mb-1 block">Shares</label>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="w-full bg-bg-elevated border border-edge rounded-md px-2 py-1.5 text-xs tabular focus:outline-none focus:border-accent/60"
          />
        </div>
      </div>

      {purchase > 0 && numShares > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-bg-elevated/50 rounded-md px-3 py-2">
            <span className="text-xs text-neutral-text">Unrealized P&L</span>
            <div className="flex items-center gap-1.5">
              {isProfit ? <TrendingUp className="w-3.5 h-3.5 text-bull" /> : <TrendingDown className="w-3.5 h-3.5 text-bear" />}
              <span className={`tabular text-sm font-bold ${isProfit ? 'text-bull' : 'text-bear'}`}>
                {isProfit ? '+' : ''}${unrealizedPL.toFixed(2)} ({isProfit ? '+' : ''}{unrealizedPct.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between bg-bg-elevated/50 rounded-md px-3 py-2">
            <span className="text-xs text-neutral-text">P&L at Target</span>
            <div className="flex items-center gap-1.5">
              {isTargetProfit ? <TrendingUp className="w-3.5 h-3.5 text-bull" /> : <TrendingDown className="w-3.5 h-3.5 text-bear" />}
              <span className={`tabular text-sm font-bold ${isTargetProfit ? 'text-bull' : 'text-bear'}`}>
                {isTargetProfit ? '+' : ''}${targetPL.toFixed(2)} ({isTargetProfit ? '+' : ''}{targetPct.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-muted px-1">
            <span>Cost Basis: <span className="tabular text-white/70">${(purchase * numShares).toFixed(2)}</span></span>
            <span>Current Value: <span className="tabular text-white/70">${(current * numShares).toFixed(2)}</span></span>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-neutral-muted text-center py-3">Set a purchase price and shares to calculate P&L.</p>
      )}
    </div>
  );
}
