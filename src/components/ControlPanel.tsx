// src/components/ControlPanel.tsx
// -----------------------------------------------------------------------------
// The row of dashboard controls: TimeWindowSelect + Search button + (after a
// search) the category chip row. Categories are intentionally rendered AFTER
// the first search so the empty initial state stays uncluttered.
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

  /** Whether the category row should be visible (true after first search). */
  showCategories: boolean;

  /** Per-category counts for chip labels (e.g., "Cancer (8)"). */
  categoryCounts?: Partial<Record<Category, number>>;

  /** Fires when the user clicks the Search button. */
  onSearch: () => void;

  /** True while a request is in flight; disables controls and animates the icon. */
  loading: boolean;
}

export function ControlPanel(props: ControlPanelProps) {
  return (
    <section
      aria-label="Search controls"
      className="mx-auto w-full max-w-6xl px-6 py-6"
    >
      {/* Window selector + Search button row. */}
      <div className="flex flex-wrap items-center gap-3">
        <TimeWindowSelect
          value={props.window}
          onChange={props.onWindowChange}
          disabled={props.loading}
        />

        <button
          type="button"
          onClick={props.onSearch}
          disabled={props.loading}
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

      {/* Category chip row — only visible once the user has results to slice. */}
      {props.showCategories && (
        <div className="mt-5">
          <CategoryFilter
            value={props.category}
            onChange={props.onCategoryChange}
            counts={props.categoryCounts}
            disabled={props.loading}
          />
        </div>
      )}
    </section>
  );
}
