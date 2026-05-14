var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var PUBMED_TARGETS = {
    esearch: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
    efetch: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi',
};
/**
 * Vercel's Node `req.url` is often **path-only** (`/api/pubmed`) with no `?…`;
 * query args live in `req.query`. Connect/Vite usually exposes the full path
 * + query on `req.url`. This helper merges both so `op`, `term`, etc. are never
 * dropped in production.
 */
export function searchParamsFromNodeRequest(url, query) {
    if (query && typeof query === 'object' && Object.keys(query).length > 0) {
        var sp = new URLSearchParams();
        for (var _i = 0, _a = Object.entries(query); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], val = _b[1];
            if (val === undefined)
                continue;
            for (var _c = 0, _d = Array.isArray(val) ? val : [val]; _c < _d.length; _c++) {
                var item = _d[_c];
                if (item !== undefined && item !== null)
                    sp.append(key, String(item));
            }
        }
        return sp;
    }
    var raw = url !== null && url !== void 0 ? url : '';
    var q = raw.indexOf('?');
    return q === -1 ? new URLSearchParams() : new URLSearchParams(raw.slice(q + 1));
}
/** Timeout signal compatible with Node runtimes that lack `AbortSignal.timeout`. */
export function createTimeoutSignal(ms) {
    var AS = AbortSignal;
    if (typeof AS.timeout === 'function')
        return AS.timeout(ms);
    var c = new AbortController();
    setTimeout(function () { return c.abort(); }, ms);
    return c.signal;
}
/**
 * NCBI supports POST for long requests. Some hosts also cap GET URL length;
 * POST avoids 5xx from intermediaries when the query is huge.
 */
export function proxyFetchPubmed(fullUrl, signal) {
    return __awaiter(this, void 0, void 0, function () {
        var accept, qi, base, body;
        return __generator(this, function (_a) {
            accept = { Accept: 'application/json, text/xml, text/plain, */*' };
            if (fullUrl.length <= 8192) {
                return [2 /*return*/, fetch(fullUrl, { method: 'GET', headers: accept, signal: signal })];
            }
            qi = fullUrl.indexOf('?');
            if (qi === -1) {
                return [2 /*return*/, fetch(fullUrl, { method: 'GET', headers: accept, signal: signal })];
            }
            base = fullUrl.slice(0, qi);
            body = fullUrl.slice(qi + 1);
            return [2 /*return*/, fetch(base, {
                    method: 'POST',
                    headers: __assign(__assign({}, accept), { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }),
                    body: body,
                    signal: signal,
                })];
        });
    });
}
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
    var maxLen = 200000;
    if (url.length > maxLen) {
        return {
            ok: false,
            status: 413,
            body: JSON.stringify({ error: 'Request URL exceeds safe length.' }),
        };
    }
    return { ok: true, url: url };
}
