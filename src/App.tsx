// src/App.tsx
// -----------------------------------------------------------------------------
// Placeholder shell for Step 1. Renders a status card so you can verify Vite
// is wired up correctly. The full dashboard (CategoryFilter, ArticleCard grid,
// TimeWindowSelect, etc.) will replace this in Step 2.
// -----------------------------------------------------------------------------

export default function App() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">OrganoidBeyond</h1>
      <p className="mt-2 text-slate-600">
        Step 1 scaffolding is in place. The service layer at{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">
          src/services/articleAggregator.service.ts
        </code>{' '}
        can already fetch &amp; categorize PubMed articles. The dashboard UI
        will be built in Step 2.
      </p>
    </main>
  );
}
