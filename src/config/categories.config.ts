// src/config/categories.config.ts
// -----------------------------------------------------------------------------
// CATEGORY DEFINITIONS
//
// Each category is a `{ category, patterns }` pair. The `categorizer` util
// scans `title + abstract + meshTerms` for any pattern match (case
// insensitive). We use real RegExp objects (not bare strings) so we can:
//   - enforce \b word boundaries (so "casino" doesn't match "Cas9-like-"),
//   - allow alternation (tumor|tumour),
//   - keep authors free to add more nuanced rules later (e.g., look-arounds).
//
// To add a category:
//   1. Add the literal to `Category` in `src/types/article.types.ts`.
//   2. Push a new `CategoryRule` here.
// TypeScript will then force every `switch (cat)` site to handle it.
// -----------------------------------------------------------------------------

import type { Category } from '@/types/article.types';

export interface CategoryRule {
  category: Exclude<Category, 'UNCATEGORIZED'>;
  /** A title shown in the UI (Step 2). Kept here so all category metadata
   *  lives in one place. */
  label: string;
  /** Keyword/phrase regexes. Match → tag with this category. */
  patterns: RegExp[];
}

/**
 * The `i` flag is case-insensitive; `\b` is a word boundary so partial
 * substrings don't accidentally match. Multi-word phrases use `\s+` to be
 * tolerant of double-spacing in abstracts.
 */
export const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'ORGANOID',
    label: 'Organoid',
    patterns: [
      /\borganoids?\b/i,
      /\bgastruloids?\b/i,
      /\bspheroids?\b/i,
      /\b3D\s+culture[s]?\b/i,
      /\biPSC[-\s]?derived\b/i,
      /\bbrain\s+organoid\b/i,
    ],
  },
  {
    category: 'CANCER',
    label: 'Cancer',
    patterns: [
      /\bcancer[s]?\b/i,
      /\btumou?rs?\b/i,
      /\boncolog(y|ical)\b/i,
      /\bcarcinomas?\b/i,
      /\bmetastas[ei]s\b/i,
      /\bleukem(ia|ias)\b/i,
      /\blymphomas?\b/i,
      /\bsarcomas?\b/i,
      /\bmalignan(t|cy)\b/i,
    ],
  },
  {
    category: 'CRISPR',
    label: 'CRISPR',
    patterns: [
      /\bCRISPR\b/i,
      /\bCas\s?9\b/i,
      /\bCas\s?12\w?\b/i,
      /\bCas\s?13\w?\b/i,
      /\bgene\s+editing\b/i,
      /\bbase\s+editing\b/i,
      /\bprime\s+editing\b/i,
      /\bsgRNA\b/i,
    ],
  },
  {
    category: 'EPIGENETICS',
    label: 'Epigenetics',
    patterns: [
      /\bepigenetic[s]?\b/i,
      /\bDNA\s+methylation\b/i,
      /\bhistone[s]?\b/i,
      /\bchromatin\b/i,
      /\bepigenome\b/i,
      /\bDNMT[0-9]?\b/i,
      /\bHDAC[0-9]?\b/i,
      /\bm6A\b/i,
    ],
  },
  {
    category: 'GENE_THERAPY',
    label: 'Gene Therapy',
    patterns: [
      /\bgene\s+therap(y|ies)\b/i,
      /\bAAV[0-9]?\b/i,
      /\blentivir(us|al)\b/i,
      /\bviral\s+vector[s]?\b/i,
      /\bgene\s+replacement\b/i,
      /\bex\s+vivo\s+gene\b/i,
    ],
  },
];

/** Convenience lookup for the UI's filter chip label list. */
export const CATEGORY_LABELS: Record<Category, string> = {
  ORGANOID: 'Organoid',
  CANCER: 'Cancer',
  CRISPR: 'CRISPR',
  EPIGENETICS: 'Epigenetics',
  GENE_THERAPY: 'Gene Therapy',
  UNCATEGORIZED: 'Other',
};
