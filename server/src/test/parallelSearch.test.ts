import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeParallelSearch } from '../search/parallelSearch.js';
import { searchProvider } from '../providers/searchProvider.js';
import type { SearchResult } from '../types/contracts.js';

// Mock the search provider
vi.mock('../providers/searchProvider.js', () => ({
  searchProvider: {
    search: vi.fn(),
  },
}));

describe('Parallel Search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeParallelSearch', () => {
    it('should search all sub-queries in parallel', async () => {
      // Return enough results to avoid fallback supplementation (>= 5)
      const mockResults: SearchResult[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        url: `https://example.com/${i}`,
        title: `Result ${i}`,
        snippet: `Snippet ${i}`,
        domain: 'example.com',
        publishedDate: '2025-10-01',
      }));

      vi.mocked(searchProvider.search).mockResolvedValue(mockResults);

      const subQueries = ['query 1', 'query 2', 'query 3'];
      const results = await executeParallelSearch(subQueries, 'fallback query');

      // Should call search for each sub-query (3 queries, no fallback needed)
      expect(searchProvider.search).toHaveBeenCalledTimes(3);
      
      // Should return results
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle partial failures gracefully', async () => {
      // Return enough results to avoid fallback supplementation
      const mockResults: SearchResult[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        url: `https://example.com/${i}`,
        title: `Result ${i}`,
        snippet: `Snippet ${i}`,
        domain: 'example.com',
        publishedDate: '2025-10-01',
      }));

      // First query succeeds, second fails, third succeeds
      vi.mocked(searchProvider.search)
        .mockResolvedValueOnce(mockResults)
        .mockRejectedValueOnce(new Error('API timeout'))
        .mockResolvedValueOnce(mockResults);

      const subQueries = ['query 1', 'query 2', 'query 3'];
      const results = await executeParallelSearch(subQueries, 'fallback query');

      // Should still return results from successful queries
      expect(results.length).toBeGreaterThan(0);
      // Should call search 3 times (all sub-queries, no fallback needed with enough results)
      expect(searchProvider.search).toHaveBeenCalledTimes(3);
    });

    it('should fallback to original query if all searches fail', async () => {
      const fallbackResults: SearchResult[] = [
        {
          id: 'fallback-1',
          url: 'https://example.com/fallback',
          title: 'Fallback Result',
          snippet: 'Fallback snippet',
          domain: 'example.com',
          publishedDate: '2025-10-01',
        },
      ];

      // All sub-queries fail
      vi.mocked(searchProvider.search)
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error('Error 3'))
        // Fallback query succeeds
        .mockResolvedValueOnce(fallbackResults);

      const subQueries = ['query 1', 'query 2', 'query 3'];
      const results = await executeParallelSearch(subQueries, 'fallback query');

      // Should return fallback results
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('fallback-1');
      expect(searchProvider.search).toHaveBeenCalledTimes(4); // 3 failed + 1 fallback
    });

    it('should deduplicate results by URL', async () => {
      const query1Results: SearchResult[] = [
        {
          id: '1',
          url: 'https://example.com/article',
          title: 'Article',
          snippet: 'Snippet from query 1',
          domain: 'example.com',
          publishedDate: '2025-10-01',
        },
        {
          id: '2',
          url: 'https://other.com/page',
          title: 'Other',
          snippet: 'Other snippet',
          domain: 'other.com',
          publishedDate: '2025-10-01',
        },
        {
          id: '5',
          url: 'https://extra1.com/page',
          title: 'Extra 1',
          snippet: 'Extra snippet 1',
          domain: 'extra1.com',
          publishedDate: '2025-10-01',
        },
      ];

      const query2Results: SearchResult[] = [
        {
          id: '3',
          url: 'https://www.example.com/article', // Same as first, with www
          title: 'Article',
          snippet: 'Snippet from query 2',
          domain: 'example.com',
          publishedDate: '2025-10-01',
        },
        {
          id: '4',
          url: 'https://new.com/article',
          title: 'New Article',
          snippet: 'New snippet',
          domain: 'new.com',
          publishedDate: '2025-10-01',
        },
        {
          id: '6',
          url: 'https://extra2.com/page',
          title: 'Extra 2',
          snippet: 'Extra snippet 2',
          domain: 'extra2.com',
          publishedDate: '2025-10-01',
        },
      ];

      vi.mocked(searchProvider.search)
        .mockResolvedValueOnce(query1Results)
        .mockResolvedValueOnce(query2Results);

      const subQueries = ['query 1', 'query 2'];
      const results = await executeParallelSearch(subQueries, 'fallback query');

      // Should deduplicate (example.com/article appears twice with/without www)
      // Should have 5 unique results (6 total - 1 duplicate = 5)
      expect(results.length).toBe(5);
      
      // Verify deduplication worked - should only have one example.com/article
      const exampleArticles = results.filter(r => 
        r.url.includes('example.com/article')
      );
      expect(exampleArticles).toHaveLength(1);
    });

    it('should handle empty sub-queries array', async () => {
      const fallbackResults: SearchResult[] = [
        {
          id: '1',
          url: 'https://example.com/1',
          title: 'Result',
          snippet: 'Snippet',
          domain: 'example.com',
          publishedDate: '2025-10-01',
        },
      ];

      vi.mocked(searchProvider.search).mockResolvedValue(fallbackResults);

      const results = await executeParallelSearch([], 'fallback query');

      // Should use fallback query
      expect(searchProvider.search).toHaveBeenCalledTimes(1);
      expect(searchProvider.search).toHaveBeenCalledWith('fallback query', { maxResults: 10 });
      expect(results).toEqual(fallbackResults);
    });

    it('should add metadata to results', async () => {
      const mockResults: SearchResult[] = [
        {
          id: '1',
          url: 'https://example.com/1',
          title: 'Result 1',
          snippet: 'Snippet 1',
          domain: 'example.com',
          publishedDate: '2025-10-01',
        },
      ];

      vi.mocked(searchProvider.search).mockResolvedValue(mockResults);

      const subQueries = ['specific query'];
      const results = await executeParallelSearch(subQueries, 'fallback query');

      // Should add metadata tracking source query
      expect(results[0].meta).toBeDefined();
      expect(results[0].meta?.sourceQuery).toBe('specific query');
      expect(results[0].meta?.originalRank).toBe(1);
    });

    it('should supplement with fallback if too few results', async () => {
      const fewResults: SearchResult[] = [
        {
          id: '1',
          url: 'https://example.com/1',
          title: 'Result 1',
          snippet: 'Snippet 1',
          domain: 'example.com',
          publishedDate: '2025-10-01',
        },
      ];

      const fallbackResults: SearchResult[] = [
        {
          id: '2',
          url: 'https://example.com/2',
          title: 'Result 2',
          snippet: 'Snippet 2',
          domain: 'example.com',
          publishedDate: '2025-10-01',
        },
        {
          id: '3',
          url: 'https://example.com/3',
          title: 'Result 3',
          snippet: 'Snippet 3',
          domain: 'example.com',
          publishedDate: '2025-10-01',
        },
      ];

      vi.mocked(searchProvider.search)
        .mockResolvedValueOnce(fewResults)
        .mockResolvedValueOnce(fallbackResults);

      const subQueries = ['narrow query'];
      const results = await executeParallelSearch(subQueries, 'fallback query');

      // Should supplement with fallback query since we got < 5 results
      expect(searchProvider.search).toHaveBeenCalledTimes(2);
      expect(results.length).toBeGreaterThan(1);
    });

    it('should interleave results from multiple queries', async () => {
      const query1Results: SearchResult[] = Array.from({ length: 10 }, (_, i) => ({
        id: `q1-${i}`,
        url: `https://query1.com/${i}`,
        title: `Q1 Result ${i}`,
        snippet: `Snippet ${i}`,
        domain: 'query1.com',
        publishedDate: '2025-10-01',
      }));

      const query2Results: SearchResult[] = Array.from({ length: 10 }, (_, i) => ({
        id: `q2-${i}`,
        url: `https://query2.com/${i}`,
        title: `Q2 Result ${i}`,
        snippet: `Snippet ${i}`,
        domain: 'query2.com',
        publishedDate: '2025-10-01',
      }));

      vi.mocked(searchProvider.search)
        .mockResolvedValueOnce(query1Results)
        .mockResolvedValueOnce(query2Results);

      const subQueries = ['query 1', 'query 2'];
      const results = await executeParallelSearch(subQueries, 'fallback query');

      // Results should be interleaved (not all from query1 then all from query2)
      const sources = results.slice(0, 6).map(r => r.meta?.sourceQuery);
      const query1Count = sources.filter(s => s === 'query 1').length;
      const query2Count = sources.filter(s => s === 'query 2').length;
      
      // Both queries should contribute to top results
      expect(query1Count).toBeGreaterThan(0);
      expect(query2Count).toBeGreaterThan(0);
    });
  });
});

