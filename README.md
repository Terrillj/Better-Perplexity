# Better-Perplexity

A transparent search assistant that answers questions with cited sources and adaptive personalization.

## 🚀 For Evaluators

**Get running in < 5 minutes:**

```bash
# 1. Clone the repository
git clone <repo-url>
cd Better-Perplexity

# 2. Copy environment template
cp .env.example .env

# 3. Add your OpenAI API key to .env
# Get key at: https://platform.openai.com/api-keys
# (Brave Search API key already provided for testing)

# 4. Install dependencies
pnpm install
# Or use npm: npm install

# 5. Start both servers
pnpm dev
# Server runs on http://localhost:3001
# Web runs on http://localhost:5173

# 6. Open browser
open http://localhost:5173
```

**Quick Test:**
1. Enter: "What are the latest developments in quantum computing?"
2. Watch 2-4 sub-query chips appear
3. See sources populate with ranking badges
4. Answer appears with inline citations `[1] [2] [3]`
5. Click 3-4 `.edu` sources, then try another query → observe personalization

**Need help?** See [`TESTING.md`](TESTING.md) for detailed test scenarios and troubleshooting.

**Cost:** ~$0.20 for 20 test queries (OpenAI GPT-4 Turbo). Brave Search is free.

---

## Key Features

- **Transparent Search**: See why each source was chosen and how sub-queries were planned
- **Adaptive Personalization**: Learns from your interactions to personalize rankings
- **Verifiable Citations**: Every claim links to specific source passages
- **Rule-Based Reweighting**: Domain preferences, recency preferences, content-type preferences

## Quick Start

### Prerequisites

- Node 20+
- pnpm 8+
- Brave Search API key
- OpenAI API key

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

## Troubleshooting

### Port 3001 already in use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in .env
PORT=3002
```

### OpenAI API Error
**Error:** `Invalid OpenAI API key` or `Insufficient quota`

**Solutions:**
- Check key validity at https://platform.openai.com/api-keys
- Ensure key starts with `sk-proj-` or `sk-`
- Verify billing is enabled on your OpenAI account
- Check you have available credits

### No search results
**Error:** `Brave Search API returned 401` or `No results found`

**Solutions:**
- Brave key is already provided in `.env.example` (BSAg9FdN7meMZ7HaL5H86UPO0W3D-a2)
- Or get your own key at: https://api.search.brave.com/register

### Cannot connect to server
**Error:** `Failed to fetch` or `ERR_CONNECTION_REFUSED`

**Solutions:**
```bash
# Check if server is running
curl http://localhost:3001/health

# If not, restart:
pnpm dev
```

### Dependencies won't install
**Error:** Package manager issues

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules web/node_modules server/node_modules
rm -rf .pnpm-store
pnpm install

# Or use npm instead
npm install
```

## Documentation

- `TESTING.md` - **Test scenarios and troubleshooting for evaluators**
- `docs/PROJECT_BLUEPRINT.md` - Full project specification
- `docs/DEMO_SCRIPT.md` - Demo walkthrough
- `ENV_SETUP.md` - Environment configuration
- `web/README.md` - Frontend documentation
- `server/README.md` - Backend documentation

## License

MIT
