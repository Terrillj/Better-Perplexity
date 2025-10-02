import { SearchResult } from '../types/contracts.js';
import { createHash } from 'crypto';

// Brave Search API wrapper
// Docs: https://api.search.brave.com/app/documentation/web-search/get-started

interface BraveSearchResponse {
  web?: {
    results: Array<{
      title: string;
      url: string;
      description: string;
      age?: string;
    }>;
  };
}

export async function searchWithBrave(
  query: string,
  options: { maxResults?: number } = {}
): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    throw new Error('BRAVE_SEARCH_API_KEY not configured');
  }

  const count = options.maxResults || 10;
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status} ${response.statusText}`);
    }

    const data: BraveSearchResponse = await response.json();

    if (!data.web?.results) {
      return [];
    }

    // Normalize to SearchResult schema
    return data.web.results.map((result) => {
      const domain = new URL(result.url).hostname;
      // Generate unique ID from URL hash to avoid duplicates across parallel searches
      const urlHash = createHash('md5').update(result.url).digest('hex').substring(0, 8);
      return {
        id: `brave-${urlHash}`,
        url: result.url,
        title: result.title,
        snippet: result.description,
        domain,
        publishedDate: result.age || null, // TODO: Parse age into ISO date
      };
    });
  } catch (error) {
    console.error('Brave search error:', error);
    throw error;
  }
}

