# Server

Express backend for Better-Perplexity with TypeScript, search providers, scraping, ranking, and personalization.

## Structure

```
src/
  routes/         # API endpoints (search, answer, events)
  providers/      # Search providers (Brave, mock)
  scraper/        # Web scraping with Readability
  ranker/         # Document ranking + personalization
  planner/        # Query planning (sub-query generation)
  llm/            # LLM integration and synthesis
  events/         # Event logging and preference computation
  types/          # Zod schemas and contracts
```

## Development

```bash
# Install dependencies
pnpm install

# Run dev server (port 3001)
pnpm dev

# Type check
pnpm typecheck

# Run tests
pnpm test
```

## Environment

Copy `.env.example` to `.env` and configure:

- `BRAVE_SEARCH_API_KEY` - Brave Search API key
- `OPENAI_API_KEY` - OpenAI API key for LLM synthesis
- `MOCK_MODE=1` - Use mock data for development

## What's Next

### High Priority

- [ ] **Implement LLM integration** (`llm/llm.ts`, `llm/synthesize.ts`)
  - Add OpenAI API client
  - Implement structured output parsing with zod
  - Add citation validation post-generation

- [ ] **Implement real query planner** (`planner/plan.ts`)
  - Add LLM-based decomposition with few-shot prompts
  - Validate max 4 sub-queries
  - Add fallback to single query for narrow inputs

- [ ] **Enhance search provider** (`routes/search.ts`)
  - Execute sub-queries in parallel
  - Merge and deduplicate results

- [ ] **Replace event store with SQLite** (`events/store.ts`)
  - Create schema with proper indexes
  - Implement cleanup for old events (>30 days)
  - Add actual preference computation logic

### Medium Priority

- [ ] **Enhance ranker** (`ranker/rank.ts`)
  - Implement BM25 or TF-IDF for relevance scoring
  - Add proper deduplication (near-match detection)
  - Tune signal weights

- [ ] **Improve personalization** (`ranker/personalize.ts`)
  - Implement actual TLD preference computation from events
  - Add content-type tracking and boosting
  - Add cold-start handling (global defaults)

- [ ] **Add metadata extraction** (`scraper/extractReadable.ts`)
  - Parse Open Graph, JSON-LD, meta tags
  - Extract publishedDate, author, contentType
  - Add fallback extraction for sites that block Readability

- [ ] **Add SerpAPI fallback** (`providers/`)
  - Implement alternative search provider
  - Add provider selection logic

### Low Priority

- [ ] Add caching layer (SQLite or Redis)
- [ ] Add rate limiting
- [ ] Add comprehensive error handling
- [ ] Add logging and monitoring
- [ ] Add API authentication

