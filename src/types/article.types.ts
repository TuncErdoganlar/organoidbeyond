// src/types/article.types.ts
// -----------------------------------------------------------------------------
// DOMAIN TYPES
//
// This file is the *single contract* between the service layer and the UI.
// The UI never imports anything from PubMed-flavored modules directly — it
// only consumes these normalized types. That way, if we ever swap PubMed for
// CrossRef (or add a second source), nothing in the React tree has to change.
// -----------------------------------------------------------------------------

/**
 * Topical buckets the UI surfaces as filter chips. Add a new category by
 * (a) appending it here AND (b) adding a keyword set to
 * `src/config/categories.config.ts`. The TypeScript compiler will then force
 * every consumer to handle the new value, which is exactly what we want.
 */
export type Category =
  | 'ORGANOID'
  | 'CANCER'
  | 'CRISPR'
  | 'EPIGENETICS'
  | 'GENE_THERAPY'
  | 'UNCATEGORIZED';

/**
 * The time-range filter exposed to the user. The string codes are kept
 * deliberately short because they end up in URLs, query keys, and analytics.
 *   1m  → last 1 month
 *   3m  → last 3 months
 *   6m  → last 6 months
 *   1y  → last 1 year
 *   2y  → last 2 years
 */
export type TimeWindow = '1m' | '3m' | '6m' | '1y' | '2y';

/**
 * The normalized article shape the UI consumes. Every field that can be
 * absent from a PubMed record is optional here so the React layer can render
 * gracefully without null-guards everywhere.
 */
export interface Article {
  /** PubMed unique ID (PMID). Doubles as the React `key` in lists. */
  id: string;

  /** Paper title, plain text (XML formatting stripped). */
  title: string;

  /**
   * Author list in display order. Each entry is "Last FM" (PubMed-style).
   * Empty array if the record had no author block.
   */
  authors: string[];

  /** Journal / source title, e.g., "Nature Cell Biology". */
  journal?: string;

  /** Best-effort `Date` for sorting; see `pubDateRaw` for the display string. */
  pubDate: Date;

  /** Original publication date string from PubMed (may be partial). */
  pubDateRaw: string;

  /** Full abstract, plain text. May be empty if PubMed returned no abstract. */
  abstract: string;

  /** A trimmed, UI-friendly snippet (~280 chars by default). */
  abstractSnippet: string;

  /** Digital Object Identifier, if PubMed has one. */
  doi?: string;

  /** Direct link to the paper on PubMed. Always present. */
  pubmedUrl: string;

  /**
   * Categories this article matched, sorted by match-strength descending.
   * Always contains at least one element (falls back to 'UNCATEGORIZED').
   */
  categories: Category[];

  /** MeSH terms PubMed assigned. Useful for category debugging in dev. */
  meshTerms: string[];
}

// -----------------------------------------------------------------------------
// REQUEST / RESPONSE DTOs
//
// These are the *external* shapes returned by the NCBI E-utilities endpoints.
// They live in this file only so the type layer is the one place that knows
// about both worlds — every other module imports from here.
// -----------------------------------------------------------------------------

/** Parameters accepted by the public aggregator façade. */
export interface FetchArticlesOptions {
  /** Time window the user selected; defaults to '3m' in the service. */
  window?: TimeWindow;
  /** Override the default Mol-Bio/Genetics query if needed. */
  query?: string;
  /** Max articles to return. PubMed caps a single ESearch at 10_000. */
  pageSize?: number;
  /** Pagination offset for ESearch (retstart). */
  pageOffset?: number;
  /** Abort signal so the UI can cancel a request when filters change. */
  signal?: AbortSignal;
}

/** Shape of ESearch's JSON response (only the fields we use). */
export interface ESearchResponse {
  esearchresult: {
    count: string;
    retmax: string;
    retstart: string;
    idlist: string[];
    /** Present when NCBI throttles us. */
    errorlist?: { phrasesnotfound?: string[]; fieldsnotfound?: string[] };
    warninglist?: { phrasesignored?: string[]; outputmessages?: string[] };
  };
}

/**
 * Custom error class so the UI can `instanceof PubmedError` to distinguish
 * "network / API problems" from generic JS errors.
 */
export class PubmedError extends Error {
  public readonly status?: number;
  public readonly cause?: unknown;

  constructor(message: string, opts: { status?: number; cause?: unknown } = {}) {
    super(message);
    this.name = 'PubmedError';
    this.status = opts.status;
    this.cause = opts.cause;
  }
}
