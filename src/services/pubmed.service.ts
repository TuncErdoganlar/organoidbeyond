// src/services/pubmed.service.ts
// -----------------------------------------------------------------------------
// PUBMED ADAPTER
//
// Responsibilities:
//   1. Call `ESearch` to get PMIDs for a query restricted to a date window.
//   2. Call `EFetch` to get full article XML (abstracts + authors + MeSH).
//   3. Normalize each PubMed record into our `Article` domain type.
//
// What's NOT here:
//   - Categorization (lives in `utils/categorizer.ts`).
//   - Time-window math (lives in `utils/dateFilter.ts`).
//   - HTTP retry/throttle (lives in `services/http.client.ts`).
//
// Why split it this way? Each module has one reason to change. If NCBI ever
// returns a new XML field, only this file moves. If we add a new category,
// only `categories.config.ts` moves. Etc.
// -----------------------------------------------------------------------------

import { getJson, getText } from './http.client';
import {
  PUBMED_ENDPOINTS,
  getPubmedApiKey,
  getPubmedToolIdentity,
} from '@/config/api.config';
import { parsePubmedXml, textOf, toArray } from '@/utils/xmlParser';
import { parsePubmedDate } from '@/utils/dateFilter';
import { buildSnippet, stripMarkup } from '@/utils/textUtils';
import {
  type Article,
  type ESearchResponse,
  PubmedError,
} from '@/types/article.types';

// -----------------------------------------------------------------------------
// 1. ESearch — find PMIDs matching a query + date range.
// -----------------------------------------------------------------------------

export interface ESearchParams {
  /** Full PubMed query string, e.g., `("Genetics"[MeSH] AND hasabstract[text])`. */
  query: string;
  /** Inclusive lower bound, formatted `YYYY/MM/DD`. */
  minDate: string;
  /** Inclusive upper bound, formatted `YYYY/MM/DD`. */
  maxDate: string;
  /** Page size (PubMed's `retmax`). */
  pageSize: number;
  /** Pagination offset (`retstart`). Defaults to 0. */
  pageOffset?: number;
  /** Abort signal so the UI can cancel a stale request. */
  signal?: AbortSignal;
}

/**
 * Performs an ESearch and returns the array of PMIDs. Each PMID is a numeric
 * string like `"38912345"`. We do NOT decorate the response further; that's
 * the caller's job.
 */
export async function searchPmids(params: ESearchParams): Promise<string[]> {
  const { tool, email } = getPubmedToolIdentity();
  const apiKey = getPubmedApiKey();

  // `datetype=pdat` filters by publication date (the most intuitive choice;
  // alternatives like `edat` filter by Entrez date, which can lag by days).
  const data = await getJson<ESearchResponse>(
    PUBMED_ENDPOINTS.eSearch,
    {
      db: 'pubmed',
      term: params.query,
      mindate: params.minDate,
      maxdate: params.maxDate,
      datetype: 'pdat',
      retmode: 'json',
      retmax: params.pageSize,
      retstart: params.pageOffset ?? 0,
      sort: 'pub_date', // newest first
      tool,
      email,
      api_key: apiKey,
    },
    { signal: params.signal },
  );

  if (!data?.esearchresult) {
    throw new PubmedError('Malformed ESearch response (no esearchresult).');
  }
  return data.esearchresult.idlist ?? [];
}

// -----------------------------------------------------------------------------
// 2. EFetch — pull full XML records for a list of PMIDs.
// -----------------------------------------------------------------------------

/**
 * Fetches and parses full PubMed records for a list of PMIDs. PubMed's
 * EFetch endpoint does not support JSON for PubMed records, so we ask for
 * XML and run it through `fast-xml-parser`.
 *
 * Chunking: PubMed accepts up to 200 IDs per EFetch via GET safely. We
 * batch in groups of 100 to keep URLs comfortable for proxies/CDNs.
 */
export async function fetchArticlesByIds(
  pmids: string[],
  signal?: AbortSignal,
): Promise<Article[]> {
  if (pmids.length === 0) return [];

  const { tool, email } = getPubmedToolIdentity();
  const apiKey = getPubmedApiKey();
  const chunkSize = 100;
  const results: Article[] = [];

  for (let i = 0; i < pmids.length; i += chunkSize) {
    const chunk = pmids.slice(i, i + chunkSize);

    const xml = await getText(
      PUBMED_ENDPOINTS.eFetch,
      {
        db: 'pubmed',
        id: chunk.join(','),
        retmode: 'xml',
        rettype: 'abstract',
        tool,
        email,
        api_key: apiKey,
      },
      { signal },
    );

    const parsed = parsePubmedXml(xml) as PubmedRoot;
    const rawArticles = toArray(parsed?.PubmedArticleSet?.PubmedArticle);
    for (const raw of rawArticles) {
      const normalized = normalizePubmedArticle(raw);
      if (normalized) results.push(normalized);
    }
  }

  return results;
}

// -----------------------------------------------------------------------------
// 3. Normalization — PubMed XML → domain `Article`.
//
// PubMed's XML is verbose and irregular. We pull it apart defensively, using
// `toArray` everywhere a "0, 1, or many" relationship lives, and `textOf` to
// extract string content out of nodes that might be string-or-object.
// -----------------------------------------------------------------------------

interface PubmedRoot {
  PubmedArticleSet?: { PubmedArticle?: PubmedArticleNode | PubmedArticleNode[] };
}

// We type the XML tree as `any`-like records on purpose: this is the boundary
// between an external, untyped data source and our typed domain. Trying to
// pin types here gives a false sense of safety — the runtime shape is what
// matters and `normalizePubmedArticle` validates field-by-field.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PubmedArticleNode = any;

function normalizePubmedArticle(node: PubmedArticleNode): Article | null {
  const medline = node?.MedlineCitation;
  const articleNode = medline?.Article;
  if (!medline || !articleNode) return null;

  // ----- PMID -----
  // `PMID` is `{ '#text': '12345', '@_Version': '1' }` in EFetch XML.
  const pmid = textOf(medline.PMID);
  if (!pmid) return null;

  // ----- Title -----
  // ArticleTitle can be a string or an object with `#text` plus inline tags.
  // `stripMarkup` collapses any embedded <i>/<sub>/<sup> formatting.
  const title = stripMarkup(textOf(articleNode.ArticleTitle));

  // ----- Authors -----
  // PubMed wraps authors in `<AuthorList><Author>…</Author></AuthorList>`.
  // Each Author can have ForeName + LastName + Initials, OR a CollectiveName
  // (for consortia). We prefer "LastName Initials" because that's the PubMed
  // display convention.
  const authorsRaw = toArray(articleNode.AuthorList?.Author);
  const authors = authorsRaw
    .map((a: PubmedArticleNode) => {
      if (!a) return '';
      const lastName = textOf(a.LastName);
      const initials = textOf(a.Initials);
      if (lastName) return initials ? `${lastName} ${initials}` : lastName;
      return textOf(a.CollectiveName);
    })
    .filter((s: string): s is string => Boolean(s));

  // ----- Journal -----
  const journal = stripMarkup(textOf(articleNode.Journal?.Title));

  // ----- Abstract -----
  // AbstractText can be a single string, a single object, or an array of
  // labeled sections (Background / Methods / Results / Conclusions). When
  // sections are present we join them with double newlines so the snippet
  // builder picks the most informative opening.
  const absParts = toArray(articleNode.Abstract?.AbstractText).map((p) =>
    stripMarkup(textOf(p)),
  );
  const abstract = absParts.join('\n\n').trim();
  const abstractSnippet = buildSnippet(abstract);

  // ----- Publication date -----
  // PubDate lives in `Journal.JournalIssue.PubDate`. It can have Year+Month+
  // Day, Year+Month, Year only, or `MedlineDate` (free-form). We render the
  // "best" string we have, then parse it with `parsePubmedDate`.
  const pubNode = articleNode.Journal?.JournalIssue?.PubDate ?? {};
  const yearStr = textOf(pubNode.Year);
  const monthStr = textOf(pubNode.Month);
  const dayStr = textOf(pubNode.Day);
  const medlineDate = textOf(pubNode.MedlineDate);
  const pubDateRaw =
    [yearStr, monthStr, dayStr].filter(Boolean).join(' ') || medlineDate || '';
  const pubDate = parsePubmedDate(pubDateRaw) ?? new Date(0);

  // ----- DOI -----
  // DOI lives inside `ArticleIdList`, which contains `ArticleId` entries
  // tagged with `IdType` attributes.
  const articleIds = toArray(node?.PubmedData?.ArticleIdList?.ArticleId);
  const doiNode = articleIds.find(
    (a: PubmedArticleNode) => a?.['@_IdType'] === 'doi',
  );
  const doi = doiNode ? textOf(doiNode) : undefined;

  // ----- MeSH terms -----
  // MeshHeading list → each entry has DescriptorName with the term we want.
  const meshTerms = toArray(medline.MeshHeadingList?.MeshHeading)
    .map((mh: PubmedArticleNode) => textOf(mh?.DescriptorName))
    .filter(Boolean);

  return {
    id: pmid,
    title,
    authors,
    journal: journal || undefined,
    pubDate,
    pubDateRaw,
    abstract,
    abstractSnippet,
    doi,
    pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    // `categories` is filled in by the aggregator; default to a placeholder
    // so the type is fully formed at this point.
    categories: ['UNCATEGORIZED'],
    meshTerms,
  };
}
