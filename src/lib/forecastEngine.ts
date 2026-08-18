import type { PricePoint, NewsItem, ForecastResult, ScenarioOverrides, QuoteData } from './types';
import { unitMs } from './types';

// ── Indicators ──────────────────────────────────────────────

function ema(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out.push(values[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

function sma(values: number[], period: number): number {
  if (values.length === 0) return 0;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function rsi(values: number[], period: number = 14): number {
  if (values.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// ── Technical Model ──────────────────────────────────────────
// EMA12/EMA26 crossover + RSI(14) correction + SMA20 mean reversion

function technicalForecast(history: PricePoint[], steps: number, stepMs: number): { series: PricePoint[]; target: number; rationale: string } {
  const prices = history.map((p) => p.price);
  if (prices.length < 5) {
    const last = prices[prices.length - 1] ?? 100;
    return { series: flatForecast(last, steps, stepMs, history), target: last, rationale: 'Insufficient history for technical signals.' };
  }
  const ema12 = ema(prices, 12);
  const ema26 = ema(prices, 26);
  const lastEma12 = ema12[ema12.length - 1];
  const lastEma26 = ema26[ema26.length - 1];
  const crossover = lastEma12 - lastEma26; // positive = bullish
  const crossoverPct = crossover / prices[prices.length - 1];
  const rsiVal = rsi(prices, 14);
  const sma20 = sma(prices, 20);
  const lastPrice = prices[prices.length - 1];
  const meanReversion = (sma20 - lastPrice) / lastPrice; // positive = price below avg → revert up

  // Per-step drift: crossover momentum + RSI correction + mean reversion
  // RSI correction: if RSI > 70, bearish correction; if < 30, bullish correction
  const rsiCorrection = rsiVal > 70 ? -(rsiVal - 70) / 100 * 0.3 : rsiVal < 30 ? (30 - rsiVal) / 100 * 0.3 : 0;
  const stepDrift = (crossoverPct * 0.4 + meanReversion * 0.3 + rsiCorrection) / steps;
  const clampedStepDrift = clamp(stepDrift, -0.01, 0.01); // ±1% per step

  const series: PricePoint[] = [];
  let price = lastPrice;
  for (let i = 0; i < steps; i++) {
    price = price * (1 + clampedStepDrift);
    series.push({
      t: history[history.length - 1].t + (i + 1) * stepMs,
      price: +price.toFixed(2),
      volume: 0,
      forecast: true,
    });
  }
  const target = series[series.length - 1].price;
  const signal = crossover > 0 ? 'bullish crossover' : 'bearish crossover';
  const rsiSignal = rsiVal > 70 ? 'overbought' : rsiVal < 30 ? 'oversold' : 'neutral';
  const rationale = `EMA12/EMA26 ${signal} (RSI ${rsiVal.toFixed(0)} — ${rsiSignal}), SMA20 mean-reversion ${meanReversion >= 0 ? 'lifts' : 'pressures'} the target.`;
  return { series, target, rationale };
}

// ── Sentiment Model ─────────────────────────────────────────
// Decaying news-sentiment push + SMA20 mean reversion

function sentimentForecast(history: PricePoint[], news: NewsItem[], steps: number, stepMs: number, overrides?: ScenarioOverrides): { series: PricePoint[]; target: number; rationale: string } {
  const prices = history.map((p) => p.price);
  const lastPrice = prices[prices.length - 1] ?? 100;
  const sma20 = sma(prices, 20);
  const meanReversion = (sma20 - lastPrice) / lastPrice;

  // Aggregate news sentiment with time decay
  const now = Date.now();
  let weightedSentiment = 0;
  let weightSum = 0;
  for (const n of news) {
    const ageHrs = (now - n.datetime) / 3_600_000;
    const decay = Math.exp(-ageHrs / 48); // half-life ~33h
    weightedSentiment += n.sentiment * decay;
    weightSum += decay;
  }
  let sentimentScore = weightSum > 0 ? weightedSentiment / weightSum : 0; // -1..1

  // Apply scenario overrides
  if (overrides) {
    sentimentScore += overrides.earningsSurprise / 100 * 0.5;
    sentimentScore += overrides.sectorSentiment / 100 * 0.3;
    sentimentScore = clamp(sentimentScore, -1, 1);
  }

  // Per-step drift: sentiment push decays over horizon + mean reversion
  const sentimentPush = sentimentScore * 0.04; // up to 4% total move from sentiment
  const stepDrift = (sentimentPush * 0.6 + meanReversion * 0.3) / steps;
  const clampedStepDrift = clamp(stepDrift, -0.01, 0.01);

  const series: PricePoint[] = [];
  let price = lastPrice;
  for (let i = 0; i < steps; i++) {
    price = price * (1 + clampedStepDrift);
    series.push({
      t: history[history.length - 1].t + (i + 1) * stepMs,
      price: +price.toFixed(2),
      volume: 0,
      forecast: true,
    });
  }
  const target = series[series.length - 1].price;
  const sentimentLabel = sentimentScore > 0.2 ? 'positive' : sentimentScore < -0.2 ? 'negative' : 'mixed';
  const rationale = `News sentiment is ${sentimentLabel} (${(sentimentScore * 100).toFixed(0)} score), decaying push ${sentimentPush >= 0 ? 'lifts' : 'drags'} target; SMA20 reversion ${meanReversion >= 0 ? 'supports' : 'offsets'}.`;
  return { series, target, rationale };
}

// ── Consensus Ensemble ───────────────────────────────────────

function consensusForecast(
  techSeries: PricePoint[],
  sentSeries: PricePoint[],
  history: PricePoint[],
  steps: number,
  stepMs: number,
  quote: QuoteData | null,
): { series: PricePoint[]; target: number; rationale: string } {
  const series: PricePoint[] = [];
  for (let i = 0; i < steps; i++) {
    const avg = (techSeries[i].price + sentSeries[i].price) / 2;
    const disagreement = Math.abs(techSeries[i].price - sentSeries[i].price) / avg;
    const bandWidth = Math.min(0.02 + disagreement * 0.03, 0.06); // ±2% widening with disagreement
    series.push({
      t: techSeries[i].t,
      price: +avg.toFixed(2),
      volume: 0,
      forecast: true,
      upper: +(avg * (1 + bandWidth)).toFixed(2),
      lower: +(avg * (1 - bandWidth)).toFixed(2),
    });
  }
  const target = series[series.length - 1].price;

  // Soft-clamp against 52-week range
  let clampedTarget = target;
  let clampNote = '';
  if (quote?.week52High && quote.week52Low) {
    const hi = quote.week52High;
    const lo = quote.week52Low;
    if (clampedTarget > hi) {
      clampedTarget = hi - (hi - quote.current) * 0.1;
      clampNote = ' Soft-clamped below 52-week high.';
    } else if (clampedTarget < lo) {
      clampedTarget = lo + (quote.current - lo) * 0.1;
      clampNote = ' Soft-clamped above 52-week low.';
    }
  }
  // Update last point
  series[series.length - 1].price = +clampedTarget.toFixed(2);

  const rationale = `Averaged technical + sentiment projections into a consensus target${clampNote}.`;
  return { series, target: clampedTarget, rationale };
}

// ── Confidence Score ────────────────────────────────────────

function computeConfidence(techTarget: number, sentTarget: number, currentPrice: number): number {
  const techMove = (techTarget - currentPrice) / currentPrice;
  const sentMove = (sentTarget - currentPrice) / currentPrice;
  const divergence = Math.abs(techMove - sentMove);
  const avgMagnitude = Math.abs((techMove + sentMove) / 2);
  // Base 50, +agreement, -divergence, +magnitude (capped)
  let conf = 50;
  conf += Math.max(0, 20 - divergence * 200); // agreement bonus
  conf += Math.min(26, avgMagnitude * 300); // magnitude bonus
  conf = clamp(conf, 45, 96);
  return Math.round(conf);
}

// ── Recommendation ───────────────────────────────────────────

function computeRecommendation(consensusTarget: number, currentPrice: number): 'BUY' | 'SELL' | 'HOLD' {
  const move = (consensusTarget - currentPrice) / currentPrice;
  if (move > 0.02) return 'BUY';
  if (move < -0.02) return 'SELL';
  return 'HOLD';
}

// ── Hard-Clamp Total Horizon ─────────────────────────────────

function clampHorizon(series: PricePoint[], currentPrice: number, quote: QuoteData | null): PricePoint[] {
  const beta = quote?.beta ?? 1;
  const maxMove = Math.min(0.08, 0.05 + (beta - 1) * 0.02); // scale with beta, cap 8%
  const absMax = Math.max(0.05, Math.min(0.08, maxMove));
  return series.map((p) => {
    const move = (p.price - currentPrice) / currentPrice;
    const clamped = clamp(move, -absMax, absMax);
    const newPrice = currentPrice * (1 + clamped);
    const upper = p.upper ? currentPrice * (1 + clamp((p.upper - currentPrice) / currentPrice, -absMax * 1.3, absMax * 1.3)) : undefined;
    const lower = p.lower ? currentPrice * (1 + clamp((p.lower - currentPrice) / currentPrice, -absMax * 1.3, absMax * 1.3)) : undefined;
    return {
      ...p,
      price: +newPrice.toFixed(2),
      upper: upper ? +upper.toFixed(2) : undefined,
      lower: lower ? +lower.toFixed(2) : undefined,
    };
  });
}

// ── Main Entry ───────────────────────────────────────────────

export function runForecast(
  history: PricePoint[],
  news: NewsItem[],
  steps: number,
  stepUnit: 'day' | 'hour' | 'minute',
  quote: QuoteData | null,
  overrides?: ScenarioOverrides,
): ForecastResult {
  const stepMs = unitMs(stepUnit);
  const safeHistory = history.length > 0 ? history : [{ t: Date.now(), price: 100, volume: 0 }];
  const currentPrice = safeHistory[safeHistory.length - 1].price;

  // Defensive sanity check: if SMA20 has drifted too far from the current
  // price, the mean-reversion signal will be misleading. This catches
  // data-wiring regressions (e.g. history not anchored to current price)
  // instead of silently producing a bad forecast.
  const prices = safeHistory.map((p) => p.price);
  const sma20 = sma(prices, 20);
  if (currentPrice > 0) {
    const deviation = Math.abs(sma20 - currentPrice) / currentPrice;
    if (deviation > 0.15) {
      console.warn(
        `[PulseMarket] SMA20 deviation exceeds 15% — sma20=${sma20.toFixed(2)}, currentPrice=${currentPrice.toFixed(2)}, deviation=${(deviation * 100).toFixed(1)}%. Check history data wiring.`,
      );
    }
  }

  const tech = technicalForecast(safeHistory, steps, stepMs);
  const sent = sentimentForecast(safeHistory, news, steps, stepMs, overrides);

  // Hard-clamp each model's horizon
  const techClamped = clampHorizon(tech.series, currentPrice, quote);
  const sentClamped = clampHorizon(sent.series, currentPrice, quote);

  const consensus = consensusForecast(techClamped, sentClamped, safeHistory, steps, stepMs, quote);
  const consensusClamped = clampHorizon(consensus.series, currentPrice, quote);

  const techTarget = techClamped[techClamped.length - 1].price;
  const sentTarget = sentClamped[sentClamped.length - 1].price;
  const consensusTarget = consensusClamped[consensusClamped.length - 1].price;

  const confidence = computeConfidence(techTarget, sentTarget, currentPrice);
  const recommendation = computeRecommendation(consensusTarget, currentPrice);

  const combined: PricePoint[] = [...safeHistory, ...consensusClamped];

  return {
    history: safeHistory,
    forecast: consensusClamped,
    combined,
    technicalTarget: techTarget,
    sentimentTarget: sentTarget,
    consensusTarget,
    confidence,
    technicalRationale: tech.rationale,
    sentimentRationale: sent.rationale,
    consensusRationale: consensus.rationale,
    recommendation,
  };
}

// ── Helpers ──────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function flatForecast(lastPrice: number, steps: number, stepMs: number, history: PricePoint[]): PricePoint[] {
  const lastT = history.length > 0 ? history[history.length - 1].t : Date.now();
  const series: PricePoint[] = [];
  for (let i = 0; i < steps; i++) {
    series.push({
      t: lastT + (i + 1) * stepMs,
      price: lastPrice,
      volume: 0,
      forecast: true,
    });
  }
  return series;
}

// ── Buy/Sell Table ────────────────────────────────────────────

export interface BuySellWindow {
  label: string;
  low: number;
  high: number;
  confidence: number;
  action: 'BUY' | 'SELL' | 'HOLD';
}

export function computeBuySellWindows(currentPrice: number, consensusTarget: number, confidence: number): BuySellWindow[] {
  const move = (consensusTarget - currentPrice) / currentPrice;
  const isBullish = move > 0;
  const band = 0.01 + (confidence / 100) * 0.02;
  return [
    {
      label: 'Aggressive',
      low: +(currentPrice * (1 - band * 1.5)).toFixed(2),
      high: +(currentPrice * (1 + band * 0.5)).toFixed(2),
      confidence: Math.min(96, confidence + 8),
      action: isBullish ? 'BUY' : 'SELL',
    },
    {
      label: 'Balanced',
      low: +(currentPrice * (1 - band)).toFixed(2),
      high: +(currentPrice * (1 + band)).toFixed(2),
      confidence,
      action: isBullish ? 'BUY' : move < -0.02 ? 'SELL' : 'HOLD',
    },
    {
      label: 'Conservative',
      low: +(currentPrice * (1 - band * 0.5)).toFixed(2),
      high: +(currentPrice * (1 + band * 1.5)).toFixed(2),
      confidence: Math.max(45, confidence - 8),
      action: isBullish ? 'HOLD' : 'SELL',
    },
  ];
}
