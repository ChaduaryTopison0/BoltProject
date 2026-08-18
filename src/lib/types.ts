export type TimeframeId = '2W' | '1W' | '1D' | '1H' | 'RT';

export interface TimeframeConfig {
  id: TimeframeId;
  label: string;
  shortLabel: string;
  historyCount: number;
  forecastCount: number;
  historyUnit: 'day' | 'hour' | 'minute';
  forecastUnit: 'day' | 'hour' | 'minute';
  refreshMs: number;
  description: string;
}

export interface PricePoint {
  t: number; // epoch ms
  price: number;
  volume: number;
  forecast?: boolean;
  upper?: number;
  lower?: number;
}

export interface NewsItem {
  id: number;
  headline: string;
  source: string;
  url: string;
  datetime: number; // epoch ms
  sentiment: number; // -1..1
  summary: string;
}

export interface QuoteData {
  symbol: string;
  name: string;
  current: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  week52High?: number;
  week52Low?: number;
  beta?: number;
}

export interface ForecastResult {
  history: PricePoint[];
  forecast: PricePoint[];
  combined: PricePoint[];
  technicalTarget: number;
  sentimentTarget: number;
  consensusTarget: number;
  confidence: number; // 45..96
  technicalRationale: string;
  sentimentRationale: string;
  consensusRationale: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
}

export interface ScenarioOverrides {
  earningsSurprise: number; // -20..20 (%)
  sectorSentiment: number; // -100..100
}

export const TIMEFRAMES: TimeframeConfig[] = [
  {
    id: '2W',
    label: '2 Weeks',
    shortLabel: '2W',
    historyCount: 14,
    forecastCount: 14,
    historyUnit: 'day',
    forecastUnit: 'day',
    refreshMs: 0,
    description: '14d history · 14d forecast · daily',
  },
  {
    id: '1W',
    label: '1 Week',
    shortLabel: '1W',
    historyCount: 7,
    forecastCount: 7,
    historyUnit: 'day',
    forecastUnit: 'day',
    refreshMs: 0,
    description: '7d history · 7d forecast · daily',
  },
  {
    id: '1D',
    label: '1 Day',
    shortLabel: '1D',
    historyCount: 24,
    forecastCount: 24,
    historyUnit: 'hour',
    forecastUnit: 'hour',
    refreshMs: 0,
    description: '24h history · 24h forecast · hourly',
  },
  {
    id: '1H',
    label: '1 Hour',
    shortLabel: '1H',
    historyCount: 60,
    forecastCount: 60,
    historyUnit: 'minute',
    forecastUnit: 'minute',
    refreshMs: 60_000,
    description: '60m history · 60m forecast · every 1min',
  },
  {
    id: 'RT',
    label: 'Realtime',
    shortLabel: 'RT',
    historyCount: 30,
    forecastCount: 5,
    historyUnit: 'minute',
    forecastUnit: 'minute',
    refreshMs: 2_000,
    description: 'Live ticks · 1-min forecast · every 2sec',
  },
];

export function getTimeframe(id: TimeframeId): TimeframeConfig {
  return TIMEFRAMES.find((t) => t.id === id) ?? TIMEFRAMES[0];
}

export function unitMs(unit: 'day' | 'hour' | 'minute'): number {
  switch (unit) {
    case 'day': return 86_400_000;
    case 'hour': return 3_600_000;
    case 'minute': return 60_000;
  }
}
