# OrganoidBeyond

A live research dashboard for the latest **Molecular Biology and Genetics**
papers, auto-categorized into topics (ORGANOID, CANCER, CRISPR, EPIGENETICS,
GENE THERAPY, …) and filterable by time window (1m / 3m / 6m / 1y / 2y).

Data is fetched live from the **NCBI PubMed E-utilities** API — no static
dataset, no manual curation.

Live: **[organoidbeyond.vercel.app](https://organoidbeyond.vercel.app)**

---

## Project Goals

- Give researchers a fast, filterable read of recent literature in a fast-
  moving field, without manually searching PubMed
- Auto-tag every paper by topic from its title, abstract, and MeSH terms —
  no manual labeling
- Stay current by design: every search hits PubMed live, scoped to a
  configurable recency window
- Ship as a small, dependency-light SPA that's cheap to host and fast to load

---

## Repository Structure

    organoidbeyond/
    │
    ├── api/
    │   └── pubmed.ts               Vercel serverless function — proxies PubMed E-utilities (keeps API key server-side, avoids CORS)
    │
    ├── src/
    │   ├── App.tsx                 Dashboard shell — owns filter state, decides which sub-view renders
    │   ├── components/
    │   │   ├── Header.tsx
    │   │   ├── ControlPanel.tsx    Time window + category + topic-text filters
    │   │   ├── ArticleGrid.tsx / ArticleCard.tsx
    │   │   ├── CategoryFilter.tsx / TimeWindowSelect.tsx
    │   │   ├── LoadingState.tsx / EmptyState.tsx / ErrorState.tsx
    │   │
    │   ├── config/
    │   │   ├── categories.config.ts    Category → keyword/regex rules (single source of truth for topic tagging)
    │   │   ├── pubmedTopicQuery.ts     Builds PubMed ESearch query strings
    │   │   └── api.config.ts
    │   │
    │   ├── services/
    │   │   ├── pubmed.service.ts        Talks to the PubMed API
    │   │   ├── articleAggregator.service.ts  Fetch → categorize → filter pipeline
    │   │   └── http.client.ts           Axios instance with interceptors/retry
    │   │
    │   ├── hooks/useArticles.ts     Data-fetching hook backing the dashboard
    │   ├── utils/                   categorizer, dateFilter, xmlParser, textUtils
    │   └── types/article.types.ts   Shared `Article`, `Category`, `TimeWindow` types
    │
    └── ARCHITECTURE.md              Full design notes (data flow, categorization rules, decisions)

---

## Features

- **Live PubMed search** — every query hits NCBI's E-utilities in real time;
  results are never stale beyond the selected time window.
- **Automatic topic tagging** — `categorizer.ts` scores each article's title +
  abstract + MeSH terms against the regex rules in `categories.config.ts` and
  assigns the best-matching category (with a `GENERAL_MB` fallback).
- **Time-window filtering** — 1 month to 2 years, applied both to the PubMed
  query and client-side via `dateFilter.ts`.
- **Free-text topic narrowing** — typing a topic narrows the PubMed ESearch
  query itself, not just the local result set.
- **Resilient fetching** — Axios client with interceptors and retry; explicit
  loading / empty / error states in the UI instead of silent failures.
- **Serverless PubMed proxy** — `api/pubmed.ts` runs as a Vercel function so
  the PubMed API key never reaches the browser and CORS isn't an issue.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Vite + React 18 + TypeScript |
| HTTP | Axios (interceptors + retry) |
| Dates | date-fns |
| XML parsing | fast-xml-parser (PubMed responses are XML) |
| Styling | Tailwind CSS + lucide-react |
| Hosting | Vercel (static SPA + serverless API route) |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. (Optional) copy the env template and add a PubMed API key
cp .env.example .env.local

# 3. Start the dev server
npm run dev

# 4. Type-check
npm run typecheck
```

A PubMed API key isn't required for light usage (NCBI allows a small number
of unauthenticated requests per second) but raises the rate limit — see
`.env.example`.

---

## Programmatic Usage

```ts
import { fetchArticles } from '@/services/articleAggregator.service';

const articles = await fetchArticles({ window: '3m', pageSize: 50 });
// → Article[] already categorized & time-filtered
```

See `src/types/article.types.ts` for the full `Article` shape.

---

## Adding a New Category

1. Add the literal to `Category` in `src/types/article.types.ts`.
2. Push a `CategoryRule` (label + keyword/regex patterns) to
   `src/config/categories.config.ts` and append it to `TOPIC_CHIP_ORDER`.

TypeScript then forces every consumer (filters, badges, UI) to handle the
new category.

---

## Further Reading

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design: data flow,
categorization strategy, and rationale behind the service/hook split.

---

## License

MIT — see [LICENSE](./LICENSE).
