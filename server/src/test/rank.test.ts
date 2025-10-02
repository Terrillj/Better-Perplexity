import { describe, it, expect } from 'vitest';
import { rankDocuments } from '../ranker/rank';
import type { PageExtract, SearchResult } from '../types/contracts';

describe('rankDocuments', () => {
  it('ranks documents by relevance and signals', () => {
    const query = 'machine learning';

    const pages: PageExtract[] = [
      {
        url: 'https://example.edu/ml',
        title: 'Machine Learning Basics',
        content: 'Machine learning is a subset of artificial intelligence...',
        excerpt: 'Introduction to machine learning',
        publishedDate: '2025-09-01',
      },
      {
        url: 'https://blog.example.com/ml',
        title: 'ML Blog Post',
        content: 'Some content about machine learning',
        excerpt: 'A blog post',
        publishedDate: '2020-01-01',
      },
    ];

    const searchResults: SearchResult[] = [
      {
        id: '1',
        url: 'https://example.edu/ml',
        title: 'Machine Learning Basics',
        snippet: 'Introduction',
        domain: 'example.edu',
        publishedDate: '2025-09-01',
      },
      {
        id: '2',
        url: 'https://blog.example.com/ml',
        title: 'ML Blog Post',
        snippet: 'Blog',
        domain: 'blog.example.com',
        publishedDate: '2020-01-01',
      },
    ];

    const ranked = rankDocuments(query, pages, searchResults);

    expect(ranked).toHaveLength(2);
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    expect(ranked[0].domain).toBe('example.edu'); // .edu should rank higher
  });
});

