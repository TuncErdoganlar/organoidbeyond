// src/components/ArticleCard.tsx
// -----------------------------------------------------------------------------
// A single research-paper card. Stateless and memoizable.
// -----------------------------------------------------------------------------

import { format } from 'date-fns';
import { ExternalLink, Calendar, BookOpen } from 'lucide-react';
import { CATEGORY_LABELS } from '@/config/categories.config';
import { joinAuthors } from '@/utils/textUtils';
import type { Article, Category } from '@/types/article.types';

/** Light and dark badge classes per category. The dark variant lifts the
 *  text/background opacity so labels stay legible on the slate-900 card. */
const CATEGORY_BADGE: Record<Category, string> = {
  ORGANOID:
    'bg-category-organoid/10 text-category-organoid dark:bg-category-organoid/20 dark:text-teal-300',
  STEM_CELLS:
    'bg-category-stemcell/10 text-category-stemcell dark:bg-category-stemcell/20 dark:text-emerald-300',
  CANCER:
    'bg-category-cancer/10 text-category-cancer dark:bg-category-cancer/20 dark:text-red-300',
  CRISPR:
    'bg-category-crispr/10 text-category-crispr dark:bg-category-crispr/20 dark:text-violet-300',
  EPIGENETICS:
    'bg-category-epigenetics/10 text-category-epigenetics dark:bg-category-epigenetics/20 dark:text-yellow-300',
  GENE_THERAPY:
    'bg-category-gene/10 text-category-gene dark:bg-category-gene/20 dark:text-sky-300',
  SINGLE_CELL_OMICS:
    'bg-category-omics/10 text-category-omics dark:bg-category-omics/20 dark:text-orange-300',
  IMMUNOLOGY:
    'bg-category-immunology/10 text-category-immunology dark:bg-category-immunology/20 dark:text-amber-300',
  GENERAL_MB:
    'bg-category-general/10 text-category-general dark:bg-category-general/30 dark:text-slate-300',
};

export interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const dateLooksValid = article.pubDate.getTime() > 0;
  const formattedDate = dateLooksValid
    ? format(article.pubDate, 'MMM d, yyyy')
    : article.pubDateRaw || 'Date unknown';

  return (
    <article className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      {/* Category badges (top row). */}
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

      {/* Title — links straight to PubMed. */}
      <h3 className="text-base font-semibold leading-snug text-slate-900 dark:text-slate-50">
        <a
          href={article.pubmedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring rounded-sm transition-colors hover:text-brand-600 dark:hover:text-brand-400"
        >
          {article.title}
        </a>
      </h3>

      {article.authors.length > 0 && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {joinAuthors(article.authors, 4)}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
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

      {article.abstractSnippet && (
        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {article.abstractSnippet}
        </p>
      )}

      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
        <a
          href={article.pubmedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-200"
        >
          View on PubMed
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
