import { JSDOM, VirtualConsole } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { PageExtract } from '../types/contracts.js';
import { extractPublishedDate } from './metaExtractor.js';

const FETCH_TIMEOUT = 8000; // 8 seconds

// Suppress JSDOM CSS parser warnings (noisy with modern CSS like Tailwind)
const virtualConsole = new VirtualConsole();
virtualConsole.on('error', () => {}); // Suppress CSS parsing errors
virtualConsole.on('warn', () => {}); // Suppress CSS warnings

/**
 * Fetches and extracts readable content from a URL
 */
export async function fetchPage(url: string): Promise<PageExtract | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BetterPerplexity/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      console.warn(`Skipping non-HTML content: ${url}`);
      return null;
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url, virtualConsole });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      console.warn(`Readability failed for: ${url}`);
      return null;
    }

    const metaDate = extractPublishedDate(dom);

    return {
      url,
      title: article.title,
      content: article.textContent,
      excerpt: article.excerpt,
      publishedDate: metaDate, // Meta tags take priority
    };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

/**
 * Scrapes multiple pages concurrently
 */
export async function scrapePages(urls: string[]): Promise<PageExtract[]> {
  const results = await Promise.all(urls.map(url => fetchPage(url)));
  return results.filter((page): page is PageExtract => page !== null);
}

