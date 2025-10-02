import { Router } from 'express';
import { z } from 'zod';
import { createQueryPlan } from '../planner/plan.js';
import { executeParallelSearch } from '../search/parallelSearch.js';
import { scrapePages } from '../scraper/fetchPage.js';
import { rankDocuments } from '../ranker/rank.js';
import { applyPersonalization } from '../ranker/personalize.js';
import { synthesizeAnswer } from '../llm/synthesize.js';
import { AnswerPacketSchema } from '../types/contracts.js';
import { randomUUID } from 'crypto';

const router = Router();

const AnswerRequestSchema = z.object({
  query: z.string().min(1),
  userId: z.string().optional(),
  plan: z.object({
    subQueries: z.array(z.string()),
  }).optional(),
});

// POST /api/answer
// Body: { query: string, userId?: string, plan?: QueryPlan }
// Returns: AnswerPacket
router.post('/', async (req, res) => {
  try {
    const { query, userId, plan: providedPlan } = AnswerRequestSchema.parse(req.body);
    const queryId = randomUUID();

    // Step 1: Create or use provided plan
    const plan = providedPlan || await createQueryPlan(query);

    // Step 2: Parallel search across all sub-queries
    const searchResults = await executeParallelSearch(plan.subQueries, query);

    // Step 3: Scrape top 15 results (more diverse sources from parallel search)
    const topUrls = searchResults.slice(0, 15).map(r => r.url);
    const scrapeStart = Date.now();
    const pages = await scrapePages(topUrls);
    const scrapeElapsed = ((Date.now() - scrapeStart) / 1000).toFixed(1);
    console.log(`[SCRAPE] ${pages.length}/${topUrls.length} pages scraped successfully in ${scrapeElapsed}s`);

    // Step 4: Rank documents
    let rankedDocs = rankDocuments(query, pages, searchResults);

    // Step 5: Apply personalization
    if (userId) {
      rankedDocs = applyPersonalization(userId, rankedDocs);
    }

    // Step 6: Synthesize answer
    const answerPacket = await synthesizeAnswer(query, rankedDocs.slice(0, 8), queryId);

    // Validate output
    const validated = AnswerPacketSchema.parse(answerPacket);

    res.json(validated);
  } catch (error) {
    console.error('Answer error:', error);
    res.status(400).json({
      error: 'Answer generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

