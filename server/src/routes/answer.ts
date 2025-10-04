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
// Returns: Server-Sent Events stream with answer chunks and final packet
router.post('/', async (req, res) => {
  try {
    const { query, userId, plan: providedPlan } = AnswerRequestSchema.parse(req.body);
    const queryId = randomUUID();

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Step 1: Create or use provided plan
    res.write(`data: ${JSON.stringify({ type: 'progress', data: { stage: 'planning', message: 'Creating search strategy' } })}\n\n`);
    const plan = providedPlan || await createQueryPlan(query);

    // Step 2: Parallel search across all sub-queries
    res.write(`data: ${JSON.stringify({ type: 'progress', data: { stage: 'searching', message: 'Gathering sources from multiple providers' } })}\n\n`);
    const searchResults = await executeParallelSearch(plan.subQueries, query);

    // Step 3: Scrape top 15 results (more diverse sources from parallel search)
    const topUrls = searchResults.slice(0, 15).map(r => r.url);
    const scrapeStart = Date.now();
    const pages = await scrapePages(topUrls);
    const scrapeElapsed = ((Date.now() - scrapeStart) / 1000).toFixed(1);
    console.log(`[SCRAPE] ${pages.length}/${topUrls.length} pages scraped successfully in ${scrapeElapsed}s`);

    // Step 4: Rank documents
    res.write(`data: ${JSON.stringify({ type: 'progress', data: { stage: 'analyzing', message: 'Ranking and personalizing results' } })}\n\n`);
    let rankedDocs = rankDocuments(query, pages, searchResults);
    console.log(`[FEATURES] Top doc features:`, rankedDocs[0]?.features);

    // Step 5: Apply personalization
    if (userId) {
      rankedDocs = applyPersonalization(userId, rankedDocs);
    }

    // Step 6: Synthesize answer with streaming
    res.write(`data: ${JSON.stringify({ type: 'progress', data: { stage: 'synthesizing', message: 'Generating comprehensive answer' } })}\n\n`);
    const answerPacket = await synthesizeAnswer(
      query,
      rankedDocs.slice(0, 8),
      queryId,
      (chunk: string) => {
        // Send each chunk as SSE event
        res.write(`data: ${JSON.stringify({ type: 'chunk', data: chunk })}\n\n`);
      }
    );

    // Validate output
    const validated = AnswerPacketSchema.parse(answerPacket);

    // Send final complete event with full answer packet
    res.write(`data: ${JSON.stringify({ type: 'complete', data: validated })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Answer error:', error);
    
    // Send error event in SSE format
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      data: { 
        error: 'Answer generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    })}\n\n`);
    res.end();
  }
});

export default router;

