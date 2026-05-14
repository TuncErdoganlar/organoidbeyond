// -----------------------------------------------------------------------------
// Shared E-utilities URL builder for `/api/pubmed` (Vercel + Vite dev/preview).
// Lives under `api/` so Vercel bundles it with `pubmed.ts` (no `../` to repo root).
// SSRF-safe: only op=esearch|efetch maps to fixed NCBI URLs.
// -----------------------------------------------------------------------------
import type { ParsedUrlQuery } from 'node:querystring';

const PUBMED_TARGETS = {
  esearch: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
  efetch: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi',
} as const;

export type ResolvePubmedUpstreamResult =
  | { ok: true; url: string }
  | { ok: false; status: number; body: string };

/**
 * Vercel's Node `req.url` is often **path-only** (`/api/pubmed`) with no `?…`;
 * query args live in `req.query`. Connect/Vite usually exposes the full path
 * + query on `req.url`. This helper merges both so `op`, `term`, etc. are never
 * dropped in production.
 */
export function searchParamsFromNodeRequest(
  url: string | undefined,
  query: ParsedUrlQuery | undefined,
): URLSearchParams {
  if (query && typeof query === 'object' && Object.keys(query).length > 0) {
    const sp = new URLSearchParams();
    for (const [key, val] of Object.entries(query)) {
      if (val === undefined) continue;
      for (const item of Array.isArray(val) ? val : [val]) {
        if (item !== undefined && item !== null) sp.append(key, String(item));
      }
    }
    return sp;
  }
  const raw = url ?? '';
  const q = raw.indexOf('?');
  return q === -1 ? new URLSearchParams() : new URLSearchParams(raw.slice(q + 1));
}

/** Timeout signal compatible with Node runtimes that lack `AbortSignal.timeout`. */
export function createTimeoutSignal(ms: number): AbortSignal {
  const AS = AbortSignal as typeof AbortSignal & { timeout?: (n: number) => AbortSignal };
  if (typeof AS.timeout === 'function') return AS.timeout(ms);
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

/**
 * NCBI supports POST for long requests. Some hosts also cap GET URL length;
 * POST avoids 5xx from intermediaries when the query is huge.
 */
export async function proxyFetchPubmed(fullUrl: string, signal: AbortSignal): Promise<Response> {
  const accept = { Accept: 'application/json, text/xml, text/plain, */*' };
  if (fullUrl.length <= 8192) {
    return fetch(fullUrl, { method: 'GET', headers: accept, signal });
  }
  const qi = fullUrl.indexOf('?');
  if (qi === -1) {
    return fetch(fullUrl, { method: 'GET', headers: accept, signal });
  }
  const base = fullUrl.slice(0, qi);
  const body = fullUrl.slice(qi + 1);
  return fetch(base, {
    method: 'POST',
    headers: {
      ...accept,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body,
    signal,
  });
}

export function resolvePubmedUpstreamUrl(
  searchParams: URLSearchParams,
  opts: { serverApiKey?: string } = {},
): ResolvePubmedUpstreamResult {
  const op = searchParams.get('op');
  if (op !== 'esearch' && op !== 'efetch') {
    return {
      ok: false,
      status: 400,
      body: JSON.stringify({
        error: 'Missing or invalid "op"; use esearch or efetch.',
      }),
    };
  }

  const base = PUBMED_TARGETS[op];

  const forward = new URLSearchParams(searchParams);
  forward.delete('op');

  const serverKey =
    opts.serverApiKey?.trim() ??
    (typeof process !== 'undefined' ? process.env.PUBMED_API_KEY?.trim() : undefined);
  if (serverKey && !forward.get('api_key')) forward.set('api_key', serverKey);

  const url = `${base}?${forward.toString()}`;
  const maxLen = 200_000;
  if (url.length > maxLen) {
    return {
      ok: false,
      status: 413,
      body: JSON.stringify({ error: 'Request URL exceeds safe length.' }),
    };
  }

  return { ok: true, url };
}
