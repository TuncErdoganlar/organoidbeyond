// -----------------------------------------------------------------------------
// Shared E-utilities URL builder for `/api/pubmed` (Vercel + Vite dev/preview).
// SSRF-safe: only op=esearch|efetch maps to fixed NCBI URLs.
// -----------------------------------------------------------------------------
const PUBMED_TARGETS = {
  esearch: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
  efetch: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi',
} as const;

export type ResolvePubmedUpstreamResult =
  | { ok: true; url: string }
  | { ok: false; status: number; body: string };

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
  const maxLen = 12_000;
  if (url.length > maxLen) {
    return {
      ok: false,
      status: 413,
      body: JSON.stringify({ error: 'Request URL exceeds safe length.' }),
    };
  }

  return { ok: true, url };
}
