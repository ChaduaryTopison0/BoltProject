import type { QuoteData, NewsItem } from './types';
import { getMockQuote, getMockNews } from './mockData';

const API_KEY_STORAGE_KEY = 'pulsemarket_finnhub_key';
const BASE = 'https://finnhub.io/api/v1';

export function getApiKey(): string | null {
  try {
    const k = localStorage.getItem(API_KEY_STORAGE_KEY);
    return k && k.trim() ? k.trim() : null;
  } catch {
    return null;
  }
}

export function setApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function clearApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function fetchQuote(symbol: string): Promise<QuoteData | null> {
  const key = getApiKey();
  if (!key) return null;
  try {
    const res = await fetch(`${BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`);
    if (!res.ok) return null;
    const d = await res.json();
    if (!d || typeof d.c !== 'number' || d.c === 0) return null;
    const profile = await fetchProfile(symbol, key);
    return {
      symbol: symbol.toUpperCase(),
      name: profile?.name ?? symbol.toUpperCase(),
      current: d.c,
      change: d.d,
      changePercent: d.dp,
      high: d.h,
      low: d.l,
      open: d.o,
      prevClose: d.pc,
      volume: 0,
      marketCap: profile?.marketCapitalization,
      peRatio: profile?.peRatio,
      week52High: profile?.week52High,
      week52Low: profile?.week52Low,
      beta: profile?.beta,
    };
  } catch {
    return null;
  }
}

async function fetchProfile(symbol: string, key: string): Promise<{
  name: string;
  marketCapitalization?: number;
  peRatio?: number;
  week52High?: number;
  week52Low?: number;
  beta?: number;
} | null> {
  try {
    const res = await fetch(`${BASE}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${key}`);
    if (!res.ok) return null;
    const d = await res.json();
    return {
      name: d.name ?? symbol.toUpperCase(),
      marketCapitalization: d.marketCapitalization,
      peRatio: d.peRatio,
      week52High: d.week52High,
      week52Low: d.week52Low,
      beta: d.beta,
    };
  } catch {
    return null;
  }
}

export async function fetchNews(symbol: string, name: string): Promise<NewsItem[] | null> {
  const key = getApiKey();
  if (!key) return null;
  try {
    const now = Date.now();
    const from = new Date(now - 7 * 86_400_000).toISOString().slice(0, 10);
    const to = new Date(now).toISOString().slice(0, 10);
    const res = await fetch(`${BASE}/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${key}`);
    if (!res.ok) return null;
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const items: NewsItem[] = arr.slice(0, 8).map((n: any, i: number) => ({
      id: i,
      headline: n.headline ?? '',
      source: n.source ?? 'Unknown',
      url: n.url ?? '',
      datetime: (n.datetime ?? Math.floor(now / 1000)) * 1000,
      sentiment: scoreSentiment(n.headline ?? ''),
      summary: n.summary ?? '',
    }));
    return items.sort((a, b) => b.datetime - a.datetime).slice(0, 5);
  } catch {
    return null;
  }
}

// Lightweight keyword-based sentiment scorer for real headlines
const POSITIVE = ['beat', 'beats', 'surge', 'jump', 'rise', 'upgrade', 'raise', 'record', 'profit', 'gain', 'bullish', 'outperform', 'strong', 'partnership', 'launch', 'win', 'approve', 'breakthrough', 'innovation'];
const NEGATIVE = ['miss', 'misses', 'fall', 'drop', 'plunge', 'cut', 'downgrade', 'loss', 'bearish', 'weak', 'lawsuit', 'probe', 'investigation', 'recall', 'fraud', 'crash', 'sell', 'concern', 'warning', 'decline'];

function scoreSentiment(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of POSITIVE) if (lower.includes(w)) score += 0.25;
  for (const w of NEGATIVE) if (lower.includes(w)) score -= 0.25;
  return Math.max(-1, Math.min(1, +score.toFixed(2)));
}

// Mock fallbacks
export function mockQuote(symbol: string): QuoteData {
  return getMockQuote(symbol);
}

export function mockNews(symbol: string, name: string): NewsItem[] {
  return getMockNews(symbol, name);
}
