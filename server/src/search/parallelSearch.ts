import { SearchResult } from '../types/contracts.js';
import { searchProvider } from '../providers/searchProvider.js';

const MAX_CONCURRENT_SEARCHES = 5;
const SEARCH_TIMEOUT_MS = 15000;
const MAX_RESULTS_PER_QUERY = 10;

/**
 * Execute parallel searches across all sub-queries
 * @param subQueries Array of search queries to execute
 * @param fallbackQuery Original query to use if all searches fail
 * @returns Merged and deduplicated search results
 */
export async function executeParallelSearch(
  subQueries: string[],
  fallbackQuery: string
): Promise<SearchResult[]> {
  const startTime = Date.now();

  if (subQueries.length === 0) {
    console.log('[SEARCH] No sub-queries provided, using fallback query');
    return searchProvider.search(fallbackQuery, { maxResults: MAX_RESULTS_PER_QUERY });
  }

  // Batch queries if we have more than MAX_CONCURRENT_SEARCHES
  const batches = batchQueries(subQueries, MAX_CONCURRENT_SEARCHES);
  const allResults: SearchResult[][] = [];

  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map((query, idx) => searchWithTimeout(query, idx))
    );

    const successfulResults: SearchResult[][] = [];
    const failedQueries: { query: string; error: string }[] = [];

    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value);
      } else {
        failedQueries.push({
          query: batch[idx],
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    allResults.push(...successfulResults);

    if (failedQueries.length > 0) {
      console.warn(
        `⚠️  ${failedQueries.length}/${batch.length} searches failed:`,
        failedQueries.map((q) => q.error)
      );
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[SEARCH] Executed ${subQueries.length} parallel searches in ${elapsed}s`);

  // If all searches failed, fallback to original query
  if (allResults.length === 0) {
    console.warn('[SEARCH] All sub-queries failed, falling back to original query');
    return searchProvider.search(fallbackQuery, { maxResults: MAX_RESULTS_PER_QUERY });
  }

  // Merge and deduplicate results
  const merged = mergeSearchResults(allResults);

  const totalResults = allResults.reduce((sum, results) => sum + results.length, 0);
  console.log(
    `[MERGE] ${totalResults} results → ${merged.length} unique → ${Math.min(merged.length, 20)} selected`
  );

  // Filter Wikipedia sources due to academic/professional stigma
  // Wikipedia is valuable but often seen as insufficiently authoritative
  // In production, this could be a user preference setting
  const filtered = filterWikipediaSources(merged);
  const removedCount = merged.length - filtered.length;
  
  if (removedCount > 0) {
    console.log(`[FILTER] Removed ${removedCount} Wikipedia sources`);
  }

  // Use filtered results only if we still have enough sources (≥5)
  // Otherwise, keep original results to ensure sufficient coverage
  const finalResults = filtered.length >= 5 ? filtered : merged;

  if (filtered.length < 5 && removedCount > 0) {
    console.log('[FILTER] Skipping Wikipedia filter due to insufficient remaining sources');
  }

  // If we have very few results, supplement with fallback query
  if (finalResults.length < 5) {
    console.log('[SEARCH] Few results, supplementing with fallback query');
    const fallbackResults = await searchProvider.search(fallbackQuery, {
      maxResults: MAX_RESULTS_PER_QUERY,
    });
    return mergeSearchResults([finalResults, fallbackResults]).slice(0, 20);
  }

  // Return top 20 results
  return finalResults.slice(0, 20);
}

/**
 * Search with timeout wrapper
 */
async function searchWithTimeout(
  query: string,
  queryIndex: number
): Promise<SearchResult[]> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Search timeout')), SEARCH_TIMEOUT_MS);
  });

  const searchPromise = searchProvider.search(query, { maxResults: MAX_RESULTS_PER_QUERY });

  const results = await Promise.race([searchPromise, timeoutPromise]);

  // Add metadata to track which query found each result
  return results.map((result, idx) => ({
    ...result,
    meta: {
      sourceQuery: query,
      originalRank: idx + 1,
    },
  }));
}

/**
 * Merge search results from multiple queries with deduplication and interleaving
 */
function mergeSearchResults(resultsByQuery: SearchResult[][]): SearchResult[] {
  if (resultsByQuery.length === 0) return [];
  if (resultsByQuery.length === 1) return resultsByQuery[0];

  // Step 1: Deduplicate within each query result set
  const dedupedByQuery = resultsByQuery.map(deduplicateByUrl);

  // Step 2: Interleave results to ensure diversity
  const interleaved = interleaveResults(dedupedByQuery);

  // Step 3: Final deduplication across all results
  return deduplicateByUrl(interleaved);
}

/**
 * Deduplicate results by URL
 * If same URL appears multiple times, keep first occurrence and merge snippets
 */
function deduplicateByUrl(results: SearchResult[]): SearchResult[] {
  const seenUrls = new Map<string, SearchResult>();

  for (const result of results) {
    const normalizedUrl = normalizeUrl(result.url);

    if (seenUrls.has(normalizedUrl)) {
      // URL already seen, merge snippets
      const existing = seenUrls.get(normalizedUrl)!;
      existing.snippet = mergeSnippets(existing.snippet, result.snippet);
    } else {
      // New URL, add to map
      seenUrls.set(normalizedUrl, { ...result });
    }
  }

  return Array.from(seenUrls.values());
}

/**
 * Normalize URL for deduplication
 * - Remove protocol differences (http vs https)
 * - Remove trailing slashes
 * - Remove www. prefix
 * - Lowercase
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    let hostname = parsed.hostname.toLowerCase();
    
    // Remove www. prefix
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    
    // Normalize path (remove trailing slash)
    let path = parsed.pathname;
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1);
    }
    
    return `${hostname}${path}${parsed.search}`;
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Merge two snippets with a separator
 */
function mergeSnippets(snippet1: string, snippet2: string): string {
  // Avoid duplicate content
  if (snippet1.includes(snippet2) || snippet2.includes(snippet1)) {
    return snippet1.length > snippet2.length ? snippet1 : snippet2;
  }
  
  // Merge with separator
  const merged = `${snippet1.trim()} | ${snippet2.trim()}`;
  
  // Truncate if too long (max 500 chars)
  return merged.length > 500 ? merged.slice(0, 497) + '...' : merged;
}

/**
 * Interleave results from multiple queries using round-robin
 * Takes top 3 from query 1, top 3 from query 2, etc.
 * Then continues round-robin for remaining results
 */
function interleaveResults(resultsByQuery: SearchResult[][]): SearchResult[] {
  const interleaved: SearchResult[] = [];
  const maxRounds = Math.max(...resultsByQuery.map((r) => r.length));

  // Distribution: Take top 3 from first queries, then 2 from remaining
  const takePerRound = (round: number, queryIdx: number) => {
    if (round === 0 && queryIdx < 2) return 3; // Top 3 from first 2 queries
    if (round === 0) return 2; // Top 2 from other queries
    return 1; // Then 1 at a time
  };

  for (let round = 0; round < maxRounds; round++) {
    for (let queryIdx = 0; queryIdx < resultsByQuery.length; queryIdx++) {
      const results = resultsByQuery[queryIdx];
      const startIdx = getPreviousTakeCount(round, queryIdx, takePerRound);
      const takeCount = takePerRound(round, queryIdx);
      
      for (let i = 0; i < takeCount && startIdx + i < results.length; i++) {
        interleaved.push(results[startIdx + i]);
      }
    }
  }

  return interleaved;
}

/**
 * Calculate how many results were taken from a query in previous rounds
 */
function getPreviousTakeCount(
  currentRound: number,
  queryIdx: number,
  takePerRound: (round: number, qIdx: number) => number
): number {
  let total = 0;
  for (let round = 0; round < currentRound; round++) {
    total += takePerRound(round, queryIdx);
  }
  return total;
}

/**
 * Batch queries to respect concurrency limits
 */
function batchQueries(queries: string[], batchSize: number): string[][] {
  const batches: string[][] = [];
  for (let i = 0; i < queries.length; i += batchSize) {
    batches.push(queries.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Filter out Wikipedia sources from search results
 * Removes all wikipedia.org and wikimedia.org domains (all language variants)
 * @param results Search results to filter
 * @returns Filtered results without Wikipedia sources
 */
function filterWikipediaSources(results: SearchResult[]): SearchResult[] {
  return results.filter((result) => {
    try {
      const url = new URL(result.url);
      const hostname = url.hostname.toLowerCase();
      
      // Filter out all Wikipedia and Wikimedia domains
      // This covers en.wikipedia.org, es.wikipedia.org, fr.wikipedia.org, etc.
      const isWikipedia = hostname.includes('wikipedia.org') || hostname.includes('wikimedia.org');
      
      return !isWikipedia;
    } catch {
      // If URL parsing fails, keep the result
      return true;
    }
  });
}

