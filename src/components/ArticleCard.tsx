// src/components/ArticleCard.tsx
// -----------------------------------------------------------------------------
// A single research-paper card. Stateless and memoizable: given the same
// `Article` prop, it renders the same DOM, so React.memo would be a one-line
// add if profiling shows the long list re-renders.
// -----------------------------------------------------------------------------

import { format } from 'date-fns';
import { ExternalLink, Calendar, BookOpen } from 'lucide-react';
import { CATEGORY_LABELS } from '@/config/categories.config';
import { joinAuthors } from '@/utils/textUtils';
import type { Article, Category } from '@/types/article.types';

/** Same color tokens as the filter chips so a card "feels" the same as its
 *  matching chip. Kept in this file because both rely on the Tailwind tokens
 *  in `tailwind.config.js`. */
const CATEGORY_BADGE: Record<Category, string> = {
  ORGANOID: 'bg-category-organoid/10 text-category-organoid',
  CANCER: 'bg-category-cancer/10 text-category-cancer',
  CRISPR: 'bg-category-crispr/10 text-category-crispr',
  EPIGENETICS: 'bg-category-epigenetics/10 text-category-epigenetics',
  GENE_THERAPY: 'bg-category-gene/10 text-category-gene',
  UNCATEGORIZED: 'bg-slate-100 text-slate-600',
};

export interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  // Format the date defensively: parsePubmedDate falls back to epoch on
  // unparseable input, so we hide the date if it's clearly invalid.
  const dateLooksValid = article.pubDate.getTime() > 0;
  const formattedDate = dateLooksValid
    ? format(article.pubDate, 'MMM d, yyyy')
    : article.pubDateRaw || 'Date unknown';

  return (
    <article className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
      {/* Category badges (top row). One paper can land in multiple buckets. */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {article.categories.map((cat) => (
          <span
            key={cat}
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_BADGE[cat]}`}
          >
            {CATEGORY_LABELS[cat]}
          </span>
        ))}
      </div>

      {/* Title — links straight to PubMed in a new tab so the user doesn't
          lose their place in the dashboard. */}
      <h3 className="text-base font-semibold leading-snug text-slate-900">
        <a
          href={article.pubmedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring rounded-sm transition-colors hover:text-brand-600"
        >
          {article.title}
        </a>
      </h3>

      {/* Author line. `joinAuthors` collapses long lists into "+N more". */}
      {article.authors.length > 0 && (
        <p className="mt-2 text-sm text-slate-600">
          {joinAuthors(article.authors, 4)}
        </p>
      )}

      {/* Journal + date meta row. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {article.journal && (
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="line-clamp-1">{article.journal}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          {formattedDate}
        </span>
      </div>

      {/* Abstract snippet. `flex-1` pushes the footer link to the bottom of
          the card so a grid of cards has visually aligned footers. */}
      {article.abstractSnippet && (
        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">
          {article.abstractSnippet}
        </p>
      )}

      {/* Footer link — explicit affordance for "open paper on PubMed". */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <a
          href={article.pubmedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          View on PubMed
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
