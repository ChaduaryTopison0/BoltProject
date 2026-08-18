import type { PricePoint, NewsItem, QuoteData } from './types';

// Deterministic PRNG so mock data is stable per symbol
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc.',
  AMZN: 'Amazon.com Inc.',
  TSLA: 'Tesla Inc.',
  NVDA: 'NVIDIA Corporation',
  META: 'Meta Platforms Inc.',
  NFLX: 'Netflix Inc.',
  AMD: 'Advanced Micro Devices',
  INTC: 'Intel Corporation',
  JPM: 'JPMorgan Chase & Co.',
  V: 'Visa Inc.',
  DIS: 'Walt Disney Co.',
  BA: 'Boeing Co.',
  XOM: 'Exxon Mobil Corp.',
};

const MOCK_NEWS_TEMPLATES = [
  { headline: '{name} beats Q3 earnings expectations, raises guidance', sentiment: 0.7, source: 'Reuters' },
  { headline: 'Analysts upgrade {sym} on strong product pipeline', sentiment: 0.5, source: 'Bloomberg' },
  { headline: '{sym} faces regulatory scrutiny over new policy', sentiment: -0.4, source: 'CNBC' },
  { headline: '{name} announces major partnership expansion', sentiment: 0.6, source: 'MarketWatch' },
  { headline: 'Sector-wide selloff impacts {sym} shares', sentiment: -0.5, source: 'Yahoo Finance' },
  { headline: '{name} unveils next-generation platform at investor day', sentiment: 0.8, source: 'Benzinga' },
  { headline: 'Supply chain headwinds could pressure {sym} margins', sentiment: -0.3, source: 'Seeking Alpha' },
  { headline: '{sym} insider buying signals executive confidence', sentiment: 0.4, source: 'GlobeNewswire' },
];

export function getMockQuote(symbol: string): QuoteData {
  const sym = symbol.toUpperCase();
  const seed = hashString(sym);
  const rand = mulberry32(seed);
  const base = 50 + rand() * 450;
  const current = +(base * (1 + (rand() - 0.5) * 0.04)).toFixed(2);
  const prevClose = +(base * (1 + (rand() - 0.5) * 0.02)).toFixed(2);
  const change = +(current - prevClose).toFixed(2);
  const week52High = +(base * 1.25).toFixed(2);
  const week52Low = +(base * 0.72).toFixed(2);
  return {
    symbol: sym,
    name: COMPANY_NAMES[sym] ?? `${sym} Corp.`,
    current,
    change,
    changePercent: +((change / prevClose) * 100).toFixed(2),
    high: +(current * 1.015).toFixed(2),
    low: +(current * 0.985).toFixed(2),
    open: +(prevClose * 1.005).toFixed(2),
    prevClose,
    volume: Math.floor(rand() * 50_000_000) + 1_000_000,
    marketCap: Math.floor(rand() * 2_000_000_000_000),
    peRatio: +(rand() * 40 + 8).toFixed(1),
    week52High,
    week52Low,
    beta: +(rand() * 1.8 + 0.4).toFixed(2),
  };
}

export function getMockHistory(symbol: string, count: number, unitMs: number, currentPrice: number): PricePoint[] {
  const sym = symbol.toUpperCase();
  const seed = hashString(sym + '_hist');
  const rand = mulberry32(seed);
  const points: PricePoint[] = [];
  const now = Date.now();
  // Walk backwards from current price
  let price = currentPrice;
  const volatility = 0.015 + rand() * 0.02;
  for (let i = 0; i < count; i++) {
    const t = now - (count - 1 - i) * unitMs;
    if (i > 0) {
      const drift = (rand() - 0.5) * 2 * volatility;
      price = price / (1 + drift);
    }
    points.push({
      t,
      price: +price.toFixed(2),
      volume: Math.floor(rand() * 40_000_000) + 500_000,
    });
  }
  // Ensure last point is current price
  points[points.length - 1].price = currentPrice;
  return points;
}

export function getMockNews(symbol: string, name: string): NewsItem[] {
  const sym = symbol.toUpperCase();
  const seed = hashString(sym + '_news');
  const rand = mulberry32(seed);
  const count = 5;
  const items: NewsItem[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const tmpl = MOCK_NEWS_TEMPLATES[Math.floor(rand() * MOCK_NEWS_TEMPLATES.length)];
    items.push({
      id: i,
      headline: tmpl.headline.replace('{name}', name).replace('{sym}', sym),
      source: tmpl.source,
      url: `https://finance.yahoo.com/quote/${sym}`,
      datetime: now - i * (rand() * 3 + 0.5) * 3_600_000,
      sentiment: +(tmpl.sentiment * (0.7 + rand() * 0.3)).toFixed(2),
      summary: `Market analysis covering recent developments for ${name}.`,
    });
  }
  return items.sort((a, b) => b.datetime - a.datetime);
}
