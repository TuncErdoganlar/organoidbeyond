// src/services/articleAggregator.service.ts
// -----------------------------------------------------------------------------
// THE PUBLIC FAÇADE
//
// This is the *only* service file the UI is expected to import. It composes
// the smaller building blocks into a one-call API:
//
//   const articles = await fetchArticles({ window: '3m' });
//
// Internally it:
//   1. Resolves the time window to a `{ minDate, maxDate }` range.
//   2. Calls `pubmed.service.searchPmids` to find recent PMIDs.
//   3. Calls `pubmed.service.fetchArticlesByIds` to hydrate full records.
//   4. Runs the `categorizer` over each article and stamps `categories`.
//   5. Runs a client-side date safety net (handles partial dates).
//   6. Sorts newest-first and returns.
//   Topic is applied at step 2 (ESearch query), not post-hoc.
// -----------------------------------------------------------------------------

import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_QUERY,
} from '@/config/api.config';
import { composePubMedQuery } from '@/config/pubmedTopicQuery';
import { categorize } from '@/utils/categorizer';
import {
  isWithinRange,
  resolveTimeWindow,
  toPubmedDateString,
} from '@/utils/dateFilter';
import { searchPmids, fetchArticlesByIds } from './pubmed.service';
import type { Article, FetchArticlesOptions } from '@/types/article.types';

/**
 * Public entry point. Defaults mirror the most common UI request (last 3
 * months, 50 articles, the standard Mol-Bio/Genetics MeSH query).
 *
 * Throws `PubmedError` on network / API issues; the UI is expected to
 * `try/catch` and surface a toast.
 */
export async function fetchArticles(
  options: FetchArticlesOptions = {},
): Promise<Article[]> {
  const window = options.window ?? '3m';
  const rawBase = options.query ?? DEFAULT_QUERY;
  const query = composePubMedQuery(rawBase, options.topic);
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const pageOffset = options.pageOffset ?? 0;
  const signal = options.signal;

  // 1. Resolve the user-facing time code into absolute dates.
  const range = resolveTimeWindow(window);

  // 2. ESearch — get PMIDs sorted newest-first.
  const pmids = await searchPmids({
    query,
    minDate: toPubmedDateString(range.minDate),
    maxDate: toPubmedDateString(range.maxDate),
    pageSize,
    pageOffset,
    signal,
  });

  if (pmids.length === 0) return [];

  // 3. EFetch — hydrate to full records.
  const raw = await fetchArticlesByIds(pmids, signal);

  // 4. Categorize each article and stamp the result on the record.
  const categorized: Article[] = raw.map((article) => ({
    ...article,
    categories: categorize(article),
  }));

  // 5. Client-side date safety net. PubMed's `mindate`/`maxdate` filter is
  //    accurate, but EFetch can return papers whose `PubDate` is a partial
  //    "2026" string. We re-check using our parsed `pubDate` so partial
  //    dates that we anchored heuristically also pass the range test.
  const inWindow = categorized.filter((a) => isWithinRange(a.pubDate, range));

  // 6. Newest-first sort. Falls back to PMID descending as a stable tiebreak
  //    (PubMed assigns PMIDs roughly chronologically).
  inWindow.sort((a, b) => {
    const delta = b.pubDate.getTime() - a.pubDate.getTime();
    if (delta !== 0) return delta;
    return Number(b.id) - Number(a.id);
  });

  return inWindow;
}

/**
 * Convenience wrapper for the UI's "filter chip" interaction. Pulls the
 * shared dataset once and partitions client-side. Returns an array keyed by
 * the same input order.
 *
 *   const [organoids, cancer] = await fetchArticlesByCategories(
 *     ['ORGANOID', 'CANCER'],
 *     { window: '6m' },
 *   );
 *
 * Step 2 will probably call this inside a `useMemo` selector instead, but
 * exposing it here keeps the service layer self-sufficient.
 */
export async function fetchArticlesByCategories<C extends Article['categories'][number]>(
  categories: readonly C[],
  options: FetchArticlesOptions = {},
): Promise<Article[][]> {
  const all = await fetchArticles(options);
  return categories.map((cat) => all.filter((a) => a.categories.includes(cat)));
}
