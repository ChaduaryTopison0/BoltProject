import type { BuySellWindow } from '@/lib/forecastEngine';
import { computeBuySellWindows } from '@/lib/forecastEngine';
import type { QuoteData, ForecastResult } from '@/lib/types';

interface BuySellTableProps {
  forecast: ForecastResult;
  quote: QuoteData | null;
}

export default function BuySellTable({ forecast, quote }: BuySellTableProps) {
  const current = quote?.current ?? forecast.history[forecast.history.length - 1]?.price ?? 0;
  const windows = computeBuySellWindows(current, forecast.consensusTarget, forecast.confidence);

  return (
    <div className="glass-panel p-4">
      <h3 className="text-sm font-semibold text-white/90 mb-3">Suggested Buy/Sell Windows</h3>
      <div className="overflow-hidden rounded-lg border border-edge">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-bg-elevated text-neutral-text">
              <th className="text-left px-3 py-2 font-medium">Strategy</th>
              <th className="text-right px-3 py-2 font-medium">Low</th>
              <th className="text-right px-3 py-2 font-medium">High</th>
              <th className="text-center px-3 py-2 font-medium">Action</th>
              <th className="text-right px-3 py-2 font-medium">Conf.</th>
            </tr>
          </thead>
          <tbody>
            {windows.map((w) => (
              <tr key={w.label} className="border-t border-edge/50 hover:bg-bg-hover/50 transition-colors">
                <td className="px-3 py-2.5 font-medium text-white/80">{w.label}</td>
                <td className="px-3 py-2.5 text-right tabular text-neutral-text">${w.low.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-right tabular text-neutral-text">${w.high.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    w.action === 'BUY' ? 'bg-bull-soft text-bull' : w.action === 'SELL' ? 'bg-bear-soft text-bear' : 'bg-bg-elevated text-neutral-text'
                  }`}>
                    {w.action}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right tabular text-white/70">{w.confidence}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-neutral-muted mt-2 leading-relaxed">
        Windows are derived from the consensus target and confidence score. Current price: ${current.toFixed(2)}
      </p>
    </div>
  );
}
