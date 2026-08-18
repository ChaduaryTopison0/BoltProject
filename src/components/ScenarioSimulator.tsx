import { Sliders, TrendingUp, Heart } from 'lucide-react';
import type { ScenarioOverrides } from '@/lib/types';

interface ScenarioSimulatorProps {
  overrides: ScenarioOverrides;
  onChange: (overrides: ScenarioOverrides) => void;
  onReset: () => void;
}

export default function ScenarioSimulator({ overrides, onChange, onReset }: ScenarioSimulatorProps) {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-white/90">Scenario Simulator</h3>
        </div>
        <button
          onClick={onReset}
          className="text-[10px] text-neutral-text hover:text-white px-2 py-1 rounded border border-edge hover:border-edge-strong transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="space-y-4">
        {/* Earnings Surprise */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-neutral-text flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Earnings Surprise
            </label>
            <span className={`tabular text-xs font-semibold ${overrides.earningsSurprise >= 0 ? 'text-bull' : 'text-bear'}`}>
              {overrides.earningsSurprise >= 0 ? '+' : ''}{overrides.earningsSurprise}%
            </span>
          </div>
          <input
            type="range"
            min={-20}
            max={20}
            step={1}
            value={overrides.earningsSurprise}
            onChange={(e) => onChange({ ...overrides, earningsSurprise: +e.target.value })}
            className="w-full accent-accent cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-muted mt-0.5">
            <span>-20%</span>
            <span>0%</span>
            <span>+20%</span>
          </div>
        </div>

        {/* Sector Sentiment */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-neutral-text flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" /> Sector Sentiment
            </label>
            <span className={`tabular text-xs font-semibold ${overrides.sectorSentiment >= 0 ? 'text-bull' : 'text-bear'}`}>
              {overrides.sectorSentiment > 0 ? 'Bullish' : overrides.sectorSentiment < 0 ? 'Bearish' : 'Neutral'} ({overrides.sectorSentiment})
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            step={5}
            value={overrides.sectorSentiment}
            onChange={(e) => onChange({ ...overrides, sectorSentiment: +e.target.value })}
            className="w-full accent-accent cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-muted mt-0.5">
            <span>Bearish</span>
            <span>Neutral</span>
            <span>Bullish</span>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-neutral-muted mt-3 leading-relaxed">
        Adjust sliders to see how earnings surprises and sector mood shift the forecast in real time.
      </p>
    </div>
  );
}
