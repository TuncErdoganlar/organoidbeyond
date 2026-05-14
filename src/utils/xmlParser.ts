// src/utils/xmlParser.ts
// -----------------------------------------------------------------------------
// Thin, opinionated wrapper over `fast-xml-parser`. We expose only one
// function so the rest of the codebase doesn't need to know about parser
// configuration. The defaults here are tuned for PubMed's EFetch XML:
//
//   - `ignoreAttributes: false`        — PubMed encodes useful info in attrs
//                                        (e.g., the IdType="doi" on ArticleId).
//   - `attributeNamePrefix: '@_'`      — fast-xml-parser default; we keep it.
//   - `textNodeName: '#text'`          — element text content lives here when
//                                        the node also has attributes/children.
//   - `parseTagValue: false`           — keep everything as strings; we'll
//                                        cast deliberately when we normalize.
//   - `trimValues: true`               — strip whitespace in text nodes.
//
// Why parse to JS instead of using browser DOMParser?
//   fast-xml-parser is pure JS, ~10x faster than DOMParser for large blobs,
//   and gives us a plain object tree that's trivial to walk recursively.
// -----------------------------------------------------------------------------

import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  trimValues: true,
  // PubMed sometimes includes empty self-closing tags (e.g., <ELocationID/>).
  // Tell the parser to surface them as empty strings instead of `true`.
  parseAttributeValue: false,
});

/**
 * Parses a PubMed EFetch XML payload into a generic object tree. Callers
 * are expected to validate the shape themselves (see `pubmed.service.ts`'s
 * `normalizePubmedArticle`) rather than relying on a typed schema, because
 * PubMed's XML is irregular: a single `<Author>` can be either an object or
 * an array depending on how many authors exist.
 */
export function parsePubmedXml(xml: string): unknown {
  return parser.parse(xml);
}

/**
 * Coerces a value that *might* be an array, a single object, or `undefined`
 * into a real array. PubMed's XML is famous for this footgun:
 *   1 author  → `Author: {…}`
 *   2 authors → `Author: [{…}, {…}]`
 *   0 authors → `Author: undefined`
 *
 * Use everywhere you traverse PubMed XML.
 */
export function toArray<T>(maybe: T | T[] | undefined | null): T[] {
  if (maybe === undefined || maybe === null) return [];
  return Array.isArray(maybe) ? maybe : [maybe];
}

/**
 * Pulls a plain string out of a node that might be either a raw string or
 * `{ '#text': '...', '@_attr': '...' }`. Returns `''` if nothing usable.
 */
export function textOf(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (typeof node === 'object' && '#text' in (node as Record<string, unknown>)) {
    const t = (node as Record<string, unknown>)['#text'];
    return typeof t === 'string' ? t : '';
  }
  return '';
}
