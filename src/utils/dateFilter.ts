// src/utils/dateFilter.ts
// -----------------------------------------------------------------------------
// Time-window helpers.
//
// PubMed accepts date filters as `YYYY/MM/DD` ranges (`mindate`, `maxdate`),
// but the publication date *returned* by EFetch can be partial:
//   - "2026 May 14"   → full date
//   - "2026 May"      → month-precision
//   - "2026"          → year-only
// We therefore filter on the server (precise) AND keep a client-side filter
// as a safety net that handles partial dates with conservative heuristics.
// -----------------------------------------------------------------------------

import { subMonths, subYears, format, isAfter, isBefore } from 'date-fns';
import type { TimeWindow } from '@/types/article.types';

export interface DateRange {
  /** Earliest publication date allowed (inclusive). */
  minDate: Date;
  /** Latest publication date allowed (inclusive). Always "now". */
  maxDate: Date;
}

/**
 * Turns a `TimeWindow` code into an absolute `{ minDate, maxDate }` pair.
 * `maxDate` is always "now" — we never look into the future even by accident.
 */
export function resolveTimeWindow(window: TimeWindow, now: Date = new Date()): DateRange {
  const maxDate = now;
  let minDate: Date;

  switch (window) {
    case '1m':
      minDate = subMonths(now, 1);
      break;
    case '3m':
      minDate = subMonths(now, 3);
      break;
    case '6m':
      minDate = subMonths(now, 6);
      break;
    case '1y':
      minDate = subYears(now, 1);
      break;
    case '2y':
      minDate = subYears(now, 2);
      break;
    default: {
      // `never` here forces a compile error if `TimeWindow` grows and we
      // forget to handle a new value — much safer than a silent fall-through.
      const _exhaustive: never = window;
      throw new Error(`Unknown TimeWindow: ${String(_exhaustive)}`);
    }
  }

  return { minDate, maxDate };
}

/**
 * Formats a Date as PubMed's expected `YYYY/MM/DD`. Used in ESearch
 * `mindate=…&maxdate=…` query params.
 */
export function toPubmedDateString(date: Date): string {
  return format(date, 'yyyy/MM/dd');
}

/**
 * Best-effort parser for the partial date strings PubMed returns inside
 * EFetch XML. Returns `null` if the string is too mangled to parse.
 *
 * Strategy:
 *   1. If it looks like a real "Mon DD, YYYY" string, `Date` can parse it.
 *   2. If it's "YYYY Mon DD" (PubMed's actual format), normalize it.
 *   3. If it's "YYYY Mon", anchor to the 1st of that month.
 *   4. If it's just "YYYY", anchor to July 1 (mid-year) so sort order is
 *      neither artificially early nor artificially late.
 */
export function parsePubmedDate(raw: string | undefined | null): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // 4. Year only.
  if (/^\d{4}$/.test(trimmed)) {
    return new Date(`${trimmed}-07-01T00:00:00Z`);
  }

  // PubMed's canonical EFetch format is "YYYY Mon DD" or "YYYY Mon".
  const m = /^(\d{4})\s+([A-Za-z]+)(?:\s+(\d{1,2}))?$/.exec(trimmed);
  if (m) {
    const [, year, monthName, dayOpt] = m;
    const day = dayOpt ?? '01';
    // Construct via the JS engine's month name parsing.
    const parsed = new Date(`${monthName} ${day}, ${year} UTC`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // Last resort: let the JS engine try.
  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Returns `true` iff `date` falls inside `[minDate, maxDate]` inclusive.
 * Centralized so we don't sprinkle date-fns calls around the codebase.
 */
export function isWithinRange(date: Date, range: DateRange): boolean {
  // `!isBefore(date, min) && !isAfter(date, max)` is inclusive on both ends.
  return !isBefore(date, range.minDate) && !isAfter(date, range.maxDate);
}
