// src/components/LoadingState.tsx
// -----------------------------------------------------------------------------
// Skeleton cards rendered while a PubMed search is in flight. We render six
// placeholders so the layout doesn't visibly jump when results arrive.
// -----------------------------------------------------------------------------

export function LoadingState() {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      role="status"
      aria-label="Loading article"
      className="flex h-full animate-pulse flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card"
    >
      <div className="mb-3 flex gap-1.5">
        <div className="h-5 w-16 rounded-full bg-slate-100" />
        <div className="h-5 w-20 rounded-full bg-slate-100" />
      </div>
      <div className="h-5 w-11/12 rounded bg-slate-200" />
      <div className="mt-2 h-5 w-3/4 rounded bg-slate-200" />
      <div className="mt-3 h-3 w-2/3 rounded bg-slate-100" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
      </div>
      <div className="mt-4 h-3 w-1/3 rounded bg-slate-200" />
    </div>
  );
}
