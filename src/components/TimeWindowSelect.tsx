// src/components/TimeWindowSelect.tsx
// -----------------------------------------------------------------------------
// A segmented-button control for picking the publication time window.
// -----------------------------------------------------------------------------

import type { TimeWindow } from '@/types/article.types';

const WINDOW_OPTIONS: ReadonlyArray<{ value: TimeWindow; label: string }> = [
  { value: '1w', label: '1 week' },
  { value: '1m', label: '1 month' },
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: '1y', label: '1 year' },
  { value: '2y', label: '2 years' },
];

export interface TimeWindowSelectProps {
  value: TimeWindow;
  onChange: (next: TimeWindow) => void;
  disabled?: boolean;
}

export function TimeWindowSelect({ value, onChange, disabled }: TimeWindowSelectProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Publication time window"
      className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-card dark:border-slate-700 dark:bg-slate-900"
    >
      {WINDOW_OPTIONS.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={[
              'focus-ring rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-500 text-white shadow-sm dark:bg-brand-500'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50',
              disabled ? 'cursor-not-allowed opacity-60 hover:bg-transparent dark:hover:bg-transparent' : '',
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
