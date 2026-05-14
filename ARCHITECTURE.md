# OrganoidBeyond — Architecture (Step 1)

A modern single-page application that aggregates, categorizes, and time-filters
recent research papers in **Molecular Biology and Genetics** from the
NCBI PubMed E-utilities API.

This document describes the architecture and the **service / backend layer**
delivered in Step 1. The React UI layer (components, pages, hooks) is
deliberately deferred to Step 2 and is represented only by minimal placeholder
files so the project can boot.

---

## 1. Architectural Style

The application follows a **layered, dependency-inverted architecture** on top
of a Vite + React + TypeScript SPA. The browser calls **same-origin** `/api/pubmed`;
on **Vercel** a serverless function (`api/pubmed.ts`) forwards GET requests to NCBI
E-utilities. In **`npm run dev`** / **`vite preview`**, Vite's middleware mirrors
that proxy so behaviour matches production. Locally (outside Vercel) there is still
no long-running backend process — only static assets plus the optional serverless /
dev proxy glue.

```
┌────────────────────────────────────────────────────────────────┐
│                          UI Layer (Step 2)                     │
│  React components → custom hooks (useArticles, useFilters)     │
└──────────────────────────┬─────────────────────────────────────┘
                           │  calls
                           ▼
┌────────────────────────────────────────────────────────────────┐
│                      Service Layer (Step 1)                    │
│  articleAggregator.service.ts   ← orchestrator                 │
│        │                                                       │
│        ├── pubmed.service.ts    ← ESearch + EFetch             │
│        │     uses http.client.ts (Axios w/ retry + throttle)   │
│        │                                                       │
│        ├── utils/xmlParser.ts   ← PubMed XML → JS object       │
│        ├── utils/categorizer.ts ← keyword → category mapping   │
│        ├── utils/dateFilter.ts  ← date-fns window filtering    │
│        └── utils/textUtils.ts   ← abstract snippets, sanitize  │
│                                                                │
│  reads from: config/api.config.ts, config/categories.config.ts │
│  emits:      types/article.types.ts  (Article[])               │
└────────────────────────────────────────────────────────────────┘
                           │  hits
                           ▼
              ┌────────────────────────────┐
              │ NCBI E-utilities (PubMed)  │
              │  eutils.ncbi.nlm.nih.gov   │
              └────────────────────────────┘
```

The contract between layers is the **`Article` domain type**. The UI never
imports anything PubMed-specific; it only sees normalized `Article[]`.

---

## 2. Folder & File Structure

```
organoidbeyond/
├── ARCHITECTURE.md              ← this document
├── README.md                    ← quick-start
├── package.json                 ← deps: react, axios, date-fns, lucide-react, fast-xml-parser
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── .env.example                 ← VITE_PUBMED_API_KEY (optional, raises rate limit)
├── .gitignore
└── src/
    ├── main.tsx                 ← React entry (Step 2 will flesh this out)
    ├── App.tsx                  ← placeholder shell
    ├── index.css                ← Tailwind directives
    ├── vite-env.d.ts
    │
    ├── types/
    │   └── article.types.ts     ← Article, TimeWindow, Category, PubMed DTOs
    │
    ├── config/
    │   ├── api.config.ts        ← PubMed endpoints, defaults, rate limits
    │   └── categories.config.ts ← keyword maps (ORGANOID, CANCER, …)
    │
    ├── utils/
    │   ├── categorizer.ts       ← keyword-matching categorizer
    │   ├── dateFilter.ts        ← time-window helpers (1m/3m/6m/1y/2y)
    │   ├── xmlParser.ts         ← thin wrapper over fast-xml-parser
    │   └── textUtils.ts         ← snippet builder, HTML strip, dedupe
    │
    ├── services/
    │   ├── http.client.ts       ← shared Axios instance (timeout + retry)
    │   ├── pubmed.service.ts    ← ESearch + EFetch + normalization
    │   └── articleAggregator.service.ts  ← public façade for the UI
    │
    └── hooks/                   ← (empty, populated in Step 2)
```

---

## 3. Data Flow (end-to-end)

For a user request like "show me ORGANOID papers from the last 3 months":

1. **UI** calls `articleAggregator.fetchArticles({ window: '3m' })`.
2. **Aggregator** asks `pubmed.service` to search for recent
   Molecular Biology / Genetics papers in that date window via **ESearch**.
3. **ESearch** returns a list of PMIDs (PubMed IDs) as JSON.
4. **Aggregator** asks `pubmed.service` to fetch metadata for those PMIDs via
   **EFetch** (XML, because EFetch on PubMed does not support JSON for full
   records — this is documented NCBI behavior).
5. **xmlParser** turns the XML into a JS object tree.
6. **pubmed.service** normalizes each record into the domain `Article` type.
7. **categorizer** tags each article with one or more categories by scanning
   the title + abstract + MeSH terms for keyword hits.
8. **dateFilter** is applied a second time client-side as a safety net (the
   server-side date filter is the primary guard, but `pubDate` in EFetch can
   be a partial date like "2026 Apr"; the helper normalizes these).
9. **textUtils** trims a clean abstract snippet for card display.
10. The aggregator returns `Article[]` to the UI.

---

## 4. PubMed E-utilities — what we use and why

| Endpoint   | Path                          | Format | Why                                                                                  |
| ---------- | ----------------------------- | ------ | ------------------------------------------------------------------------------------ |
| `ESearch`  | `/entrez/eutils/esearch.fcgi` | JSON   | Fast PMID lookup by query + date range. Pagination via `retstart` / `retmax`.        |
| `EFetch`   | `/entrez/eutils/efetch.fcgi`  | XML    | The only endpoint that returns full abstracts + author affiliations + MeSH headings. |

We deliberately **do not** use `ESummary` because it omits abstracts; doing one
EFetch call is cheaper than ESummary + a second call for abstracts.

**Rate limits.** NCBI enforces 3 req/sec without an API key and 10 req/sec
with one. The HTTP client centralizes a small queue + Axios timeout so we
stay polite. The API key is read from `VITE_PUBMED_API_KEY` (optional).

**Default query.** `("Molecular Biology"[MeSH] OR "Genetics"[MeSH]) AND
hasabstract[text]`, narrowed by `mindate`/`maxdate` derived from the chosen
time window. We require `hasabstract` so cards always have body text.

---

## 5. Categorization Logic

`categorizer.ts` performs **case-insensitive token matching** against the
concatenation of `title + abstract + meshTerms`. Each category is a record
of `{ category: string; patterns: RegExp[] }`. We use `\b…\b` word
boundaries so "casino" doesn't match "cas" and so on. An article can land in
**multiple** categories (a CRISPR organoid paper is both `CRISPR` and
`ORGANOID`); the UI will let the user pivot on a single category in Step 2.

The keyword sets live in `config/categories.config.ts` so they are trivial to
extend without touching logic. Default categories shipped in Step 1:

- **ORGANOID** — organoid, organoids, gastruloid, spheroid, 3D culture, iPSC-derived
- **CANCER** — cancer, tumor/tumour, oncology, carcinoma, metastasis, leukemia, lymphoma, sarcoma
- **CRISPR** — CRISPR, Cas9, Cas12, Cas13, gene editing, base editing, prime editing
- **EPIGENETICS** — epigenetic, methylation, histone, chromatin, epigenome, DNMT, HDAC
- **GENE_THERAPY** — gene therapy, AAV, lentivirus, viral vector, gene replacement, ex vivo gene

---

## 6. Time-Window Filtering

`dateFilter.ts` exposes a small enum-like map:

```ts
type TimeWindow = '1m' | '3m' | '6m' | '1y' | '2y';
```

Each window resolves to `{ minDate: Date; maxDate: Date }` via `date-fns`
(`subMonths`, `subYears`). The aggregator passes a `YYYY/MM/DD` formatted
range to ESearch (`mindate=…&maxdate=…&datetype=pdat`) and re-applies the
filter on the client in case of partial dates.

---

## 7. Library Choices

| Library             | Purpose                  | Why this one                                                                      |
| ------------------- | ------------------------ | --------------------------------------------------------------------------------- |
| `axios`             | HTTP client              | Interceptors + cancellation + uniform error shape; the prompt explicitly requests it. |
| `date-fns`          | Date math                | Tree-shakeable, immutable, no Moment-style mutation footguns.                     |
| `fast-xml-parser`   | XML → JS                 | Pure JS, no DOMParser dependency, predictable schema with `alwaysCreateTextNode`. |
| `lucide-react`      | Icons (Step 2)           | Modern, tree-shakeable, MIT.                                                       |
| `tailwindcss`       | Styling (Step 2)         | Utility-first, scientific dashboard look is easy to compose.                       |

---

## 8. Error Handling & Edge Cases

- `http.client.ts` catches network errors and rate-limit responses (HTTP 429)
  and surfaces them as typed `PubmedError` objects.
- `pubmed.service.ts` defensively normalizes missing fields (no abstract,
  single-author array, missing year) so the UI never crashes on a malformed
  record.
- `categorizer.ts` returns `['UNCATEGORIZED']` if no patterns match, so the UI
  always has a non-empty array to render.
- Date parsing fallbacks: if PubMed returns `2026` only, we treat the
  publication date as July 1 of that year (mid-year heuristic) for sorting,
  while preserving the original string for display.

---

## 9. What Step 2 Will Add

- React UI: `<Dashboard>`, `<ArticleCard>`, `<CategoryFilter>`, `<TimeWindowSelect>`.
- Custom hooks: `useArticles(window)`, `useCategoryFilter()`.
- Skeleton loaders, error toasts, empty states, and accessibility passes.
- Possibly a thin client-side cache via `Map<string, Article[]>` keyed by
  `(query, window)` to avoid re-hitting NCBI on every filter change.

The service layer below is designed so Step 2 can consume it without any
changes — only the UI is missing.
