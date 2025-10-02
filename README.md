# Better-Perplexity

A transparent search assistant that answers questions with cited sources and adaptive personalization.

## Key Features

- **Transparent Search**: See why each source was chosen and how sub-queries were planned
- **Adaptive Personalization**: Learns from your interactions to personalize rankings
- **Verifiable Citations**: Every claim links to specific source passages
- **Rule-Based Reweighting**: Domain preferences, recency preferences, content-type preferences

## Quick Start

### Prerequisites

- Node 20+
- pnpm 8+
- Brave Search API key (or set `MOCK_MODE=1`)
- OpenAI API key (or set `MOCK_MODE=1`)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables (see ENV_SETUP.md)
cp .env-example .env
# Edit .env with your API keys

# Start dev servers (web:5173, server:3001)
pnpm dev
```

### Development

```bash
# Type check
pnpm typecheck

# Run tests
pnpm test

# Lint
pnpm lint
```

## Architecture

```
/web        # React + Vite + TypeScript frontend
/server     # Express + TypeScript backend
/docs       # Documentation
```

### Core Pipeline

Query → Plan sub-queries (LLM) → **Parallel search** across all queries → Merge & dedupe → Concurrent scrape → Multi-signal ranking → Personalization → Synthesize answer with citations (LLM)

**Status:** Fully functional end-to-end (~12-17 seconds)

### Personalization

1. **Event Logging**: Tracks user interactions (clicks, hovers, expansions)
2. **Rule-Based Reweighting**: Boosts preferred domains, recency, content types
3. **Cold Start**: Uses global defaults until ≥10 interactions

## Tech Stack

**Frontend**
- React 18, TypeScript, Vite
- TanStack Query for data fetching
- Tailwind CSS for styling
- Zod for validation

**Backend**
- Node.js, Express, TypeScript
- Cheerio + Mozilla Readability for scraping
- Brave Search API
- SQLite for event storage (TODO)
- Zod for validation

## Milestones

- [x] **M1: Scaffold** - Monorepo setup, health check endpoints
- [x] **M2: Core Pipeline** - Query planner → parallel search → scrape → rank → synthesize
- [~] **M3: Personalization** - Event logging, rule-based reweighting (in progress)
- [ ] **M4: Polish** - Demo script, test queries, documentation

## What's Implemented

✅ Monorepo with pnpm workspaces  
✅ Server with Express + TypeScript  
✅ Search provider interface (Brave + mock)  
✅ **Query planner with LLM decomposition (1-5 sub-queries)**  
✅ **Parallel search execution with intelligent merging**  
✅ **Deduplication & interleaved result diversity**  
✅ Concurrent scraper with Readability  
✅ Multi-signal ranker (relevance, recency, quality, coverage)  
✅ Personalization scaffolding (event logging + reweighting hooks)  
✅ **Answer synthesis with enforced inline citations**  
✅ Web app with React + TanStack Query  
✅ Search box, answer display, source cards  
✅ Plan chips, metrics bar  
✅ Zod validation throughout  
✅ Comprehensive test coverage

## What's Next (TODOs)

See individual README files in `/web` and `/server` for detailed TODOs.

**Critical Path:**
1. ~~Implement LLM integration for synthesis~~ ✅
2. ~~Implement query planner with LLM~~ ✅
3. ~~Implement parallel search across sub-queries~~ ✅
4. Test full pipeline end-to-end with real APIs
5. Replace in-memory event store with SQLite
6. Add citation click handlers in UI
7. Polish UI interactions and loading states
8. Create demo script and validate test queries

## Demo

See `docs/DEMO_SCRIPT.md` for a 60-second demo flow.

## Documentation

- `docs/PROJECT_BLUEPRINT.md` - Full project specification
- `docs/DEMO_SCRIPT.md` - Demo walkthrough
- `ENV_SETUP.md` - Environment configuration
- `web/README.md` - Frontend documentation
- `server/README.md` - Backend documentation

## License

MIT
