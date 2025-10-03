import { z } from 'zod';

// Mirror of server contracts with zod validation

export const SearchResultSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string(),
  snippet: z.string(),
  domain: z.string(),
  publishedDate: z.string().nullable(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

export const ContentFeaturesSchema = z.object({
  depth: z.enum(['introductory', 'intermediate', 'expert']),
  style: z.enum(['academic', 'technical', 'journalistic', 'conversational']),
  format: z.enum(['tutorial', 'research', 'opinion', 'reference']),
  approach: z.enum(['conceptual', 'practical', 'data-driven']),
  density: z.enum(['concise', 'moderate', 'comprehensive']),
});
export type ContentFeatures = z.infer<typeof ContentFeaturesSchema>;

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
  features: ContentFeaturesSchema.nullable(),
});
export type RankedDoc = z.infer<typeof RankedDocSchema>;

export const QueryPlanSchema = z.object({
  originalQuery: z.string(),
  subQueries: z.array(z.string()),
  strategy: z.string().optional(),
});
export type QueryPlan = z.infer<typeof QueryPlanSchema>;

export const CitationSchema = z.object({
  index: z.number(),
  sourceId: z.string(),
  passage: z.string(),
});
export type Citation = z.infer<typeof CitationSchema>;

export const AnswerPacketSchema = z.object({
  text: z.string(),
  citations: z.array(CitationSchema),
  sources: z.array(RankedDocSchema),
  queryId: z.string(),
});
export type AnswerPacket = z.infer<typeof AnswerPacketSchema>;

export const UserEventSchema = z.object({
  userId: z.string(),
  timestamp: z.number(),
  eventType: z.enum(['SOURCE_CLICKED', 'CITATION_HOVERED', 'SOURCE_EXPANDED', 'ANSWER_SAVED']),
  sourceId: z.string().optional(),
  queryId: z.string().optional(),
  meta: z.record(z.any()).optional(),
});
export type UserEvent = z.infer<typeof UserEventSchema>;

export const UserPreferencesSchema = z.object({
  topArms: z.array(
    z.object({
      arm: z.string(),
      score: z.number(),
    })
  ),
  totalInteractions: z.number(),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

