// src/components/EmptyState.tsx
// -----------------------------------------------------------------------------
// Two flavors of empty state, distinguished by `variant`:
//   - 'initial' : pre-search. Invites the user to click Search.
//   - 'no-results': search ran but the chosen filters returned nothing.
// -----------------------------------------------------------------------------

import { Search, FilterX } from 'lucide-react';

export interface EmptyStateProps {
  variant: 'initial' | 'no-results';
  onClear?: () => void;
}

export function EmptyState({ variant, onClear }: EmptyStateProps) {
  if (variant === 'initial') {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500 mx-auto">
          <Search className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Pick a window and click Search
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose a time range above and we'll pull the latest Molecular Biology
          and Genetics papers from PubMed, auto-categorized for you.
        </p>
      </div>
    );
  }

  // 'no-results'
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500 mx-auto">
        <FilterX className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">
        No articles match the current filters
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Try widening the time window or selecting a different category.
      </p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Clear category filter
        </button>
      )}
    </div>
  );
}
