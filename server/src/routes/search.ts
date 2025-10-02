import { Router } from 'express';
import { z } from 'zod';
import { createQueryPlan } from '../planner/plan.js';
import { searchProvider } from '../providers/searchProvider.js';
import { SearchResultSchema } from '../types/contracts.js';

const router = Router();

const QuerySchema = z.object({
  q: z.string().min(1),
});

// GET /api/search?q=<query>
// Returns: { plan: QueryPlan, results: SearchResult[] }
router.get('/', async (req, res) => {
  try {
    const { q } = QuerySchema.parse(req.query);

    // Step 1: Create query plan (2-4 sub-queries)
    const plan = await createQueryPlan(q);

    // Step 2: Search with provider
    // TODO: Execute sub-queries in parallel and merge results
    const results = await searchProvider.search(q);

    // Validate results
    const validatedResults = z.array(SearchResultSchema).parse(results);

    res.json({
      plan,
      results: validatedResults,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(400).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

