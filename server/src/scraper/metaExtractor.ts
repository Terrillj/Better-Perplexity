import { JSDOM } from 'jsdom';

/**
 * Extracts publication date from common meta tags
 */
export function extractPublishedDate(dom: JSDOM): string | null {
  const doc = dom.window.document;
  
  // Check common meta tag patterns
  const selectors = [
    { tag: 'meta[property="article:published_time"]', attr: 'content' },
    { tag: 'meta[name="publish-date"]', attr: 'content' },
    { tag: 'meta[name="date"]', attr: 'content' },
    { tag: 'meta[name="published"]', attr: 'content' },
    { tag: 'time[datetime]', attr: 'datetime' },
    { tag: 'meta[property="og:published_time"]', attr: 'content' },
  ];
  
  for (const { tag, attr } of selectors) {
    const elem = doc.querySelector(tag);
    const dateStr = elem?.getAttribute(attr);
    if (dateStr) {
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]; // YYYY-MM-DD
        }
      } catch {
        continue;
      }
    }
  }
  
  return null;
}

