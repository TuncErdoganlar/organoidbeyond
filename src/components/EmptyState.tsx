// src/components/EmptyState.tsx
// -----------------------------------------------------------------------------
// Two flavors of empty state: initial (pre-search) and no-results.
// -----------------------------------------------------------------------------

import { Search, FilterX } from 'lucide-react';

export interface EmptyStateProps {
  variant: 'initial' | 'no-results';
  onClear?: () => void;
}

export function EmptyState({ variant, onClear }: EmptyStateProps) {
  if (variant === 'initial') {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500 mx-auto dark:bg-slate-800 dark:text-slate-400">
          <Search className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
          Pick a topic and click Search
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Type a topic or choose a preset, set a time window, and we'll pull the
          latest Molecular Biology and Genetics papers from PubMed.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500 mx-auto dark:bg-slate-800 dark:text-slate-400">
        <FilterX className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
        No articles match the current filters
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Try widening the time window or selecting a different category.
      </p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Clear category filter
        </button>
      )}
    </div>
  );
}
