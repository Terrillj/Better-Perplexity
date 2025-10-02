// Placeholder for additional extraction utilities
// TODO: Add metadata extraction (publishedDate, author, type)
// TODO: Add content cleaning and normalization
// TODO: Add fallback extraction for sites that block Readability

export function extractMetadata(html: string, url: string) {
  // Parse Open Graph, JSON-LD, meta tags
  // Return { publishedDate, author, contentType, etc. }
  return {
    publishedDate: null,
    author: null,
    contentType: 'article',
  };
}

