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
// `GENERAL_MB` exists only as a programmatic fallback in `categorizer.ts`; it is
// not assigned via rules here because broad patterns would overwhelm specific
// topic scores.
//
// To add a category:
//   1. Add the literal to `Category` in `src/types/article.types.ts`.
//   2. Push a `CategoryRule` here and append it to `TOPIC_CHIP_ORDER`.
// TypeScript will then force every consumer to handle the new value.
// -----------------------------------------------------------------------------

import type { Category } from '@/types/article.types';

export interface CategoryRule {
  category: Exclude<Category, 'GENERAL_MB'>;
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
      /\bassembloids?\b/i,
      /\bspheroids?\b/i,
      /\b3D\s+culture[s]?\b/i,
      /\bepithelial\s+layers?\b/i,
      /\biPSC[-\s]?derived\b/i,
      /\bbrain\s+organoid\b/i,
      /\bendoderm\b/i,
    ],
  },
  {
    category: 'STEM_CELLS',
    label: 'Stem cells',
    patterns: [
      /\bstem\s+cells?\b/i,
      /\bpluripotenc(y|ies|t)\b/i,
      /\bhematopoietic\s+stem\b/i,
      /\bmesenchymal\s+stem\b/i,
      /\bprogenitors?\b/i,
      /\bself[-\s]?renewal\b/i,
      /\bregenerativ(e|ely)\s+medicine\b/i,
      /\bhematopoiesis\b/i,
    ],
  },
  {
    category: 'CANCER',
    label: 'Cancer',
    patterns: [
      /\bcancer[s]?\b/i,
      /\btumou?rs?\b/i,
      /\boncogen(e|esis|ic)s?\b/i,
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
      /\bcrispr\b/i,
      /\bcas\s?9\b/i,
      /\bcas\s?12\w?\b/i,
      /\bcas\s?13\w?\b/i,
      /\bgene\s+editing\b/i,
      /\bbase\s+editing\b/i,
      /\bprime\s+editing\b/i,
      /\bsgrna\b/i,
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
      /\bm6a\b/i,
      /\batac[-\s]?seq\b/i,
    ],
  },
  {
    category: 'GENE_THERAPY',
    label: 'Gene therapy',
    patterns: [
      /\bgene\s+therap(y|ies)\b/i,
      /\bAAVs?\d?\b/i,
      /\blentivir(us|al)\b/i,
      /\bviral\s+vector[s]?\b/i,
      /\bgene\s+replacement\b/i,
      /\bex\s+vivo\s+gene\b/i,
      /\bcd19\s+cart\b/i,
      /\bCAR[-\s]?T\b/i,
    ],
  },
  {
    category: 'SINGLE_CELL_OMICS',
    label: 'Single-cell & omics',
    patterns: [
      /\bsingle[-\s]cell\b/i,
      /\bscrna[-\s]?seq\b/i,
      /\bu?mi[-\s]?seq\b/i,
      /\btranscriptom(e|ics)\b/i,
      /\bproteomics?\b/i,
      /\bmulti[-\s]?omics\b/i,
      /\bspatial\s+(transcript|omics)\b/i,
      /\bgenome[-\s]wide\b/i,
    ],
  },
  {
    category: 'IMMUNOLOGY',
    label: 'Immunology',
    patterns: [
      /\bimmune\s+(response|cell|checkpoint|therapy)\b/i,
      /\bimmu(?:no)?therapy\b/i,
      /\bimmu(?:no)?globulin\b/i,
      /\bimmu(?:no)?logy\b/i,
      /\bT\s+cells?\b/i,
      /\bB\s+cells?\b/i,
      /\bNK\s+cells?\b/i,
      /\bmacrophages?\b/i,
      /\binterleukins?\b/i,
      /\bcytokine[s]?\b/i,
      /\bantibody\b/i,
      /\bcheckpoint\s+inhibit/i,
      /\bvaccines?\b/i,
    ],
  },
];

/** Display order for filter chips — keep in sync with new rules. */
export const TOPIC_CHIP_ORDER: Category[] = [
  'ORGANOID',
  'STEM_CELLS',
  'CANCER',
  'CRISPR',
  'EPIGENETICS',
  'GENE_THERAPY',
  'SINGLE_CELL_OMICS',
  'IMMUNOLOGY',
  'GENERAL_MB',
];

/** Convenience lookup for the UI's filter chip label list. */
export const CATEGORY_LABELS: Record<Category, string> = {
  ORGANOID: 'Organoid',
  STEM_CELLS: 'Stem cells',
  CANCER: 'Cancer',
  CRISPR: 'CRISPR',
  EPIGENETICS: 'Epigenetics',
  GENE_THERAPY: 'Gene therapy',
  SINGLE_CELL_OMICS: 'Single-cell & omics',
  IMMUNOLOGY: 'Immunology',
  GENERAL_MB: 'Molecular biology',
};
