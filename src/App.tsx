// src/App.tsx
// -----------------------------------------------------------------------------
// THE DASHBOARD
//
// Top-level composition. Owns:
//   - The selected `window` (TimeWindow) and `category` (Category | null)
//     filter state.
//   - The `useArticles` hook that performs the actual PubMed fetch.
//   - The decision tree of *which* sub-view to render (initial empty / loading
//     skeletons / error / no-results / grid of cards).
//
// Notes:
//   - The category filter is applied **client-side** (via `useMemo`). The
//     service layer always returns the full set for the chosen window; the UI
//     just slices it. This means category clicks are instant — no extra HTTP.
//   - Category counts shown next to each chip are also derived client-side,
//     so the user knows how big each bucket is before clicking.
// -----------------------------------------------------------------------------

import { useMemo, useState, type ReactNode } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { ArticleGrid } from './components/ArticleGrid';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { EmptyState } from './components/EmptyState';
import { useArticles } from './hooks/useArticles';
import type { Category, TimeWindow } from './types/article.types';

export default function App() {
  // ----- Filter state (owned here so a single source of truth exists). -----
  const [window, setWindow] = useState<TimeWindow>('3m');
  const [category, setCategory] = useState<Category | null>(null);

  // ----- Data state — comes from the service-layer hook. -----
  const { data, status, error, search, lastWindow } = useArticles();

  // ----- Derived: count articles per category for the chip labels. -----
  // Memoized so a re-render from filter-state changes doesn't recompute.
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<Category, number>> = {};
    for (const article of data) {
      for (const cat of article.categories) {
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
    }
    return counts;
  }, [data]);

  // ----- Derived: the actual visible list after the category filter. -----
  const visibleArticles = useMemo(() => {
    if (category === null) return data;
    return data.filter((a) => a.categories.includes(category));
  }, [data, category]);

  // ----- Handlers -----

  /** Fires when the user clicks the Search button OR the Try-again button. */
  const handleSearch = () => {
    // Always reset the category to "All" on a fresh search — counts may
    // change with the new dataset and a previously-selected category might
    // now have zero results.
    setCategory(null);
    void search({ window });
  };

  // ----- Body composition -----
  // We pick exactly one of: initial empty / loading / error / no-results / grid.
  let body: ReactNode;
  if (status === 'idle') {
    body = <EmptyState variant="initial" />;
  } else if (status === 'loading') {
    body = <LoadingState />;
  } else if (status === 'error') {
    body = <ErrorState message={error ?? 'Unknown error.'} onRetry={handleSearch} />;
  } else if (visibleArticles.length === 0) {
    body = <EmptyState variant="no-results" onClear={() => setCategory(null)} />;
  } else {
    body = <ArticleGrid articles={visibleArticles} />;
  }

  return (
    <div className="min-h-full bg-slate-50">
      <Header />

      <ControlPanel
        window={window}
        onWindowChange={setWindow}
        category={category}
        onCategoryChange={setCategory}
        showCategories={status === 'success' && data.length > 0}
        categoryCounts={categoryCounts}
        onSearch={handleSearch}
        loading={status === 'loading'}
      />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16">
        {/* Result summary line — shown only once we have a successful fetch. */}
        {status === 'success' && data.length > 0 && (
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 text-sm text-slate-600">
            <span>
              Showing <strong className="text-slate-900">{visibleArticles.length}</strong>
              {category !== null && ' filtered'} of{' '}
              <strong className="text-slate-900">{data.length}</strong> articles
              {lastWindow && (
                <>
                  {' '}from the last{' '}
                  <strong className="text-slate-900">
                    {humanizeWindow(lastWindow)}
                  </strong>
                </>
              )}
              .
            </span>
          </div>
        )}

        {body}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-4 text-xs text-slate-500">
          <span>
            Data courtesy of{' '}
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-700 hover:text-brand-600"
            >
              NCBI PubMed E-utilities
            </a>
            .
          </span>
          <span>OrganoidBeyond — built for fast research discovery.</span>
        </div>
      </footer>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Small helper kept local — the result summary line is the only place that
// needs to humanize a TimeWindow code, so it doesn't earn a slot in `utils/`.
// -----------------------------------------------------------------------------
function humanizeWindow(w: TimeWindow): string {
  switch (w) {
    case '1m':
      return '1 month';
    case '3m':
      return '3 months';
    case '6m':
      return '6 months';
    case '1y':
      return '1 year';
    case '2y':
      return '2 years';
    default: {
      const _exhaustive: never = w;
      return String(_exhaustive);
    }
  }
}
