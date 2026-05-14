// src/components/ArticleGrid.tsx
// -----------------------------------------------------------------------------
// Responsive grid wrapper for ArticleCards.
//   - 1 column on mobile.
//   - 2 columns on `md` (>=768px).
//   - 3 columns on `xl` (>=1280px).
//
// Equal-height rows are achieved by `items-stretch` + `h-full` on the card,
// so abstract length doesn't break the grid alignment.
// -----------------------------------------------------------------------------

import { ArticleCard } from './ArticleCard';
import type { Article } from '@/types/article.types';

export interface ArticleGridProps {
  articles: Article[];
}

export function ArticleGrid({ articles }: ArticleGridProps) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
      {articles.map((a) => (
        <ArticleCard key={a.id} article={a} />
      ))}
    </div>
  );
}
