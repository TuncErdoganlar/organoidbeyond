import type { ParsedUrlQuery } from 'node:querystring';
export type ResolvePubmedUpstreamResult = {
    ok: true;
    url: string;
} | {
    ok: false;
    status: number;
    body: string;
};
/**
 * Vercel's Node `req.url` is often **path-only** (`/api/pubmed`) with no `?…`;
 * query args live in `req.query`. Connect/Vite usually exposes the full path
 * + query on `req.url`. This helper merges both so `op`, `term`, etc. are never
 * dropped in production.
 */
export declare function searchParamsFromNodeRequest(url: string | undefined, query: ParsedUrlQuery | undefined): URLSearchParams;
/** Timeout signal compatible with Node runtimes that lack `AbortSignal.timeout`. */
export declare function createTimeoutSignal(ms: number): AbortSignal;
/**
 * NCBI supports POST for long requests. Some hosts also cap GET URL length;
 * POST avoids 5xx from intermediaries when the query is huge.
 */
export declare function proxyFetchPubmed(fullUrl: string, signal: AbortSignal): Promise<Response>;
export declare function resolvePubmedUpstreamUrl(searchParams: URLSearchParams, opts?: {
    serverApiKey?: string;
}): ResolvePubmedUpstreamResult;
