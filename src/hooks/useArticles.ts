// src/hooks/useArticles.ts
// -----------------------------------------------------------------------------
// useArticles — a small React hook that wraps the `fetchArticles` service in
// idiomatic state. The hook deliberately does NOT auto-fetch on mount; instead
// it exposes a `search()` function the Dashboard calls when the user clicks
// the Search button. This matches the "wait for user to click Search" UX
// preference and keeps PubMed traffic low.
//
// Public surface:
//   const { data, status, error, search, reset, lastSearchTopic } = useArticles();
//   search({ window: '3m', topic: 'ORGANOID' });
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
import type {
  Article,
  Category,
  FetchArticlesOptions,
  TimeWindow,
} from '@/types/article.types';

/** The status state machine kept tiny on purpose. */
export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseArticlesReturn {
  /** Articles returned by the last successful fetch. Empty until first search. */
  data: Article[];
  /** Current status of the most recent search. */
  status: FetchStatus;
  /** Human-readable error message if `status === 'error'`. */
  error: string | null;
  /** The time window the most recent search used (for UI display). */
  lastWindow: TimeWindow | null;
  /** Topic facet used in the last successful ESearch (`null` = All / not narrowed). */
  lastSearchTopic: Category | null;
  /** Fire a new search. Cancels any in-flight request first. */
  search: (options: { window: TimeWindow } & Omit<FetchArticlesOptions, 'window' | 'signal'>) => Promise<void>;
  /** Clear results back to the empty/idle state. */
  reset: () => void;
}

export function useArticles(): UseArticlesReturn {
  const [data, setData] = useState<Article[]>([]);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastWindow, setLastWindow] = useState<TimeWindow | null>(null);
  const [lastSearchTopic, setLastSearchTopic] = useState<Category | null>(null);

  const inFlightRef = useRef<AbortController | null>(null);

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

    try {
      const articles = await fetchArticles({
        ...options,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      const t = options.topic ?? null;
      setLastSearchTopic(t !== null && t !== 'GENERAL_MB' ? t : null);
      setData(articles);
      setStatus('success');
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

  const reset = useCallback(() => {
    inFlightRef.current?.abort();
    inFlightRef.current = null;
    setData([]);
    setStatus('idle');
    setError(null);
    setLastWindow(null);
    setLastSearchTopic(null);
  }, []);

  return { data, status, error, lastWindow, lastSearchTopic, search, reset };
}
