// src/components/ControlPanel.tsx
// -----------------------------------------------------------------------------
// Search controls — designed as a guided 3-step flow:
//   1. Topic         — user types a free-text topic into the textarea AND/OR
//                      picks a preset chip. Either source can drive the
//                      PubMed narrowing on its own.
//   2. Time range    — revealed only after a topic is set (typed or chipped),
//                      keeping the flow linear so the user can't reach a
//                      time pill before there's a topic to filter.
//   3. Search button — revealed alongside Step 2.
//
// The parent owns all state; this component is purely controlled.
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

  /** Free-text topic from the textarea. */
  topicText: string;
  onTopicTextChange: (next: string) => void;

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

  /**
   * The "topic is set" gate that reveals Step 2 + 3. Selecting a chip
   * (including "All") still counts as a confirmed topic, because we want
   * users who explicitly want the All view to be able to time-filter too.
   * The flow we're trying to enforce is "topic first" — once the user has
   * thought about topic at all, we let them pick a window.
   */
  const topicConfirmed =
    props.topicText.trim().length > 0 || props.category !== null;

  /** Submit free-text search on Cmd/Ctrl+Enter — common UX in research tools. */
  const onTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !props.loading) {
      e.preventDefault();
      props.onSearch();
    }
  };

  return (
    <section
      aria-label="Search controls"
      className="mx-auto w-full max-w-6xl px-6 py-6"
    >
      {/* Step 1 — Topic narrows PubMed. Free text and preset chips both feed in. */}
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          1. Topic
        </h2>

        <label htmlFor="topic-text" className="sr-only">
          Topic to search PubMed for
        </label>
        <textarea
          id="topic-text"
          value={props.topicText}
          onChange={(e) => props.onTopicTextChange(e.target.value)}
          onKeyDown={onTextareaKeyDown}
          disabled={props.loading}
          rows={2}
          placeholder='Type a topic — e.g. "brain organoid", CRISPR base editing, hematopoietic stem cells'
          className="focus-ring w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-card disabled:cursor-not-allowed disabled:opacity-60"
          aria-describedby="topic-text-help"
        />
        <p id="topic-text-help" className="mt-1 text-xs text-slate-500">
          Press <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono text-[10px]">Ctrl/⌘ + Enter</kbd> to search. Wrap a phrase in
          quotes (e.g. <span className="font-mono">"stem cell"</span>) to match it as a phrase.
        </p>

        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            …or pick a preset
          </p>
          <CategoryFilter
            value={props.category}
            onChange={props.onCategoryChange}
            counts={counts}
            disabled={props.loading}
          />
        </div>
      </div>

      {/* Steps 2 + 3 — Time window then search. Only revealed after a topic
          decision has been made, so the flow stays linear: topic → time → go. */}
      {topicConfirmed && (
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
      )}
    </section>
  );
}
