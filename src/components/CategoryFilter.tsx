// src/components/CategoryFilter.tsx
// -----------------------------------------------------------------------------
// Single-select category chip row. The "All" chip clears the filter.
//
// The category list is sourced from `CATEGORY_LABELS` in
// `config/categories.config.ts` so adding a new category in the service layer
// is enough — the chip appears automatically. The accent colors come from
// the `category-*` tokens defined in `tailwind.config.js`.
// -----------------------------------------------------------------------------

import { CATEGORY_LABELS } from '@/config/categories.config';
import type { Category } from '@/types/article.types';

/** Hex-named class lookup. We pre-list classes so Tailwind's JIT doesn't
 *  purge them. (Tailwind only keeps classes it sees as full strings in source.) */
const CATEGORY_DOT: Record<Category, string> = {
  ORGANOID: 'bg-category-organoid',
  CANCER: 'bg-category-cancer',
  CRISPR: 'bg-category-crispr',
  EPIGENETICS: 'bg-category-epigenetics',
  GENE_THERAPY: 'bg-category-gene',
  UNCATEGORIZED: 'bg-category-other',
};

/** Order chips are displayed in. UNCATEGORIZED intentionally last. */
const CATEGORY_ORDER: Category[] = [
  'ORGANOID',
  'CANCER',
  'CRISPR',
  'EPIGENETICS',
  'GENE_THERAPY',
  'UNCATEGORIZED',
];

export interface CategoryFilterProps {
  /** `null` means "All categories" (no filter). */
  value: Category | null;
  onChange: (next: Category | null) => void;
  /** Optional counts per category for "ORGANOID (12)" style labels. */
  counts?: Partial<Record<Category, number>>;
  disabled?: boolean;
}

export function CategoryFilter({ value, onChange, counts, disabled }: CategoryFilterProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Filter by category"
      className="flex flex-wrap items-center gap-2"
    >
      {/* "All" chip — clears the single-select. */}
      <Chip
        active={value === null}
        onClick={() => onChange(null)}
        disabled={disabled}
        label="All"
      />
      {CATEGORY_ORDER.map((cat) => {
        const active = value === cat;
        const count = counts?.[cat];
        return (
          <Chip
            key={cat}
            active={active}
            onClick={() => onChange(cat)}
            disabled={disabled}
            label={count !== undefined ? `${CATEGORY_LABELS[cat]} (${count})` : CATEGORY_LABELS[cat]}
            dotClass={CATEGORY_DOT[cat]}
          />
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Local Chip component. Kept in the same file because it's tightly coupled to
// the chip row's visual language and isn't used elsewhere.
// -----------------------------------------------------------------------------

interface ChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  /** Optional Tailwind class for the colored leading dot. */
  dotClass?: string;
  disabled?: boolean;
}

function Chip({ active, onClick, label, dotClass, disabled }: ChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={[
        'focus-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
        active
          ? 'border-brand-500 bg-brand-50 text-brand-700'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
        disabled ? 'cursor-not-allowed opacity-60' : '',
      ].join(' ')}
    >
      {dotClass && (
        <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
      )}
      {label}
    </button>
  );
}
