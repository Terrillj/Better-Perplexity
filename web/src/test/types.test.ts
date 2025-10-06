import { describe, it, expect } from 'vitest';
import { SearchResultSchema, RankedDocSchema } from '../features/search/types';

describe('Zod Schema Validation', () => {
  it('validates SearchResult schema correctly', () => {
    const validResult = {
      id: '1',
      url: 'https://example.com',
      title: 'Test',
      snippet: 'Test snippet',
      domain: 'example.com',
      publishedDate: '2025-01-01',
    };

    const result = SearchResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
  });

  it('rejects invalid SearchResult', () => {
    const invalidResult = {
      id: '1',
      url: 'not-a-url',
      title: 'Test',
    };

    const result = SearchResultSchema.safeParse(invalidResult);
    expect(result.success).toBe(false);
  });

  it('validates RankedDoc schema correctly', () => {
    const validDoc = {
      id: '1',
      url: 'https://example.com',
      title: 'Test',
      excerpt: 'Excerpt',
      score: 0.85,
      signals: {
        relevance: 0.9,
        recency: 0.8,
        sourceQuality: 0.7,
      },
      rankingReason: 'High score',
      domain: 'example.com',
      publishedDate: null,
      features: null,
    };

    const result = RankedDocSchema.safeParse(validDoc);
    expect(result.success).toBe(true);
  });
});

