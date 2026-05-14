// src/components/Header.tsx
// -----------------------------------------------------------------------------
// The dashboard header. Pure presentational component — no state, no props.
// Kept separate from <App/> so we can extend it later (logo, theme toggle,
// account menu) without polluting the dashboard composition file.
// -----------------------------------------------------------------------------

import { FlaskConical } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
        {/* The icon doubles as a light logo mark. */}
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <FlaskConical className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            OrganoidBeyond
          </h1>
          <p className="text-sm text-slate-500">
            Latest research in Molecular Biology &amp; Genetics, sourced from PubMed.
          </p>
        </div>
      </div>
    </header>
  );
}
