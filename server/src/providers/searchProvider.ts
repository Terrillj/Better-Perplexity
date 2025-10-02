import { SearchResult } from '../types/contracts.js';
import { searchWithBrave } from './brave.js';

// Interface for search providers
export interface ISearchProvider {
  search(query: string, options?: { maxResults?: number }): Promise<SearchResult[]>;
}

// Factory: returns appropriate provider based on env
function createSearchProvider(): ISearchProvider {
  const mockMode = process.env.MOCK_MODE === '1';

  if (mockMode) {
    return {
      async search(query: string) {
        // Mock results for development
        return [
          {
            id: '1',
            url: 'https://example.edu/article1',
            title: 'Understanding the Query',
            snippet: 'This is a comprehensive guide to understanding your query...',
            domain: 'example.edu',
            publishedDate: '2025-09-15',
          },
          {
            id: '2',
            url: 'https://news.example.com/story',
            title: 'Recent Developments',
            snippet: 'Latest news about the topic you searched for...',
            domain: 'news.example.com',
            publishedDate: '2025-09-28',
          },
          {
            id: '3',
            url: 'https://blog.example.org/post',
            title: 'Deep Dive Analysis',
            snippet: 'An in-depth analysis of the subject matter...',
            domain: 'blog.example.org',
            publishedDate: null,
          },
        ];
      },
    };
  }

  // Use Brave Search if API key is available
  if (process.env.BRAVE_SEARCH_API_KEY) {
    return {
      search: searchWithBrave,
    };
  }

  // TODO: Add SerpAPI fallback
  throw new Error('No search provider configured. Set BRAVE_SEARCH_API_KEY or enable MOCK_MODE=1');
}

// Lazy-load search provider to ensure env vars are loaded
let providerInstance: ISearchProvider | null = null;

export const searchProvider: ISearchProvider = {
  search(query: string, options?: { maxResults?: number }) {
    if (!providerInstance) {
      providerInstance = createSearchProvider();
    }
    return providerInstance.search(query, options);
  },
};

