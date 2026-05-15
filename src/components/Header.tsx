// src/components/Header.tsx
// -----------------------------------------------------------------------------
// The dashboard header. Owns one small piece of UI state — the theme toggle —
// because the toggle is genuinely a header concern and lifting it into App.tsx
// would mean threading a prop through layers that don't care.
//
// Boot order: `index.html` runs a tiny inline script that sets/removes the
// `dark` class on `<html>` BEFORE React mounts (defaults to dark). This
// component then mirrors that state on mount and writes back to localStorage
// whenever the user clicks the toggle.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { FlaskConical, Moon, Sun } from 'lucide-react';

/** localStorage key for the persisted theme choice. Kept in sync with the
 *  inline boot script in `index.html` — change both or neither. */
const THEME_STORAGE_KEY = 'organoidbeyond.theme';

type Theme = 'dark' | 'light';

function readInitialTheme(): Theme {
  // The DOM is the source of truth at first paint — the boot script in
  // index.html has already decided. We read from there to avoid a hydration
  // mismatch (React would otherwise render the opposite icon for one frame).
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
  return 'dark';
}

export function Header() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  // Whenever theme changes, mirror it on <html> and persist.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* localStorage unavailable (private mode) → still works for the session. */
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const isDark = theme === 'dark';

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
        {/* The icon doubles as a light logo mark. */}
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <FlaskConical className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            OrganoidBeyond
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Latest research in Molecular Biology &amp; Genetics, sourced from PubMed.
          </p>
        </div>

        {/* Theme toggle — pushed to the right with ml-auto so it stays anchored
            on wide screens and tucks under the title block on narrow ones. */}
        <button
          type="button"
          onClick={toggle}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={isDark}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="focus-ring ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-card transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-50"
        >
          {isDark ? (
            <Sun className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}
