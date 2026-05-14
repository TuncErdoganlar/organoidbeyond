export type ResolvePubmedUpstreamResult = {
    ok: true;
    url: string;
} | {
    ok: false;
    status: number;
    body: string;
};
export declare function resolvePubmedUpstreamUrl(searchParams: URLSearchParams, opts?: {
    serverApiKey?: string;
}): ResolvePubmedUpstreamResult;
