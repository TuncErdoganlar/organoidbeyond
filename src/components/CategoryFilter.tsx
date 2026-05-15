// src/components/CategoryFilter.tsx
// -----------------------------------------------------------------------------
// Single-select topic chip row. The "All" chip clears the filter.
// -----------------------------------------------------------------------------

import { CATEGORY_LABELS, TOPIC_CHIP_ORDER } from '@/config/categories.config';
import type { Category } from '@/types/article.types';

const CATEGORY_DOT: Record<Category, string> = {
  ORGANOID: 'bg-category-organoid',
  STEM_CELLS: 'bg-category-stemcell',
  CANCER: 'bg-category-cancer',
  CRISPR: 'bg-category-crispr',
  EPIGENETICS: 'bg-category-epigenetics',
  GENE_THERAPY: 'bg-category-gene',
  SINGLE_CELL_OMICS: 'bg-category-omics',
  IMMUNOLOGY: 'bg-category-immunology',
  GENERAL_MB: 'bg-category-general',
};

export interface CategoryFilterProps {
  value: Category | null;
  onChange: (next: Category | null) => void;
  counts?: Partial<Record<Category, number>>;
  disabled?: boolean;
}

export function CategoryFilter({ value, onChange, counts, disabled }: CategoryFilterProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Filter by topic"
      className="flex flex-wrap items-center gap-2"
    >
      <Chip
        active={value === null}
        onClick={() => onChange(null)}
        disabled={disabled}
        label="All"
      />
      {TOPIC_CHIP_ORDER.map((cat) => {
        const active = value === cat;
        const count = counts?.[cat];
        return (
          <Chip
            key={cat}
            active={active}
            onClick={() => onChange(cat)}
            disabled={disabled}
            label={
              count !== undefined ? `${CATEGORY_LABELS[cat]} (${count})` : CATEGORY_LABELS[cat]
            }
            dotClass={CATEGORY_DOT[cat]}
          />
        );
      })}
    </div>
  );
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
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
          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-500/20 dark:text-brand-200'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-50',
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
