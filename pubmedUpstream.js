// -----------------------------------------------------------------------------
// Shared E-utilities URL builder for `/api/pubmed` (Vercel + Vite dev/preview).
// SSRF-safe: only op=esearch|efetch maps to fixed NCBI URLs.
// -----------------------------------------------------------------------------
var PUBMED_TARGETS = {
    esearch: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
    efetch: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi',
};
export function resolvePubmedUpstreamUrl(searchParams, opts) {
    var _a, _b, _c;
    if (opts === void 0) { opts = {}; }
    var op = searchParams.get('op');
    if (op !== 'esearch' && op !== 'efetch') {
        return {
            ok: false,
            status: 400,
            body: JSON.stringify({
                error: 'Missing or invalid "op"; use esearch or efetch.',
            }),
        };
    }
    var base = PUBMED_TARGETS[op];
    var forward = new URLSearchParams(searchParams);
    forward.delete('op');
    var serverKey = (_b = (_a = opts.serverApiKey) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : (typeof process !== 'undefined' ? (_c = process.env.PUBMED_API_KEY) === null || _c === void 0 ? void 0 : _c.trim() : undefined);
    if (serverKey && !forward.get('api_key'))
        forward.set('api_key', serverKey);
    var url = "".concat(base, "?").concat(forward.toString());
    var maxLen = 12000;
    if (url.length > maxLen) {
        return {
            ok: false,
            status: 413,
            body: JSON.stringify({ error: 'Request URL exceeds safe length.' }),
        };
    }
    return { ok: true, url: url };
}
