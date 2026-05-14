// src/utils/textUtils.ts
// -----------------------------------------------------------------------------
// Small, pure helpers for sanitizing and trimming text. Kept dependency-free
// so they're trivially unit-testable.
// -----------------------------------------------------------------------------

/**
 * Removes HTML/XML tags and collapses whitespace. PubMed abstracts can
 * contain embedded `<i>`, `<sub>`, `<sup>` formatting tags that would
 * otherwise render as raw markup in our card snippets.
 */
export function stripMarkup(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, ' ') // drop tags
    .replace(/\s+/g, ' ') // collapse whitespace runs
    .trim();
}

/**
 * Trims `text` to ~`maxChars`, cutting at the last word boundary so we never
 * leave half a word, and appends an ellipsis when truncation actually
 * happened.
 *
 *   buildSnippet("Long abstract about CRISPR...", 50)
 *     → "Long abstract about CRISPR…"
 */
export function buildSnippet(text: string, maxChars = 280): string {
  if (text.length <= maxChars) return text;

  // Slice a little extra so the boundary search has room to find a space.
  const slice = text.slice(0, maxChars + 1);
  const lastSpace = slice.lastIndexOf(' ');
  // Fall back to a hard cut if there's literally no whitespace (unlikely).
  const cutAt = lastSpace > 0 ? lastSpace : maxChars;
  return `${slice.slice(0, cutAt).trimEnd()}…`;
}

/**
 * Joins an array with Oxford-comma semantics, optionally collapsing long
 * lists into "A, B, C, …+N more". Used for the author line on cards.
 */
export function joinAuthors(authors: string[], maxVisible = 4): string {
  if (authors.length === 0) return '';
  if (authors.length <= maxVisible) return authors.join(', ');
  const visible = authors.slice(0, maxVisible).join(', ');
  return `${visible}, …+${authors.length - maxVisible} more`;
}

/**
 * Returns a stable, ASCII-only key for de-duplicating articles. We hash by
 * DOI when available (most reliable cross-source ID) and fall back to PMID.
 */
export function dedupeKey(doi?: string, pmid?: string): string {
  return (doi ?? '').toLowerCase() || (pmid ?? '');
}
