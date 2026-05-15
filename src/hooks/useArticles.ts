// src/hooks/useArticles.ts
// -----------------------------------------------------------------------------
// useArticles — a small React hook that wraps the `fetchArticles` service in
// idiomatic state. The hook deliberately does NOT auto-fetch on mount; instead
// it exposes a `search()` function the Dashboard calls when the user clicks
// the Search button. This matches the "wait for user to click Search" UX
// preference and keeps PubMed traffic low.
//
// Public surface:
//   const { data, status, error, search, loadMore, reset, lastSearchTopic } = useArticles();
//   search({ window: '3m', topic: 'ORGANOID', topicText: 'brain organoid' });
//
//   status ∈ 'idle' | 'loading' | 'success' | 'error'
//
// Why not React Query / SWR?
//   - One screen, one fetch. The full power of a cache layer would be
//     dead weight; useState + AbortController covers our needs.
//   - Adding a dep increases bundle size and the audit surface for no win.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchArticles } from '@/services/articleAggregator.service';
import { DEFAULT_PAGE_SIZE, LOAD_MORE_PAGE_SIZE } from '@/config/api.config';
import type {
  Article,
  Category,
  FetchArticlesOptions,
  TimeWindow,
} from '@/types/article.types';

/** The status state machine kept tiny on purpose. */
export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

/** Options for `search()`. Equivalent to FetchArticlesOptions sans signal and
 *  with `window` required because the UI always knows it. */
export type SearchOptions = { window: TimeWindow } & Omit<
  FetchArticlesOptions,
  'window' | 'signal' | 'pageOffset' | 'pageSize'
>;

export interface UseArticlesReturn {
  /** Articles returned by the most recent search (plus any loaded pages). */
  data: Article[];
  /** Current status of the most recent search. */
  status: FetchStatus;
  /** Human-readable error message if `status === 'error'`. */
  error: string | null;
  /** The time window the most recent search used (for UI display). */
  lastWindow: TimeWindow | null;
  /** Topic facet used in the last successful ESearch (`null` = All / not narrowed). */
  lastSearchTopic: Category | null;
  /** Wall-clock moment the most recent successful search completed. Null when
   *  no search has succeeded yet. UI uses this to show "fetched at ..." so
   *  users can see results are live, not stale. */
  lastFetchedAt: Date | null;
  /** True while a "Load more" request is in flight (distinct from initial loading). */
  loadingMore: boolean;
  /**
   * True when the last `searchPmids` page returned a full batch — meaning
   * there may be more results to fetch. False when we hit the end or have
   * never searched.
   */
  canLoadMore: boolean;
  /** Fire a new search. Cancels any in-flight request first. */
  search: (options: SearchOptions) => Promise<void>;
  /** Fetch the next page using the parameters of the most recent search. */
  loadMore: () => Promise<void>;
  /** Clear results back to the empty/idle state. */
  reset: () => void;
}

export function useArticles(): UseArticlesReturn {
  const [data, setData] = useState<Article[]>([]);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastWindow, setLastWindow] = useState<TimeWindow | null>(null);
  const [lastSearchTopic, setLastSearchTopic] = useState<Category | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(false);

  const inFlightRef = useRef<AbortController | null>(null);
  /** Snapshot of the most recent search params, used when "Load more" fires. */
  const lastQueryRef = useRef<SearchOptions | null>(null);
  /** Cumulative number of PMIDs requested so far for the current query. */
  const pageOffsetRef = useRef(0);
  /** PMIDs already returned across pages — de-dupes if PubMed shifts ranking
   *  between pages, which can happen with `sort=pub_date` when new papers land
   *  between calls. */
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      inFlightRef.current?.abort();
    };
  }, []);

  const search = useCallback<UseArticlesReturn['search']>(async (options) => {
    inFlightRef.current?.abort();
    const controller = new AbortController();
    inFlightRef.current = controller;

    setStatus('loading');
    setError(null);
    setLastWindow(options.window);
    setCanLoadMore(false);
    lastQueryRef.current = options;
    pageOffsetRef.current = 0;
    seenIdsRef.current = new Set();

    try {
      const articles = await fetchArticles({
        ...options,
        pageSize: DEFAULT_PAGE_SIZE,
        pageOffset: 0,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      const t = options.topic ?? null;
      setLastSearchTopic(t !== null && t !== 'GENERAL_MB' ? t : null);
      for (const a of articles) seenIdsRef.current.add(a.id);
      setData(articles);
      setLastFetchedAt(new Date());
      setStatus('success');

      // We can offer "Load more" whenever the upstream returned a full page —
      // a smaller page means we've reached the end. We compare against the
      // PMID page size, not the post-filter article count, because relevance
      // filtering can shrink the visible count below the page size.
      pageOffsetRef.current = DEFAULT_PAGE_SIZE;
      setCanLoadMore(articles.length > 0);
    } catch (err) {
      if (controller.signal.aborted) return;

      const message =
        err instanceof Error ? err.message : 'Unknown error fetching articles.';
      setError(message);
      setStatus('error');
    } finally {
      if (inFlightRef.current === controller) {
        inFlightRef.current = null;
      }
    }
  }, []);

  const loadMore = useCallback<UseArticlesReturn['loadMore']>(async () => {
    const prev = lastQueryRef.current;
    if (!prev || loadingMore) return;

    inFlightRef.current?.abort();
    const controller = new AbortController();
    inFlightRef.current = controller;
    setLoadingMore(true);

    try {
      const next = await fetchArticles({
        ...prev,
        pageSize: LOAD_MORE_PAGE_SIZE,
        pageOffset: pageOffsetRef.current,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      // De-dupe against IDs already in the rendered list.
      const fresh: Article[] = [];
      for (const a of next) {
        if (!seenIdsRef.current.has(a.id)) {
          seenIdsRef.current.add(a.id);
          fresh.push(a);
        }
      }

      setData((current) => [...current, ...fresh]);
      setLastFetchedAt(new Date());
      pageOffsetRef.current += LOAD_MORE_PAGE_SIZE;

      // If PubMed returned an empty page (or every PMID was already shown),
      // we've reached the end. We use `next.length` (post-filter article
      // count) as a proxy: 0 fresh results almost always means no more pages.
      if (next.length === 0) setCanLoadMore(false);
    } catch (err) {
      if (controller.signal.aborted) return;
      const message =
        err instanceof Error ? err.message : 'Unknown error loading more articles.';
      setError(message);
      // Keep status='success' so existing results stay visible; surface the
      // load-more failure through `error` instead of a full error state.
    } finally {
      if (inFlightRef.current === controller) {
        inFlightRef.current = null;
      }
      setLoadingMore(false);
    }
  }, [loadingMore]);

  const reset = useCallback(() => {
    inFlightRef.current?.abort();
    inFlightRef.current = null;
    lastQueryRef.current = null;
    pageOffsetRef.current = 0;
    seenIdsRef.current = new Set();
    setData([]);
    setStatus('idle');
    setError(null);
    setLastWindow(null);
    setLastSearchTopic(null);
    setLastFetchedAt(null);
    setLoadingMore(false);
    setCanLoadMore(false);
  }, []);

  return {
    data,
    status,
    error,
    lastWindow,
    lastSearchTopic,
    lastFetchedAt,
    loadingMore,
    canLoadMore,
    search,
    loadMore,
    reset,
  };
}
