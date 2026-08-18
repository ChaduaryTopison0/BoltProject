import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PricePoint } from '@/lib/types';

interface VolumeBarsProps {
  combined: PricePoint[];
  timeframeUnit: 'day' | 'hour' | 'minute';
}

function formatX(t: number, unit: string): string {
  const d = new Date(t);
  if (unit === 'day') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (unit === 'hour') return d.toLocaleString('en-US', { hour: 'numeric' });
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatVol(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return `${v}`;
}

export default function VolumeBars({ combined, timeframeUnit }: VolumeBarsProps) {
  const data = useMemo(() => {
    return combined.map((p, i) => {
      const prev = i > 0 ? combined[i - 1].price : p.price;
      const up = p.price >= prev;
      return { t: p.t, volume: p.volume, up, forecast: p.forecast };
    });
  }, [combined]);

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white/90">Volume</h3>
        <span className="text-[10px] text-neutral-muted tabular">shares</span>
      </div>
      <div className="h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="t"
              tickFormatter={(t) => formatX(t, timeframeUnit)}
              tick={{ fontSize: 10 }}
              interval={Math.max(0, Math.floor(data.length / 6) - 1)}
              axisLine={{ stroke: '#2A3142' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatVol}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={44}
              orientation="right"
            />
            <Tooltip
              labelFormatter={(t) => formatX(t as number, timeframeUnit)}
              formatter={(v: number) => [formatVol(v), 'Volume']}
              contentStyle={{
                background: 'rgba(11,14,20,0.95)',
                border: '1px solid #2A3142',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="volume" radius={[2, 2, 0, 0]} isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.forecast ? '#2A3142' : d.up ? '#00E67666' : '#FF174466'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
