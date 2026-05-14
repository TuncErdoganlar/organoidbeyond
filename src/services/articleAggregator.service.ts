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
//   6. Runs a client-side **relevance filter + scorer** for the requested
//      topic (preset and/or free text) so off-topic hits like a proteomics
//      paper sneaking into a "stem cell" search are dropped. Signal weights:
//         title  = 3,  mesh = 2,  abstract = 1.
//      An article with zero hits across all three is filtered out.
//   7. Sorts by relevance score desc, then date desc.
//   Topic is applied at step 2 (ESearch query), not post-hoc.
// -----------------------------------------------------------------------------

import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_QUERY,
} from '@/config/api.config';
import {
  TOPIC_CLIENT_TERMS,
  composePubMedQuery,
  tokenizeFreeTextTopic,
} from '@/config/pubmedTopicQuery';
import { categorize } from '@/utils/categorizer';
import {
  isWithinRange,
  resolveTimeWindow,
  toPubmedDateString,
} from '@/utils/dateFilter';
import { searchPmids, fetchArticlesByIds } from './pubmed.service';
import type { Article, Category, FetchArticlesOptions } from '@/types/article.types';

/**
 * Public entry point. Defaults mirror the most common UI request (last 3
 * months, the standard Mol-Bio/Genetics MeSH query).
 *
 * Throws `PubmedError` on network / API issues; the UI is expected to
 * `try/catch` and surface a toast.
 */
export async function fetchArticles(
  options: FetchArticlesOptions = {},
): Promise<Article[]> {
  const window = options.window ?? '3m';
  const rawBase = options.query ?? DEFAULT_QUERY;
  const query = composePubMedQuery(rawBase, {
    topic: options.topic,
    topicText: options.topicText,
  });
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

  // 6. Client-side relevance filter + scorer. When the user narrowed the
  //    search by a preset chip or free-text topic, we require evidence in the
  //    article body that it actually concerns that topic. This catches the
  //    failure mode where a proteomics-only paper carries a stray "stem cell"
  //    mention buried in a methods aside.
  const relevanceTerms = collectRelevanceTerms(options.topic, options.topicText);
  const scored = scoreArticles(inWindow, relevanceTerms);

  // 7. Sort by relevance desc, then date desc, then PMID desc (stable tiebreak).
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const delta = b.article.pubDate.getTime() - a.article.pubDate.getTime();
    if (delta !== 0) return delta;
    return Number(b.article.id) - Number(a.article.id);
  });

  return scored.map((s) => s.article);
}

// -----------------------------------------------------------------------------
// Relevance scoring helpers
// -----------------------------------------------------------------------------

interface ScoredArticle {
  article: Article;
  score: number;
}

/**
 * Gathers the plain-text terms used to score relevance against the article
 * body. Preset chips contribute their `TOPIC_CLIENT_TERMS`; free text
 * contributes its tokens directly. Returns an empty array when no narrowing
 * is in effect — in that case every article passes the filter.
 */
function collectRelevanceTerms(
  topic: Category | null | undefined,
  topicText: string | undefined,
): string[] {
  const terms: string[] = [];
  const t = topic ?? null;
  if (t !== null && t !== 'GENERAL_MB') {
    terms.push(...TOPIC_CLIENT_TERMS[t]);
  }
  if (topicText) {
    terms.push(...tokenizeFreeTextTopic(topicText));
  }
  // De-dupe case-insensitively to avoid double-scoring overlapping terms.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const term of terms) {
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(term);
  }
  return out;
}

/**
 * Score each article and drop ones with score 0 (when terms are provided).
 *
 * Signal weights:
 *   - Title hit:    3 (a topic in the title is the strongest possible signal)
 *   - MeSH hit:     2 (indexers chose this MeSH heading explicitly)
 *   - Abstract hit: 1 (a passing mention is weaker but still on-topic)
 *
 * Multi-word terms ("stem cell") are matched as a substring; single-word
 * terms use a word-boundary regex so "cas" doesn't match "case".
 */
function scoreArticles(articles: Article[], terms: string[]): ScoredArticle[] {
  // No narrowing → no filter; preserve insertion order with a neutral score.
  if (terms.length === 0) {
    return articles.map((a) => ({ article: a, score: 0 }));
  }

  const matchers = terms.map(buildTermMatcher);

  const out: ScoredArticle[] = [];
  for (const article of articles) {
    const title = article.title.toLowerCase();
    const abstract = article.abstract.toLowerCase();
    const mesh = article.meshTerms.join(' ').toLowerCase();

    let score = 0;
    for (const match of matchers) {
      if (match(title)) score += 3;
      if (match(mesh)) score += 2;
      if (match(abstract)) score += 1;
    }
    if (score > 0) out.push({ article, score });
  }
  return out;
}

/** Returns a predicate that case-insensitively tests for `term` in haystack
 *  (which the caller has already lower-cased). Word-boundary aware. */
function buildTermMatcher(term: string): (haystackLower: string) => boolean {
  const needle = term.toLowerCase();
  // Multi-word phrase → cheap substring check (already inside word boundaries).
  if (/\s/.test(needle)) {
    return (h) => h.includes(needle);
  }
  // Single token → escape regex meta chars and add \b boundaries.
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`, 'i');
  return (h) => re.test(h);
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
 */
export async function fetchArticlesByCategories<C extends Article['categories'][number]>(
  categories: readonly C[],
  options: FetchArticlesOptions = {},
): Promise<Article[][]> {
  const all = await fetchArticles(options);
  return categories.map((cat) => all.filter((a) => a.categories.includes(cat)));
}
