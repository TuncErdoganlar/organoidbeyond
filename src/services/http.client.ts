// src/services/http.client.ts
// -----------------------------------------------------------------------------
// A SHARED AXIOS INSTANCE
//
// Why centralize this?
//   - One place to set the timeout, base headers, and retry policy.
//   - We can throttle outgoing requests with a tiny in-memory queue so we
//     don't get HTTP 429 from NCBI (3 req/sec without API key).
//   - The whole app can be re-pointed to a proxy by editing this one file.
//
// What we deliberately do *not* do:
//   - We don't add a heavy retry library — Axios + a small `withRetry`
//     wrapper covers our needs without bloating the bundle.
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
  headers: { Accept: 'application/json, text/xml, */*' },
});

// -----------------------------------------------------------------------------
// THROTTLING
//
// NCBI enforces a per-IP rate limit: 3 req/s unauthenticated, 10 req/s with
// an API key. We serialize outgoing calls behind a tiny promise chain so we
// never exceed the rate, no matter how aggressively the UI fires requests.
// -----------------------------------------------------------------------------

let lastRequestAt = 0;
let queue: Promise<void> = Promise.resolve();

function delayMs(): number {
  return getPubmedApiKey()
    ? RATE_LIMIT_MS.authenticated
    : RATE_LIMIT_MS.unauthenticated;
}

/**
 * Returns a promise that resolves once the per-call rate limit has elapsed
 * since the previous request. By chaining onto `queue`, requests serialize
 * cleanly even when issued in parallel.
 */
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
//
// Every other service file calls `getJson` / `getText` instead of the raw
// Axios instance, so the throttle + retry policy is applied uniformly.
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
      params: stripUndefined(params),
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
      params: stripUndefined(params),
      // Force string so Axios doesn't try to parse XML as JSON.
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
 * Removes keys whose value is `undefined`. Axios will happily serialize
 * `?key=undefined` into the URL otherwise, which PubMed treats as a value.
 */
function stripUndefined<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/**
 * Retries on transient failures: HTTP 429 (rate-limited), 5xx, or network
 * errors. We retry up to 3 times with exponential backoff (250ms, 500ms,
 * 1000ms). Anything else surfaces as a typed `PubmedError`.
 */
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
  // Network errors have no response → retry. 429 + 5xx are transient.
  if (status === undefined) return true;
  return status === 429 || (status >= 500 && status < 600);
}

/** Normalize whatever Axios threw into a `PubmedError` for the UI layer. */
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

/** Re-export type so service files don't have to know Axios is underneath. */
export type { AxiosResponse };
