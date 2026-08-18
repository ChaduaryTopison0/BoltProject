import { useState, useEffect } from 'react';
import { Key, X, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { getApiKey, setApiKey, clearApiKey } from '@/lib/finnhubClient';

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ApiKeyModal({ open, onClose, onSaved }: ApiKeyModalProps) {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setKey(getApiKey() ?? '');
      setSaved(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    setApiKey(key);
    setSaved(true);
    setTimeout(() => {
      onSaved();
      onClose();
    }, 600);
  };

  const handleClear = () => {
    clearApiKey();
    setKey('');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-panel w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center">
              <Key className="w-4 h-4 text-accent" />
            </div>
            <h2 className="text-base font-semibold">Finnhub API Key</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-bg-hover flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-neutral-text" />
          </button>
        </div>

        <p className="text-xs text-neutral-text leading-relaxed mb-4">
          Enter your free Finnhub API key to pull live stock quotes and company news. Without a key, the dashboard uses realistic mock data so all features still work.
        </p>

        <div className="mb-3">
          <label className="text-[10px] text-neutral-muted mb-1 block uppercase tracking-wide">API Key</label>
          <input
            type="password"
            value={key}
            onChange={(e) => { setKey(e.target.value); setSaved(false); }}
            placeholder="Enter your Finnhub API key"
            className="w-full bg-bg-elevated border border-edge rounded-md px-3 py-2 text-sm tabular focus:outline-none focus:border-accent/60 transition-colors"
            autoFocus
          />
        </div>

        <div className="flex items-start gap-2 mb-4 text-[11px] text-neutral-muted bg-bg-elevated/50 rounded-md p-2.5 border border-edge/40">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-warn" />
          <span>
            Get a free key at{' '}
            <a href="https://finnhub.io/register" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-0.5">
              finnhub.io <ExternalLink className="w-2.5 h-2.5" />
            </a>
            . The key is stored only in your browser's local storage.
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Key'}
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-2 rounded-md bg-bg-elevated border border-edge text-neutral-text text-sm font-medium hover:border-bear/40 hover:text-bear transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
