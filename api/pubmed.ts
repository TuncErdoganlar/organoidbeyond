// -----------------------------------------------------------------------------
// PubMed same-origin proxy for `/api/pubmed`.
// Intentionally ONE file: Vercel Node ESM does not ship sibling `pubmedUpstream.js`,
// so any `import './foo'` fails at runtime. Vite dev imports the helpers below.
// -----------------------------------------------------------------------------
import type { ParsedUrlQuery } from 'node:querystring';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PUBMED_TARGETS = {
  esearch: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
  efetch: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi',
} as const;

export type ResolvePubmedUpstreamResult =
  | { ok: true; url: string }
  | { ok: false; status: number; body: string };

/** @see ARCHITECTURE — Vercel `req.url` is often path-only; `req.query` has GET params. */
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

export function createTimeoutSignal(ms: number): AbortSignal {
  const AS = AbortSignal as typeof AbortSignal & { timeout?: (n: number) => AbortSignal };
  if (typeof AS.timeout === 'function') return AS.timeout(ms);
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

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

// ----- Vercel entry (default export only; helpers above are for local Vite import) -----

const TIMEOUT_MS = 25_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.end('Method Not Allowed');
    return;
  }

  const sp = searchParamsFromNodeRequest(
    typeof req.url === 'string' ? req.url : undefined,
    req.query,
  );

  const built = resolvePubmedUpstreamUrl(sp);
  if (!built.ok) {
    res.statusCode = built.status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(built.body);
    return;
  }

  try {
    const signal = createTimeoutSignal(TIMEOUT_MS);
    const upstream = await proxyFetchPubmed(built.url, signal);

    res.statusCode = upstream.status;
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'no-store');
    const text = await upstream.text();
    res.end(text);
  } catch {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'PubMed proxy upstream failed.' }));
  }
}
