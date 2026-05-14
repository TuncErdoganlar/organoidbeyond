// src/components/ControlPanel.tsx
// -----------------------------------------------------------------------------
// Search controls: topic (narrowing PubMed) → time window → Search.
// -----------------------------------------------------------------------------

import { Search, Loader2 } from 'lucide-react';
import { TimeWindowSelect } from './TimeWindowSelect';
import { CategoryFilter } from './CategoryFilter';
import type { Category, TimeWindow } from '@/types/article.types';

export interface ControlPanelProps {
  /** Currently selected window. */
  window: TimeWindow;
  onWindowChange: (next: TimeWindow) => void;

  /** Currently selected category (null = All). */
  category: Category | null;
  onCategoryChange: (next: Category | null) => void;

  /**
   * When true, chips show `"Label (count)"`; when false (idle/loading/error),
   * omit counts until a stable result set exists.
   */
  showCategoryCounts: boolean;

  /** Per-topic counts derived from categorized articles after fetch. */
  categoryCounts?: Partial<Record<Category, number>>;

  /** Fires when the user clicks the Search button. */
  onSearch: () => void;

  /** True while a request is in flight; disables controls and animates the icon. */
  loading: boolean;
}

export function ControlPanel(props: ControlPanelProps) {
  const counts =
    props.showCategoryCounts ? props.categoryCounts : undefined;

  return (
    <section
      aria-label="Search controls"
      className="mx-auto w-full max-w-6xl px-6 py-6"
    >
      {/* Step 1 — Topic narrows PubMed AND client slice when switching chips. */}
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          1. Topic
        </h2>
        <CategoryFilter
          value={props.category}
          onChange={props.onCategoryChange}
          counts={counts}
          disabled={props.loading}
        />
      </div>

      {/* Step 2 + 3 — Time window then search. */}
      <div className="mt-5 flex flex-wrap items-end gap-4">
        <div className="min-w-0">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            2. Time range
          </h2>
          <TimeWindowSelect
            value={props.window}
            onChange={props.onWindowChange}
            disabled={props.loading}
          />
        </div>

        <div className="pb-px">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            3. Search
          </h2>
          <button
            type="button"
            onClick={props.onSearch}
            disabled={props.loading}
            aria-label="Search PubMed using the chosen topic filters and publication time window"
            className={[
              'focus-ring inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition',
              'hover:bg-brand-600',
              props.loading ? 'cursor-not-allowed opacity-80' : '',
            ].join(' ')}
          >
            {props.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            {props.loading ? 'Searching…' : 'Search PubMed'}
          </button>
        </div>
      </div>
    </section>
  );
}
