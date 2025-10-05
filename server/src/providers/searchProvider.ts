import { SearchResult } from '../types/contracts.js';
import { searchWithBrave } from './brave.js';

// Interface for search providers
export interface ISearchProvider {
  search(query: string, options?: { maxResults?: number }): Promise<SearchResult[]>;
}

// Factory: returns appropriate provider based on env
function createSearchProvider(): ISearchProvider {
  if (process.env.BRAVE_SEARCH_API_KEY) {
    return {
      search: searchWithBrave,
    };
  }

  throw new Error('BRAVE_SEARCH_API_KEY not configured. Add your API key to .env');
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

