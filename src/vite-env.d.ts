/// <reference types="vite/client" />

// -----------------------------------------------------------------------------
// Tells the TypeScript compiler about the shape of `import.meta.env` so that
// `import.meta.env.VITE_PUBMED_API_KEY` is typed as `string | undefined`
// instead of `any`. Every VITE_* variable added to `.env.local` must also be
// declared here.
// -----------------------------------------------------------------------------

interface ImportMetaEnv {
  /** Optional NCBI E-utilities API key — raises rate limit from 3 to 10 req/s. */
  readonly VITE_PUBMED_API_KEY?: string;
  /** Optional email NCBI attaches to requests as a courtesy. */
  readonly VITE_PUBMED_TOOL_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
