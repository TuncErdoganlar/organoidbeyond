import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolvePubmedUpstreamUrl } from '../pubmedUpstream';

const TIMEOUT_MS = 25_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.end('Method Not Allowed');
    return;
  }

  const host = typeof req.headers?.host === 'string' ? req.headers.host : 'localhost';
  const sp = new URL(req.url ?? '', `https://${host}`).searchParams;

  const built = resolvePubmedUpstreamUrl(sp);
  if (!built.ok) {
    res.statusCode = built.status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(built.body);
    return;
  }

  try {
    const ctl = AbortSignal.timeout(TIMEOUT_MS);
    const upstream = await fetch(built.url, {
      headers: { Accept: 'application/json, text/xml, text/plain, */*' },
      signal: ctl,
    });

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
