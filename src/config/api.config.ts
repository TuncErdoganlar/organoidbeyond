// src/config/api.config.ts
// -----------------------------------------------------------------------------
// All PubMed E-utilities knobs in one place. If NCBI ever changes a URL, or we
// want to swap to a corporate proxy, this is the *only* file to touch.
// -----------------------------------------------------------------------------

/** Base URL for every E-utilities endpoint (documentation / deep links only). */
export const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

/**
 * Same-origin PubMed gateway. The browser talks to `/api/pubmed`; Vercel (or Vite’s
 * dev/preview middleware) forwards to `e*.ncbi.nlm.nih.gov`, avoiding blocked
 * cross-origin calls in production browsers.
 *
 * Payload is E-utilities GET params plus `op=esearch|efetch`; see `api/pubmed.ts`.
 */
export const PUBMED_PROXY_URL = '/api/pubmed';

/**
 * The default research query. Restricts results to the Mol-Bio / Genetics
 * MeSH branches and to records that actually contain an abstract — we always
 * want body text for the card snippet.
 *
 *   [MeSH]      → a MeSH-tree term, very precise.
 *   hasabstract → PubMed flag for "this record has an abstract".
 */
export const DEFAULT_QUERY =
  '("Molecular Biology"[MeSH Terms] OR "Genetics"[MeSH Terms]) AND hasabstract[text]';

/** Default page size for a single ESearch. NCBI's hard max is 10_000. */
export const DEFAULT_PAGE_SIZE = 50;

/** Axios timeout. PubMed is usually <1s but we add headroom for retries. */
export const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Rate-limit windows (ms between requests). NCBI enforces:
 *   - 3 req/sec   (no API key)   → 1000/3 ≈ 334ms
 *   - 10 req/sec  (with API key) → 100ms
 *
 * We add a small jitter buffer because the limiter on NCBI's side is strict
 * and a couple of milliseconds round-trip variance can cause a 429.
 */
export const RATE_LIMIT_MS = {
  unauthenticated: 350,
  authenticated: 110,
} as const;

/**
 * Reads the optional API key from Vite's environment. Trimmed because
 * accidental newlines in `.env.local` are a common dev paper-cut.
 */
export function getPubmedApiKey(): string | undefined {
  const raw = import.meta.env.VITE_PUBMED_API_KEY;
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

/**
 * NCBI politely asks every caller to identify itself via `tool` and `email`.
 * These are not authentication — just attribution.
 */
export function getPubmedToolIdentity(): { tool: string; email?: string } {
  return {
    tool: 'organoidbeyond',
    email: import.meta.env.VITE_PUBMED_TOOL_EMAIL?.trim() || undefined,
  };
}
