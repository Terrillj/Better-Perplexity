import { PageExtract, RankedDoc, SearchResult } from '../types/contracts.js';

/**
 * Scores and ranks documents based on multiple signals
 * Signals: relevance, recency, sourceQuality, coverage
 */
export function rankDocuments(
  query: string,
  pages: PageExtract[],
  searchResults: SearchResult[]
): RankedDoc[] {
  const rankedDocs: RankedDoc[] = [];

  for (const page of pages) {
    const searchResult = searchResults.find(r => r.url === page.url);
    if (!searchResult) continue;

    // Compute signals
    const relevance = computeRelevance(query, page);
    const recency = computeRecency(page.publishedDate);
    const sourceQuality = computeSourceQuality(searchResult.domain);
    const coverage = computeCoverage(page.content);

    // Weighted score (adjust weights as needed)
    const score = (
      relevance * 0.5 +
      recency * 0.2 +
      sourceQuality * 0.2 +
      coverage * 0.1
    );

    const reasons = [];
    if (sourceQuality > 0.7) reasons.push('.edu/.gov domain');
    if (recency > 0.7) reasons.push('recent');
    if (relevance > 0.8) reasons.push('highly relevant');

    rankedDocs.push({
      id: searchResult.id,
      url: page.url,
      title: page.title,
      excerpt: page.excerpt,
      score,
      signals: {
        relevance,
        recency,
        sourceQuality,
        coverage,
      },
      rankingReason: reasons.length > 0 ? reasons.join(', ') : 'matched query',
      domain: searchResult.domain,
      publishedDate: page.publishedDate,
    });
  }

  // Sort by score descending
  return rankedDocs.sort((a, b) => b.score - a.score);
}

function computeRelevance(query: string, page: PageExtract): number {
  // TODO: Implement BM25 or TF-IDF scoring
  // For now, simple keyword overlap
  const queryTerms = query.toLowerCase().split(/\s+/);
  const content = (page.title + ' ' + page.excerpt).toLowerCase();

  const matches = queryTerms.filter(term => content.includes(term)).length;
  return Math.min(matches / queryTerms.length, 1.0);
}

function computeRecency(publishedDate: string | null): number {
  if (!publishedDate) return 0.5; // neutral for unknown dates

  try {
    const date = new Date(publishedDate);
    const now = new Date();
    const ageInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    // Decay function: 1.0 for today, 0.5 at 180 days, 0 at 365+ days
    if (ageInDays < 0) return 1.0;
    if (ageInDays > 365) return 0;
    return Math.max(0, 1 - (ageInDays / 365));
  } catch {
    return 0.5;
  }
}

function computeSourceQuality(domain: string): number {
  // Boost .edu, .gov, known quality domains
  if (domain.endsWith('.edu')) return 0.9;
  if (domain.endsWith('.gov')) return 0.9;
  if (domain.endsWith('.org')) return 0.7;

  // TODO: Use domain reputation score or whitelist
  return 0.5;
}

function computeCoverage(content: string): number {
  // Longer content = better coverage (with diminishing returns)
  const wordCount = content.split(/\s+/).length;
  return Math.min(wordCount / 1000, 1.0);
}

