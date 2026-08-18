import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts';
import { LineChart, CandlestickChart, X } from 'lucide-react';
import type { PricePoint, QuoteData } from '@/lib/types';

interface PriceChartProps {
  combined: PricePoint[];
  history: PricePoint[];
  forecast: PricePoint[];
  quote: QuoteData | null;
  purchasePrice: number | null;
  onClearPurchase: () => void;
  timeframeUnit: 'day' | 'hour' | 'minute';
}

function formatX(t: number, unit: string): string {
  const d = new Date(t);
  if (unit === 'day') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (unit === 'hour') return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' });
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatY(v: number): string {
  return `$${v.toFixed(2)}`;
}

export default function PriceChart({ combined, history, forecast, quote, purchasePrice, onClearPurchase, timeframeUnit }: PriceChartProps) {
  const [mode, setMode] = useState<'line' | 'candle'>('line');

  const data = useMemo(() => {
    // Find the last history index to bridge into forecast
    let lastHistIdx = -1;
    for (let i = combined.length - 1; i >= 0; i--) {
      if (!combined[i].forecast) { lastHistIdx = i; break; }
    }
    return combined.map((p, i) => {
      const isBridge = i === lastHistIdx && lastHistIdx < combined.length - 1;
      return {
        t: p.t,
        price: p.price,
        histPrice: p.forecast ? null : p.price,
        // Bridge: start forecast line at last history point so lines connect
        fcstPrice: p.forecast ? p.price : (isBridge ? p.price : null),
        upper: p.upper,
        lower: p.lower,
        forecast: p.forecast,
      };
    });
  }, [combined]);

  // Y-axis domain: include purchase price so it's always visible
  const domain = useMemo<[number, number]>(() => {
    const allPrices = combined.map((p) => p.price);
    if (purchasePrice != null) allPrices.push(purchasePrice);
    if (forecast.length > 0) {
      forecast.forEach((p) => {
        if (p.upper) allPrices.push(p.upper);
        if (p.lower) allPrices.push(p.lower);
      });
    }
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const padding = (max - min) * 0.08 || 1;
    return [+(min - padding).toFixed(2), +(max + padding).toFixed(2)];
  }, [combined, purchasePrice, forecast]);

  const hasPurchase = purchasePrice != null && purchasePrice > 0;

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white/90">Price Forecast</h3>
          <span className="text-[10px] text-neutral-muted tabular">
            {history.length}d hist · {forecast.length}pt forecast
          </span>
        </div>
        <div className="flex items-center gap-1 p-0.5 bg-bg-elevated rounded-md border border-edge">
          <button
            onClick={() => setMode('line')}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${mode === 'line' ? 'bg-accent text-white' : 'text-neutral-text hover:text-white'}`}
          >
            <LineChart className="w-3.5 h-3.5" /> Line
          </button>
          <button
            onClick={() => setMode('candle')}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${mode === 'candle' ? 'bg-accent text-white' : 'text-neutral-text hover:text-white'}`}
          >
            <CandlestickChart className="w-3.5 h-3.5" /> Candles
          </button>
        </div>
      </div>

      <div className="h-[320px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="histArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2979FF" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#2979FF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bandArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E676" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#00E676" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2533" vertical={false} />
            <XAxis
              dataKey="t"
              tickFormatter={(t) => formatX(t, timeframeUnit)}
              tick={{ fontSize: 10 }}
              interval={Math.max(0, Math.floor(data.length / 6) - 1)}
              axisLine={{ stroke: '#2A3142' }}
              tickLine={false}
            />
            <YAxis
              domain={domain}
              tickFormatter={formatY}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={56}
              orientation="right"
            />
            <Tooltip
              labelFormatter={(t) => formatX(t as number, timeframeUnit)}
              formatter={(v: number, name: string) => {
                if (name === 'price') return [`$${v.toFixed(2)}`, 'Price'];
                if (name === 'upper') return [`$${v.toFixed(2)}`, 'Upper Band'];
                if (name === 'lower') return [`$${v.toFixed(2)}`, 'Lower Band'];
                return [v, name];
              }}
              contentStyle={{
                background: 'rgba(11,14,20,0.95)',
                border: '1px solid #2A3142',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />

            {/* Probability band for forecast */}
            {forecast.length > 0 && (
              <Area
                dataKey="upper"
                stroke="none"
                fill="url(#bandArea)"
                connectNulls
                isAnimationActive={false}
              />
            )}
            {forecast.length > 0 && (
              <Area
                dataKey="lower"
                stroke="none"
                fill="#0B0E14"
                connectNulls
                isAnimationActive={false}
              />
            )}

            {/* History line (solid blue) */}
            <Line
              dataKey="histPrice"
              stroke="#2979FF"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />

            {/* Forecast line (dashed green) */}
            {forecast.length > 0 && (
              <Line
                dataKey="fcstPrice"
                stroke="#00E676"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            )}

            {/* Purchase price reference line */}
            {hasPurchase && (
              <ReferenceLine
                y={purchasePrice!}
                stroke="#FFAB00"
                strokeDasharray="4 2"
                strokeWidth={1.5}
                label={{
                  value: `Buy @ $${purchasePrice!.toFixed(2)}`,
                  position: 'insideTopLeft',
                  fill: '#FFAB00',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Clear purchase price button */}
        {hasPurchase && (
          <button
            onClick={onClearPurchase}
            className="absolute top-2 right-16 flex items-center gap-1 px-2 py-1 rounded bg-warn-soft border border-warn/40 text-warn text-[10px] font-medium hover:bg-warn/20 transition-colors"
          >
            <X className="w-3 h-3" /> Clear Buy Line
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[11px] text-neutral-text">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-accent rounded" />
          <span>History</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 border-t border-dashed border-bull rounded" />
          <span>Forecast</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2 bg-bull-soft rounded" />
          <span>Probability Band</span>
        </div>
        {hasPurchase && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 border-t border-dashed border-warn rounded" />
            <span>Purchase</span>
          </div>
        )}
      </div>
    </div>
  );
}
