import { z } from 'zod';

// Search result from provider (normalized)
export const SearchResultSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string(),
  snippet: z.string(),
  domain: z.string(),
  publishedDate: z.string().nullable(),
  meta: z.object({
    sourceQuery: z.string().optional(),      // Which sub-query found this
    originalRank: z.number().optional(),      // Original position in search results
  }).optional(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

// Scraped page content
export const PageExtractSchema = z.object({
  url: z.string(),
  title: z.string(),
  content: z.string(),
  excerpt: z.string(),
  publishedDate: z.string().nullable(),
});
export type PageExtract = z.infer<typeof PageExtractSchema>;

// Ranked document with scoring signals
export const RankedDocSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  excerpt: z.string(),
  score: z.number(),
  signals: z.object({
    relevance: z.number(),
    recency: z.number(),
    sourceQuality: z.number(),
    coverage: z.number().optional(),
  }),
  rankingReason: z.string(),
  domain: z.string(),
  publishedDate: z.string().nullable(),
});
export type RankedDoc = z.infer<typeof RankedDocSchema>;

// Query plan with sub-queries
export const QueryPlanSchema = z.object({
  originalQuery: z.string(),
  subQueries: z.array(z.string()).min(1).max(5),
  strategy: z.string().optional(),
});
export type QueryPlan = z.infer<typeof QueryPlanSchema>;

// Citation in answer
export const CitationSchema = z.object({
  index: z.number(),
  sourceId: z.string(),
  passage: z.string(),
});
export type Citation = z.infer<typeof CitationSchema>;

// Final answer packet
export const AnswerPacketSchema = z.object({
  text: z.string(),
  citations: z.array(CitationSchema),
  sources: z.array(RankedDocSchema),
  queryId: z.string(),
});
export type AnswerPacket = z.infer<typeof AnswerPacketSchema>;

// User interaction event
export const UserEventSchema = z.object({
  userId: z.string(),
  timestamp: z.number(),
  eventType: z.enum(['SOURCE_CLICKED', 'CITATION_HOVERED', 'SOURCE_EXPANDED', 'ANSWER_SAVED']),
  sourceId: z.string().optional(),
  queryId: z.string().optional(),
  meta: z.record(z.any()).optional(),
});
export type UserEvent = z.infer<typeof UserEventSchema>;

