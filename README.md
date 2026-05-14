# OrganoidBeyond

A research dashboard for the latest **Molecular Biology and Genetics** papers,
auto-categorized into topics (ORGANOID, CANCER, CRISPR, EPIGENETICS, GENE
THERAPY) and filterable by time window (1m / 3m / 6m / 1y / 2y).

Data is fetched live from the **NCBI PubMed E-utilities** API.

## Stack

- **Vite + React 18 + TypeScript** — fast SPA scaffolding.
- **Axios** — HTTP client with interceptors and retry.
- **date-fns** — immutable date math.
- **fast-xml-parser** — turns PubMed's XML responses into JS objects.
- **Tailwind CSS** + **lucide-react** — UI in Step 2.

## Current status: Step 1 of 2

This commit contains the **service / data layer** only. The React UI is a
placeholder. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. (Optional) copy the env template and add a PubMed API key
cp .env.example .env.local

# 3. Start the dev server (placeholder UI — Step 2 will fill it in)
npm run dev

# 4. Type-check the service layer
npm run typecheck
```

## Programmatic usage (today)

```ts
import { fetchArticles } from '@/services/articleAggregator.service';

const articles = await fetchArticles({ window: '3m', pageSize: 50 });
// → Article[] already categorized & time-filtered
```

See `src/types/article.types.ts` for the full `Article` shape.
