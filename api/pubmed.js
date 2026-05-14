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
import { resolvePubmedUpstreamUrl } from '../pubmedUpstream';
var TIMEOUT_MS = 25000;
export default function handler(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var host, sp, built, ctl, upstream, ct, text, _a;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (req.method !== 'GET') {
                        res.statusCode = 405;
                        res.setHeader('Allow', 'GET');
                        res.end('Method Not Allowed');
                        return [2 /*return*/];
                    }
                    host = typeof ((_b = req.headers) === null || _b === void 0 ? void 0 : _b.host) === 'string' ? req.headers.host : 'localhost';
                    sp = new URL((_c = req.url) !== null && _c !== void 0 ? _c : '', "https://".concat(host)).searchParams;
                    built = resolvePubmedUpstreamUrl(sp);
                    if (!built.ok) {
                        res.statusCode = built.status;
                        res.setHeader('Content-Type', 'application/json; charset=utf-8');
                        res.setHeader('Cache-Control', 'no-store');
                        res.end(built.body);
                        return [2 /*return*/];
                    }
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 4, , 5]);
                    ctl = AbortSignal.timeout(TIMEOUT_MS);
                    return [4 /*yield*/, fetch(built.url, {
                            headers: { Accept: 'application/json, text/xml, text/plain, */*' },
                            signal: ctl,
                        })];
                case 2:
                    upstream = _d.sent();
                    res.statusCode = upstream.status;
                    ct = upstream.headers.get('content-type');
                    if (ct)
                        res.setHeader('Content-Type', ct);
                    res.setHeader('Cache-Control', 'no-store');
                    return [4 /*yield*/, upstream.text()];
                case 3:
                    text = _d.sent();
                    res.end(text);
                    return [3 /*break*/, 5];
                case 4:
                    _a = _d.sent();
                    res.statusCode = 502;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify({ error: 'PubMed proxy upstream failed.' }));
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
