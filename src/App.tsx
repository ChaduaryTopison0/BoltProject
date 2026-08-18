import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { QuoteData, NewsItem, PricePoint, TimeframeId, ForecastResult, ScenarioOverrides } from '@/lib/types';
import { getTimeframe, unitMs } from '@/lib/types';
import { fetchQuote, fetchNews, getApiKey, mockQuote, mockNews } from '@/lib/finnhubClient';
import { getMockHistory, getMockQuote } from '@/lib/mockData';
import { runForecast } from '@/lib/forecastEngine';

import Header from '@/components/Header';
import MarketStatusBanner from '@/components/MarketStatusBanner';
import TimeframeSelector from '@/components/TimeframeSelector';
import PriceChart from '@/components/PriceChart';
import VolumeBars from '@/components/VolumeBars';
import PredictionBreakdown from '@/components/PredictionBreakdown';
import BuySellTable from '@/components/BuySellTable';
import ScenarioSimulator from '@/components/ScenarioSimulator';
import ProfitLossCalculator from '@/components/ProfitLossCalculator';
import NewsFeed from '@/components/NewsFeed';
import WatchlistSidebar from '@/components/WatchlistSidebar';
import ApiKeyModal from '@/components/ApiKeyModal';

const WATCHLIST_KEY = 'pulsemarket_watchlist';
const DEFAULT_SYMBOL = 'AAPL';

export default function App() {
  // ── State ──────────────────────────────────────────────────
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [searchValue, setSearchValue] = useState(DEFAULT_SYMBOL);
  const [timeframe, setTimeframe] = useState<TimeframeId>('1W');
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<ScenarioOverrides>({ earningsSurprise: 0, sectorSentiment: 0 });
  const [watchlist, setWatchlist] = useState<string[]>([DEFAULT_SYMBOL]);

  // ── Refs for interval management ────────────────────────────
  const refreshIntervalRef = useRef<number | null>(null);
  const symbolRef = useRef(symbol);
  const timeframeRef = useRef(timeframe);

  symbolRef.current = symbol;
  timeframeRef.current = timeframe;

  // ── Load watchlist from localStorage ────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWatchlist(parsed);
        }
      }
    } catch {
      // ignore
    }
    setHasApiKey(!!getApiKey());
  }, []);

  // ── Persist watchlist ───────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    } catch {
      // ignore
    }
  }, [watchlist]);

  // ── Data loading ────────────────────────────────────────────
  const loadQuote = useCallback(async (sym: string) => {
    const liveQuote = await fetchQuote(sym);
    if (liveQuote) {
      setQuote(liveQuote);
      setIsMock(false);
    } else {
      // Fallback to mock
      setQuote(mockQuote(sym));
      setIsMock(true);
    }
  }, []);

  const loadNews = useCallback(async (sym: string, name: string) => {
    const liveNews = await fetchNews(sym, name);
    if (liveNews && liveNews.length > 0) {
      setNews(liveNews);
    } else {
      setNews(mockNews(sym, name));
    }
  }, []);

  const loadHistory = useCallback((sym: string, tfId: TimeframeId, currentPrice: number) => {
    const tf = getTimeframe(tfId);
    const ms = unitMs(tf.historyUnit);
    setHistory(getMockHistory(sym, tf.historyCount, ms, currentPrice));
  }, []);

  // ── Initial load + symbol change ────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sym = symbol;
      // Load quote first
      const liveQuote = await fetchQuote(sym);
      if (cancelled) return;
      let q: QuoteData;
      if (liveQuote) {
        setQuote(liveQuote);
        setIsMock(false);
        q = liveQuote;
      } else {
        const mq = mockQuote(sym);
        setQuote(mq);
        setIsMock(true);
        q = mq;
      }
      // Load news with the name
      await loadNews(sym, q.name);
      if (cancelled) return;
      // Load history
      loadHistory(sym, timeframeRef.current, q.current);
    })();
    return () => { cancelled = true; };
  }, [symbol, loadNews, loadHistory]);

  // ── Refresh interval (cleared on every change) ───────────────
  useEffect(() => {
    // Clear any existing interval first
    if (refreshIntervalRef.current !== null) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    const tf = getTimeframe(timeframe);
    if (tf.refreshMs > 0) {
      refreshIntervalRef.current = window.setInterval(() => {
        // Only refresh if symbol/timeframe haven't changed
        const currentSym = symbolRef.current;
        const currentTf = timeframeRef.current;
        if (currentSym !== symbol || currentTf !== timeframe) return;
        // For RT: simulate live tick — jitter the current price slightly
        if (timeframe === 'RT') {
          setQuote((prev) => {
            if (!prev) return prev;
            const jitter = (Math.random() - 0.5) * 0.004;
            const newPrice = +(prev.current * (1 + jitter)).toFixed(2);
            const change = +(newPrice - prev.prevClose).toFixed(2);
            const changePercent = +((change / prev.prevClose) * 100).toFixed(2);
            // Append tick to history
            setHistory((h) => {
              const newPoint: PricePoint = { t: Date.now(), price: newPrice, volume: Math.floor(Math.random() * 5_000_000) + 500_000 };
              const updated = [...h, newPoint];
              return updated.slice(-getTimeframe('RT').historyCount);
            });
            return { ...prev, current: newPrice, change, changePercent };
          });
        } else {
          // For 1H: just reload quote
          loadQuote(symbolRef.current);
        }
      }, tf.refreshMs);
    }

    // Cleanup: clear interval on unmount or before next effect run
    return () => {
      if (refreshIntervalRef.current !== null) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [timeframe, symbol, loadQuote]);

  // ── Recompute history when timeframe changes (non-RT) ────────
  useEffect(() => {
    if (timeframe !== 'RT' && quote) {
      loadHistory(symbol, timeframe, quote.current);
    }
    // For RT, generate fresh tick history
    if (timeframe === 'RT' && quote) {
      const tf = getTimeframe('RT');
      const ms = unitMs(tf.historyUnit);
      setHistory(getMockHistory(symbol, tf.historyCount, ms, quote.current));
    }
  }, [timeframe, quote?.current, symbol, loadHistory, quote]);

  // ── Forecast ────────────────────────────────────────────────
  const forecast: ForecastResult | null = useMemo(() => {
    if (history.length === 0 || !quote) return null;
    const tf = getTimeframe(timeframe);
    return runForecast(history, news, tf.forecastCount, tf.forecastUnit, quote, overrides);
  }, [history, news, quote, timeframe, overrides]);

  // ── Handlers ────────────────────────────────────────────────
  const handleSearchSubmit = (v: string) => {
    const sym = v.trim().toUpperCase();
    if (sym && sym.length > 0 && sym.length <= 6) {
      setSymbol(sym);
      setSearchValue(sym);
      setPurchasePrice(null);
      setOverrides({ earningsSurprise: 0, sectorSentiment: 0 });
      if (!watchlist.includes(sym)) {
        setWatchlist((w) => [...w, sym]);
      }
    }
  };

  const handlePickWatchlist = (sym: string) => {
    setSymbol(sym);
    setSearchValue(sym);
    setPurchasePrice(null);
    setOverrides({ earningsSurprise: 0, sectorSentiment: 0 });
  };

  const handleAddWatchlist = (sym: string) => {
    if (!watchlist.includes(sym)) {
      setWatchlist((w) => [...w, sym]);
    }
  };

  const handleRemoveWatchlist = (sym: string) => {
    setWatchlist((w) => w.filter((s) => s !== sym));
  };

  const handleApiKeySaved = () => {
    setHasApiKey(!!getApiKey());
    // Reload data with new key
    loadQuote(symbol);
    if (quote) loadNews(symbol, quote.name);
  };

  const handleResetOverrides = () => {
    setOverrides({ earningsSurprise: 0, sectorSentiment: 0 });
  };

  const tf = getTimeframe(timeframe);

  return (
    <div className="min-h-screen bg-bg-base">
      <MarketStatusBanner />
      <Header
        quote={quote}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchSubmit={handleSearchSubmit}
        onOpenSettings={() => setApiKeyModalOpen(true)}
        hasApiKey={hasApiKey}
        watchlist={watchlist}
        onPickWatchlist={handlePickWatchlist}
      />

      <main className="mx-auto max-w-[1600px] px-4 lg:px-6 py-4">
        {/* Top bar: timeframe + confidence + mock indicator */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <TimeframeSelector active={timeframe} onChange={setTimeframe} />
            <span className="text-[11px] text-neutral-muted hidden sm:inline">{tf.description}</span>
          </div>
          <div className="flex items-center gap-3">
            {isMock && (
              <span className="text-[10px] text-warn bg-warn-soft px-2.5 py-1 rounded border border-warn/30 font-medium">
                Mock Data — Set API key for live quotes
              </span>
            )}
            {forecast && (
              <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg">
                <span className="text-[10px] text-neutral-muted uppercase tracking-wide">Confidence</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        forecast.confidence >= 70 ? 'bg-bull' : forecast.confidence >= 55 ? 'bg-warn' : 'bg-bear'
                      }`}
                      style={{ width: `${forecast.confidence}%` }}
                    />
                  </div>
                  <span className={`tabular text-sm font-bold ${
                    forecast.confidence >= 70 ? 'text-bull' : forecast.confidence >= 55 ? 'text-warn' : 'text-bear'
                  }`}>
                    {forecast.confidence}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left sidebar: watchlist */}
          <div className="col-span-12 lg:col-span-2 order-3 lg:order-1">
            <WatchlistSidebar
              watchlist={watchlist}
              activeSymbol={symbol}
              onPick={handlePickWatchlist}
              onAdd={handleAddWatchlist}
              onRemove={handleRemoveWatchlist}
            />
          </div>

          {/* Center: chart + volume */}
          <div className="col-span-12 lg:col-span-7 order-1 lg:order-2 space-y-4">
            {forecast ? (
              <>
                <PriceChart
                  combined={forecast.combined}
                  history={forecast.history}
                  forecast={forecast.forecast}
                  quote={quote}
                  purchasePrice={purchasePrice}
                  onClearPurchase={() => setPurchasePrice(null)}
                  timeframeUnit={tf.historyUnit}
                />
                <VolumeBars combined={forecast.combined} timeframeUnit={tf.historyUnit} />
              </>
            ) : (
              <div className="glass-panel p-8 flex items-center justify-center h-[460px]">
                <div className="text-neutral-muted text-sm">Loading forecast data...</div>
              </div>
            )}
          </div>

          {/* Right: prediction + buy/sell */}
          <div className="col-span-12 lg:col-span-3 order-2 lg:order-3 space-y-4">
            {forecast && (
              <>
                <PredictionBreakdown forecast={forecast} quote={quote} />
                <BuySellTable forecast={forecast} quote={quote} />
              </>
            )}
          </div>
        </div>

        {/* Bottom row: simulator + P&L + news */}
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-12 md:col-span-4">
            <ScenarioSimulator overrides={overrides} onChange={setOverrides} onReset={handleResetOverrides} />
          </div>
          <div className="col-span-12 md:col-span-4">
            {forecast && (
              <ProfitLossCalculator
                quote={quote}
                forecast={forecast}
                purchasePrice={purchasePrice}
                onPurchasePriceChange={setPurchasePrice}
              />
            )}
          </div>
          <div className="col-span-12 md:col-span-4">
            <NewsFeed news={news} isMock={isMock} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 pb-4 text-center text-[10px] text-neutral-muted">
          PulseMarket — AI Forecast Engine · For educational purposes only, not financial advice
        </footer>
      </main>

      <ApiKeyModal
        open={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onSaved={handleApiKeySaved}
      />
    </div>
  );
}
