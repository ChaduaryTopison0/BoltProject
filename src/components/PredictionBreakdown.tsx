import { Activity, Newspaper, GitMerge } from 'lucide-react';
import type { ForecastResult, QuoteData } from '@/lib/types';

interface PredictionBreakdownProps {
  forecast: ForecastResult;
  quote: QuoteData | null;
}

export default function PredictionBreakdown({ forecast, quote }: PredictionBreakdownProps) {
  const current = quote?.current ?? forecast.history[forecast.history.length - 1]?.price ?? 0;
  const techMove = ((forecast.technicalTarget - current) / current) * 100;
  const sentMove = ((forecast.sentimentTarget - current) / current) * 100;
  const consMove = ((forecast.consensusTarget - current) / current) * 100;

  const rows = [
    {
      icon: <Activity className="w-4 h-4 text-accent" />,
      label: 'Technical',
      target: forecast.technicalTarget,
      move: techMove,
      rationale: forecast.technicalRationale,
      color: 'text-accent',
    },
    {
      icon: <Newspaper className="w-4 h-4 text-warn" />,
      label: 'Sentiment',
      target: forecast.sentimentTarget,
      move: sentMove,
      rationale: forecast.sentimentRationale,
      color: 'text-warn',
    },
    {
      icon: <GitMerge className="w-4 h-4 text-bull" />,
      label: 'Consensus',
      target: forecast.consensusTarget,
      move: consMove,
      rationale: forecast.consensusRationale,
      color: 'text-bull',
    },
  ];

  return (
    <div className="glass-panel p-4">
      <h3 className="text-sm font-semibold text-white/90 mb-3">Prediction Breakdown</h3>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="bg-bg-elevated/50 rounded-lg p-3 border border-edge/50">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {row.icon}
                <span className="text-xs font-semibold text-white/80">{row.label} Target</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`tabular text-base font-bold ${row.color}`}>
                  ${row.target.toFixed(2)}
                </span>
                <span className={`tabular text-xs ${row.move >= 0 ? 'text-bull' : 'text-bear'}`}>
                  {row.move >= 0 ? '+' : ''}{row.move.toFixed(2)}%
                </span>
              </div>
            </div>
            <p className="text-[11px] text-neutral-text leading-relaxed">{row.rationale}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
