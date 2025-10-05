import { PageExtract, RankedDoc, SearchResult } from '../types/contracts.js';
import { BM25Scorer } from './bm25.js';

/**
 * Scores and ranks documents based on multiple signals
 * Signals: relevance, recency, sourceQuality, coverage
 */
export function rankDocuments(
  query: string,
  pages: PageExtract[],
  searchResults: SearchResult[]
): RankedDoc[] {
  // Build corpus for BM25 (title + excerpt for each page)
  const documents = pages.map(page => `${page.title} ${page.excerpt}`);
  const bm25 = new BM25Scorer(documents);
  
  const rankedDocs: RankedDoc[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const searchResult = searchResults.find(r => r.url === page.url);
    if (!searchResult) continue;

    // Compute signals
    const bm25Score = bm25.score(query, i);
    
    console.log(`[RELEVANCE] "${page.title.slice(0, 50)}": bm25=${bm25Score.toFixed(2)}`);
    
    const relevance = bm25Score; // Use BM25
    const recency = computeRecency(page.publishedDate || searchResult.publishedDate);
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
      // Use search result date as fallback if page extraction failed
      publishedDate: page.publishedDate || searchResult.publishedDate,
      features: page.features || null,
    });
  }

  // Sort by score descending
  return rankedDocs.sort((a, b) => b.score - a.score);
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

  // Default score for unknown domains
  return 0.5;
}

function computeCoverage(content: string): number {
  // Longer content = better coverage (with diminishing returns)
  const wordCount = content.split(/\s+/).length;
  return Math.min(wordCount / 1000, 1.0);
}

