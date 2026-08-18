import { Newspaper, ExternalLink, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import type { NewsItem } from '@/lib/types';

interface NewsFeedProps {
  news: NewsItem[];
  isMock: boolean;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const hrs = diff / 3_600_000;
  if (hrs < 1) return `${Math.floor(diff / 60_000)}m ago`;
  if (hrs < 24) return `${Math.floor(hrs)}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SentimentBadge({ score }: { score: number }) {
  const isPositive = score > 0.15;
  const isNegative = score < -0.15;
  const Icon = isPositive ? ThumbsUp : isNegative ? ThumbsDown : Minus;
  const color = isPositive ? 'text-bull bg-bull-soft border-bull/30' : isNegative ? 'text-bear bg-bear-soft border-bear/30' : 'text-neutral-text bg-bg-elevated border-edge';
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${color}`}>
      <Icon className="w-2.5 h-2.5" />
      {score > 0 ? '+' : ''}{score.toFixed(2)}
    </span>
  );
}

export default function NewsFeed({ news, isMock }: NewsFeedProps) {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-warn" />
          <h3 className="text-sm font-semibold text-white/90">News & Sentiment</h3>
        </div>
        {isMock && (
          <span className="text-[10px] text-warn bg-warn-soft px-2 py-0.5 rounded border border-warn/30">
            Mock Data
          </span>
        )}
      </div>

      {news.length === 0 ? (
        <p className="text-xs text-neutral-muted text-center py-4">No news available.</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {news.map((item) => (
            <a
              key={item.id}
              href={item.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-bg-elevated/50 rounded-lg p-3 border border-edge/50 hover:border-edge-strong hover:bg-bg-hover/50 transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-xs font-medium text-white/85 leading-snug group-hover:text-white transition-colors line-clamp-2">
                  {item.headline}
                </p>
                <ExternalLink className="w-3 h-3 text-neutral-muted shrink-0 mt-0.5 group-hover:text-accent transition-colors" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-muted">{item.source}</span>
                <span className="text-neutral-muted">·</span>
                <span className="text-[10px] text-neutral-muted tabular">{timeAgo(item.datetime)}</span>
                <div className="ml-auto">
                  <SentimentBadge score={item.sentiment} />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
      <p className="text-[10px] text-neutral-muted mt-2 leading-relaxed">
        Sentiment scores feed the forecast engine's sentiment model in real time.
      </p>
    </div>
  );
}
