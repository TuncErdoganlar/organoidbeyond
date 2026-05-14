// src/config/pubmedTopicQuery.ts
// -----------------------------------------------------------------------------
// AND-clauses appended to DEFAULT_QUERY when the user selects a topic before
// ESearch — so PubMed returns papers relevant to that theme, not a generic MB
// list filtered only in the UI.
//
// Fragments combine MeSH (where sensible) with [tiab] title/abstract terms so we
// still catch recent literature before MeSH indexing completes.
// -----------------------------------------------------------------------------

import type { Category } from '@/types/article.types';

/** Maps each selectable topic (except GENERAL_MB) to a PubMed boolean subquery. */
export const TOPIC_PUBMED_AND_CLAUSE: Record<Exclude<Category, 'GENERAL_MB'>, string> = {
  ORGANOID:
    '("Organoids"[MeSH Terms] OR organoid*[tiab] OR spheroid*[tiab] OR gastruloid*[tiab] OR assembloid*[tiab])',

  STEM_CELLS:
    '("Stem Cells"[MeSH Terms] OR "Hematopoietic Stem Cells"[MeSH Terms] OR hematopoietic stem*[tiab] OR pluripotenc*[tiab] OR mesenchymal stem*[tiab] OR progenitor cell*[tiab])',

  CANCER:
    '("Neoplasms"[MeSH Terms] OR carcinom*[tiab] OR tumour*[tiab] OR tumor*[tiab] OR metastas*[tiab] OR lymphoma*[tiab] OR leukemi*[tiab] OR malignant[tiab] OR oncology[tiab])',

  CRISPR:
    '(CRISPR[tiab] OR Cas9[tiab] OR Cas12*[tiab] OR "Clustered Regularly Interspaced Short Palindromic Repeats"[tiab] OR gene editing[tiab] OR base editing[tiab] OR sgRNA[tiab])',

  EPIGENETICS:
    '("Epigenomics"[MeSH Terms] OR epigenetic*[tiab] OR "DNA Methylation"[MeSH Terms] OR chromatin[tiab] OR histone[tiab])',

  GENE_THERAPY:
    '("Genetic Therapy"[MeSH Terms] OR gene therap*[tiab] OR lentivirus[tiab] OR lentiviral[tiab] OR AAV[tiab] OR adeno-associated[tiab] OR viral vector*[tiab] OR CAR-T cell*[tiab])',

  SINGLE_CELL_OMICS:
    '("Single-Cell Analysis"[MeSH Terms] OR single cell[tiab] OR single-cell[tiab] OR scRNA-seq[tiab] OR snRNA-seq[tiab] OR transcriptomic*[tiab] OR spatial transcriptom*[tiab] OR multi-omic*[tiab] OR genome-wide[tiab])',

  IMMUNOLOGY:
    '(cytokine*[tiab] OR interferon*[tiab] OR interleukin*[tiab] OR lymphocyte*[tiab] OR T cell*[tiab] OR B cell*[tiab] OR macrophage*[tiab] OR immunotherapy[tiab] OR immune checkpoint*[tiab] OR antigen*[tiab] OR vaccine*[tiab] OR monoclonal antibod*[tiab])',
};

/**
 * Returns the full ESearch query string for the user's base query + optional topic.
 * `topic === null`, `topic === GENERAL_MB`, or undefined → base query unchanged.
 */
export function composePubMedQuery(
  baseQuery: string,
  topic: Category | null | undefined,
): string {
  const t = topic ?? null;
  if (t === null || t === 'GENERAL_MB') {
    return baseQuery;
  }
  const facet = TOPIC_PUBMED_AND_CLAUSE[t];
  return `(${baseQuery}) AND (${facet})`;
}
