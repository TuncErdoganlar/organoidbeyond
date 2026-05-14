// src/utils/categorizer.ts
// -----------------------------------------------------------------------------
// The keyword-matching engine that tags an `Article` with one or more
// `Category` values. Pure function — no I/O, no state — so the React layer
// can call it freely inside `useMemo`.
//
// Matching is **multi-label**: a paper combining CRISPR with brain organoids
// will be tagged with BOTH `CRISPR` and `ORGANOID`. The UI can then choose to
// pivot on a single category, but the underlying data is honest about which
// buckets each paper actually belongs to.
// -----------------------------------------------------------------------------

import { CATEGORY_RULES } from '@/config/categories.config';
import type { Article, Category } from '@/types/article.types';

/**
 * The text we scan for each article. We deliberately combine multiple fields
 * because some papers mention organoids only in the MeSH terms, others only
 * in the abstract, etc. Lowercasing once up front is faster than relying on
 * the `i` flag for every regex test on long abstracts.
 */
function haystackFor(article: Pick<Article, 'title' | 'abstract' | 'meshTerms'>): string {
  return [article.title, article.abstract, article.meshTerms.join(' ')]
    .join(' \n ')
    .toLowerCase();
}

/**
 * Returns the categories that match `article`. The result is sorted by the
 * number of distinct keyword hits descending (so the "strongest" category
 * shows first in the UI), and always non-empty — the fallback is
 * `['UNCATEGORIZED']`.
 *
 * Note we still test the original-case patterns against the lowercased
 * haystack: the regexes in `CATEGORY_RULES` already use the `i` flag, so
 * the lowercasing above is purely a performance optimization for repeated
 * scans.
 */
export function categorize(
  article: Pick<Article, 'title' | 'abstract' | 'meshTerms'>,
): Category[] {
  const haystack = haystackFor(article);

  // Score each category by the number of distinct patterns that match.
  const scored: Array<{ category: Category; score: number }> = [];

  for (const rule of CATEGORY_RULES) {
    let score = 0;
    for (const pattern of rule.patterns) {
      // `pattern.test(...)` is faster than `.match(...)` when we only need a
      // boolean. We count distinct *patterns* that hit, not raw occurrences,
      // so a paper that uses "CRISPR" 20 times doesn't drown a paper with
      // CRISPR + Cas9 + gene editing.
      if (pattern.test(haystack)) score += 1;
    }
    if (score > 0) scored.push({ category: rule.category, score });
  }

  if (scored.length === 0) return ['UNCATEGORIZED'];

  // Stable descending sort by score so "stronger" categories surface first.
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.category);
}
