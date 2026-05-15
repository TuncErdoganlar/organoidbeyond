// src/components/ErrorState.tsx
// -----------------------------------------------------------------------------
// Error panel shown when a PubMed request fails (network, 429, etc.). Always
// offers a Retry button so the user has a one-click path back to a good state.
// -----------------------------------------------------------------------------

import { AlertTriangle, RotateCcw } from 'lucide-react';

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/60 dark:bg-red-950/40"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-red-100 text-red-600 mx-auto dark:bg-red-500/20 dark:text-red-300">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-3 text-base font-semibold text-red-900 dark:text-red-200">
        Something went wrong
      </h2>
      <p className="mt-1 text-sm text-red-800 dark:text-red-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="focus-ring mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}
