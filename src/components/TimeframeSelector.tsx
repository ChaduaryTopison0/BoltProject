import { TIMEFRAMES } from '@/lib/types';
import type { TimeframeId } from '@/lib/types';

interface TimeframeSelectorProps {
  active: TimeframeId;
  onChange: (id: TimeframeId) => void;
}

export default function TimeframeSelector({ active, onChange }: TimeframeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-bg-elevated rounded-lg border border-edge">
      {TIMEFRAMES.map((tf) => {
        const isActive = tf.id === active;
        return (
          <button
            key={tf.id}
            onClick={() => onChange(tf.id)}
            title={tf.description}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : 'text-neutral-text hover:text-white hover:bg-bg-hover'
            }`}
          >
            {tf.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
