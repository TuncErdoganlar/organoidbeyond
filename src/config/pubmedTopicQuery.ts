// src/config/pubmedTopicQuery.ts
// -----------------------------------------------------------------------------
// AND-clauses appended to DEFAULT_QUERY when the user selects a topic before
// ESearch — so PubMed returns papers relevant to that theme, not a generic MB
// list filtered only in the UI.
//
// RELEVANCE SIGNAL (documented for the wider team):
//   1. Backend (this file): the preset topic clauses anchor on MeSH **Major
//      Topic** ([Majr]) wherever a precise MeSH term exists, plus narrower
//      [tiab] (title/abstract) terms. Major-topic filtering is what shifts a
//      result set from "happens to mention X" to "is about X" — a paper that
//      mentions stem cells in a methods aside does NOT carry a Major Topic
//      tag for "Stem Cells". This is the primary fix for off-topic hits like
//      proteomics-only papers leaking into a "stem cell" search.
//   2. Free-text (textarea) queries are tokenized and AND'd as [tiab] terms,
//      so each token must appear in the title or abstract.
//   3. Client-side: `articleAggregator.service.ts` applies a relevance score
//      (title=3, mesh=2, abstract=1) and drops articles with score 0.
//
// Fragments still keep a [tiab] fallback so very recent papers that have not
// finished MeSH indexing are not lost entirely.
// -----------------------------------------------------------------------------

import type { Category } from '@/types/article.types';

/** Maps each selectable topic (except GENERAL_MB) to a PubMed boolean subquery.
 *
 * `[Majr]` = Major MeSH Topic (paper is *primarily* about this term).
 * `[MeSH Terms]` = any MeSH heading (broader, used for the [tiab] fallback OR).
 * `[tiab]` = title or abstract literal match.
 */
export const TOPIC_PUBMED_AND_CLAUSE: Record<Exclude<Category, 'GENERAL_MB'>, string> = {
  ORGANOID:
    '("Organoids"[Majr] OR organoid[tiab] OR organoids[tiab] OR gastruloid[tiab] OR gastruloids[tiab] OR assembloid[tiab] OR assembloids[tiab])',

  STEM_CELLS:
    '("Stem Cells"[Majr] OR "Hematopoietic Stem Cells"[Majr] OR "Mesenchymal Stem Cells"[Majr] OR "Induced Pluripotent Stem Cells"[Majr] OR "Pluripotent Stem Cells"[Majr] OR "stem cell"[tiab] OR "stem cells"[tiab] OR pluripotency[tiab] OR pluripotent[tiab])',

  CANCER:
    '("Neoplasms"[Majr] OR cancer[tiab] OR cancers[tiab] OR carcinoma[tiab] OR carcinomas[tiab] OR tumour[tiab] OR tumor[tiab] OR tumours[tiab] OR tumors[tiab] OR metastasis[tiab] OR metastases[tiab] OR lymphoma[tiab] OR leukemia[tiab] OR oncology[tiab])',

  CRISPR:
    '("CRISPR-Cas Systems"[Majr] OR "Gene Editing"[Majr] OR CRISPR[tiab] OR Cas9[tiab] OR "base editing"[tiab] OR "prime editing"[tiab] OR sgRNA[tiab])',

  EPIGENETICS:
    '("Epigenesis, Genetic"[Majr] OR "Epigenomics"[Majr] OR "DNA Methylation"[Majr] OR "Chromatin"[Majr] OR "Histones"[Majr] OR epigenetic[tiab] OR epigenetics[tiab] OR "DNA methylation"[tiab] OR chromatin[tiab])',

  GENE_THERAPY:
    '("Genetic Therapy"[Majr] OR "Genetic Vectors"[Majr] OR "gene therapy"[tiab] OR "gene therapies"[tiab] OR lentivirus[tiab] OR lentiviral[tiab] OR AAV[tiab] OR "adeno-associated"[tiab] OR "viral vector"[tiab] OR "viral vectors"[tiab] OR "CAR-T"[tiab])',

  SINGLE_CELL_OMICS:
    '("Single-Cell Analysis"[Majr] OR "Single-Cell Gene Expression Analysis"[Majr] OR "single-cell"[tiab] OR "single cell RNA"[tiab] OR scRNA-seq[tiab] OR snRNA-seq[tiab] OR "spatial transcriptomics"[tiab])',

  IMMUNOLOGY:
    '("Immune System"[Majr] OR "Adaptive Immunity"[Majr] OR "Immunity, Innate"[Majr] OR "Immunotherapy"[Majr] OR immunology[tiab] OR immunotherapy[tiab] OR "immune checkpoint"[tiab] OR "T cell"[tiab] OR "T cells"[tiab] OR "B cell"[tiab] OR "B cells"[tiab])',
};

/**
 * Returns a list of plain tokens used for client-side relevance scoring for a
 * preset topic. Mirrors the spirit of the PubMed clause but stripped of MeSH
 * syntax so the categorizer-style haystack test can run.
 *
 * Kept in lockstep with `TOPIC_PUBMED_AND_CLAUSE` above — when adding terms
 * there, mirror them here so the post-fetch filter agrees with PubMed.
 */
export const TOPIC_CLIENT_TERMS: Record<Exclude<Category, 'GENERAL_MB'>, readonly string[]> = {
  ORGANOID: ['organoid', 'organoids', 'gastruloid', 'gastruloids', 'assembloid', 'assembloids'],
  STEM_CELLS: [
    'stem cell',
    'stem cells',
    'pluripotent',
    'pluripotency',
    'hematopoietic stem',
    'mesenchymal stem',
    'induced pluripotent',
    'iPSC',
  ],
  CANCER: [
    'cancer',
    'cancers',
    'carcinoma',
    'carcinomas',
    'tumour',
    'tumours',
    'tumor',
    'tumors',
    'metastasis',
    'metastases',
    'lymphoma',
    'leukemia',
    'oncology',
    'neoplasm',
    'neoplasms',
  ],
  CRISPR: [
    'crispr',
    'cas9',
    'cas12',
    'cas13',
    'gene editing',
    'base editing',
    'prime editing',
    'sgRNA',
  ],
  EPIGENETICS: [
    'epigenetic',
    'epigenetics',
    'epigenome',
    'epigenomics',
    'DNA methylation',
    'chromatin',
    'histone',
    'histones',
  ],
  GENE_THERAPY: [
    'gene therapy',
    'gene therapies',
    'lentivirus',
    'lentiviral',
    'AAV',
    'adeno-associated',
    'viral vector',
    'viral vectors',
    'CAR-T',
  ],
  SINGLE_CELL_OMICS: [
    'single-cell',
    'single cell',
    'scRNA-seq',
    'snRNA-seq',
    'transcriptomics',
    'spatial transcriptomics',
  ],
  IMMUNOLOGY: [
    'immunology',
    'immunotherapy',
    'immune checkpoint',
    'T cell',
    'T cells',
    'B cell',
    'B cells',
    'NK cell',
    'macrophage',
    'macrophages',
    'cytokine',
    'cytokines',
  ],
};

// -----------------------------------------------------------------------------
// Free-text (textarea) topic → PubMed query fragment
// -----------------------------------------------------------------------------

/**
 * Tokenize a free-text topic the way PubMed's GET layer prefers: keep
 * multi-word phrases when the user types them in quotes, otherwise split on
 * whitespace. Strips PubMed boolean operators and special characters so an
 * accidental "[" or unbalanced parenthesis can't break the request.
 *
 * Examples:
 *   "stem cell"          → ['stem cell']            (quoted phrase preserved)
 *   stem cell organoid   → ['stem', 'cell', 'organoid']
 *   "brain organoid" AAV → ['brain organoid', 'AAV']
 */
export function tokenizeFreeTextTopic(input: string): string[] {
  const cleaned = input
    // PubMed field tags would collide with our own AND clauses; strip them.
    .replace(/\[[^\]]*\]/g, ' ')
    // Drop boolean operators (we always AND tokens together).
    .replace(/\b(AND|OR|NOT)\b/gi, ' ')
    .trim();

  if (!cleaned) return [];

  const tokens: string[] = [];
  // Iterate quoted phrases first; non-quoted runs are split on whitespace.
  const re = /"([^"]+)"|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(cleaned)) !== null) {
    const tok = (match[1] ?? match[2] ?? '').trim();
    if (tok) tokens.push(tok);
  }
  return tokens;
}

/**
 * Build the AND clause that narrows ESearch by a user-typed topic. Each token
 * must appear in title or abstract (`[tiab]`) — multi-word tokens are quoted
 * so PubMed treats them as a phrase.
 */
export function composeFreeTextClause(input: string): string | null {
  const tokens = tokenizeFreeTextTopic(input);
  if (tokens.length === 0) return null;
  const clauses = tokens.map((t) => `"${t.replace(/"/g, '')}"[tiab]`);
  if (clauses.length === 1) return clauses[0] ?? null;
  return `(${clauses.join(' AND ')})`;
}

export interface ComposeQueryOptions {
  /** A preset chip topic (or null = none). Ignored when GENERAL_MB. */
  topic?: Category | null;
  /** Free-text topic from the textarea. */
  topicText?: string;
}

/**
 * Returns the full ESearch query string for the user's base query + optional
 * topic and/or free-text. Both narrow the search if both are provided.
 * `topic === null`, `topic === GENERAL_MB`, or undefined → no preset narrowing.
 * `topicText` empty/whitespace → no free-text narrowing.
 */
export function composePubMedQuery(
  baseQuery: string,
  options: ComposeQueryOptions | Category | null | undefined,
): string {
  // Back-compat: callers that used to pass `topic` directly still work.
  const opts: ComposeQueryOptions =
    options && typeof options === 'object' ? options : { topic: options ?? null };

  const clauses: string[] = [];

  const t = opts.topic ?? null;
  if (t !== null && t !== 'GENERAL_MB') {
    clauses.push(TOPIC_PUBMED_AND_CLAUSE[t]);
  }

  if (opts.topicText) {
    const free = composeFreeTextClause(opts.topicText);
    if (free) clauses.push(free);
  }

  if (clauses.length === 0) return baseQuery;
  return `(${baseQuery}) AND ${clauses.map((c) => `(${c})`).join(' AND ')}`;
}
