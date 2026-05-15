// src/services/http.client.ts
// -----------------------------------------------------------------------------
// A SHARED AXIOS INSTANCE
//
// Responsibilities:
//   - Centralized timeout + retry policy + throttle queue.
//   - **Always-fresh** GETs: every PubMed call is annotated with no-cache
//     headers and a per-call `_ts` query parameter so neither the browser,
//     axios, nor any intermediate proxy/CDN can serve stale results when the
//     user clicks "Search PubMed". This is what makes the data dynamic on each
//     click instead of returning a memoized response from a previous search.
// -----------------------------------------------------------------------------

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  RATE_LIMIT_MS,
  REQUEST_TIMEOUT_MS,
  getPubmedApiKey,
} from '@/config/api.config';
import { PubmedError } from '@/types/article.types';

/**
 * Single shared Axios instance. Keeping one instance lets connection pools
 * and interceptors be reused across calls.
 */
export const httpClient = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
  // PubMed prefers identifying yourself in headers (some proxies also like it).
  // The Cache-Control + Pragma headers tell every layer between us and NCBI
  // not to hand us a cached body — critical for the "click Search → up-to-
  // date papers" guarantee.
  headers: {
    Accept: 'application/json, text/xml, */*',
    'Cache-Control': 'no-cache, no-store, max-age=0',
    Pragma: 'no-cache',
  },
});

// -----------------------------------------------------------------------------
// THROTTLING — NCBI: 3 req/s unauthenticated, 10 req/s with API key.
// -----------------------------------------------------------------------------

let lastRequestAt = 0;
let queue: Promise<void> = Promise.resolve();

function delayMs(): number {
  return getPubmedApiKey()
    ? RATE_LIMIT_MS.authenticated
    : RATE_LIMIT_MS.unauthenticated;
}

function gate(): Promise<void> {
  queue = queue.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, delayMs() - (now - lastRequestAt));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
  });
  return queue;
}

// -----------------------------------------------------------------------------
// PUBLIC HELPERS
// -----------------------------------------------------------------------------

/** Generic GET that returns a typed JSON body and applies our throttle. */
export async function getJson<T>(
  url: string,
  params: Record<string, string | number | undefined>,
  config: AxiosRequestConfig = {},
): Promise<T> {
  await gate();
  return withRetry(async () => {
    const response = await httpClient.get<T>(url, {
      ...config,
      params: withCacheBust(params),
      responseType: 'json',
    });
    return response.data;
  });
}

/** Generic GET that returns raw text (used for EFetch XML). */
export async function getText(
  url: string,
  params: Record<string, string | number | undefined>,
  config: AxiosRequestConfig = {},
): Promise<string> {
  await gate();
  return withRetry(async () => {
    const response = await httpClient.get<string>(url, {
      ...config,
      params: withCacheBust(params),
      responseType: 'text',
      transformResponse: [(d) => d],
    });
    return response.data;
  });
}

// -----------------------------------------------------------------------------
// INTERNALS
// -----------------------------------------------------------------------------

/**
 * Strip undefined keys AND append a per-call `_ts` timestamp. The timestamp
 * forces a unique URL per click, so HTTP caches keyed on (method + URL)
 * cannot return a previous response. NCBI ignores unknown query params.
 */
function withCacheBust(
  input: Record<string, string | number | undefined>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined) out[k] = v;
  }
  out._ts = Date.now();
  return out;
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || i === attempts - 1) break;
      const backoff = 250 * 2 ** i;
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw toPubmedError(lastErr);
}

function isRetryable(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  const status = err.response?.status;
  if (status === undefined) return true;
  return status === 429 || (status >= 500 && status < 600);
}

function toPubmedError(err: unknown): PubmedError {
  if (err instanceof PubmedError) return err;
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError;
    const status = ax.response?.status;
    const message =
      status === 429
        ? 'PubMed rate limit exceeded. Try again in a moment.'
        : status
        ? `PubMed request failed (HTTP ${status}).`
        : `Network error contacting PubMed: ${ax.message}`;
    return new PubmedError(message, { status, cause: ax });
  }
  return new PubmedError('Unexpected error contacting PubMed.', { cause: err });
}

export type { AxiosResponse };
