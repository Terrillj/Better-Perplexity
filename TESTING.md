# Testing Guide for Evaluators

This guide provides quick test scenarios to verify Better-Perplexity's core features.

## Quick Start (< 5 minutes)

1. **Clone and setup:**
   ```bash
   git clone <repo-url>
   cd Better-Perplexity
   cp .env.example .env
   # Add your OpenAI API key to .env
   pnpm install
   pnpm dev
   ```

2. **Open browser:** `http://localhost:5173`

3. **Run test queries** (see below)

---

## Test Scenario 1: Basic Search & Citations

**Goal:** Verify query planning, parallel search, and answer synthesis work end-to-end.

**Steps:**
1. Enter query: `"What are the latest developments in quantum computing?"`
2. Wait 12-17 seconds for results

**Expected Behavior:**
- ✅ 2-4 sub-query chips appear (e.g., "recent quantum computing breakthroughs", "quantum computing news")
- ✅ Sources panel populates with ~10 ranked results
- ✅ Answer appears in left panel with inline citations `[1] [2] [3]`
- ✅ Each source card shows domain, timestamp, and "why chosen" badges
- ✅ Metrics bar shows execution time, source count, and estimated cost

**Console Output (F12):**
```
[Planner] Generated 3 sub-queries
[Search] Parallel search completed in 2.3s
[Ranker] Ranked 12 sources
[LLM] Answer synthesized in 8.5s
```

---

## Test Scenario 2: Personalization

**Goal:** Verify that user interactions affect future rankings.

**Steps:**
1. Enter query: `"How does CRISPR gene editing work?"`
2. Click 3-4 sources from `.edu` domains (e.g., MIT, Stanford)
3. Enter new query: `"What is protein folding?"`
4. Observe ranking changes

**Expected Behavior:**
- ✅ After clicking `.edu` sources, next query should rank `.edu` domains higher
- ✅ Personalization badge appears on reweighted sources (e.g., "🎯 .edu preferred")
- ✅ After 10+ interactions, "Cold Start Mode" banner disappears

**Console Output:**
```
[Personalization] Logged click: mit.edu
[Personalization] Updated domain preference: .edu +0.15
[Ranker] Applied personalization: 5 sources reweighted
```

**Debug Mode:**
Add `?debug=true` to URL to see detailed personalization logs in UI.

---

## Test Scenario 3: Multi-Signal Ranking

**Goal:** Verify that ranking considers relevance, recency, quality, and personalization.

**Steps:**
1. Enter query: `"2024 US election results"` (time-sensitive)
2. Observe source order

**Expected Behavior:**
- ✅ Recent sources (within 1 week) ranked higher
- ✅ High-quality domains (.gov, .edu, major news) ranked higher
- ✅ Badges indicate ranking factors: "Recent (2 days ago)", "Quality Source", "High Relevance"

**Try these queries to test different signals:**
- **Recency:** "latest iPhone features", "today's stock market"
- **Quality:** "how vaccines work", "climate change effects"
- **Coverage:** "compare React vs Vue", "pros and cons of remote work"

---

## Test Scenario 4: Query Planning

**Goal:** Verify LLM decomposes complex queries into sub-queries.

**Steps:**
1. Enter complex query: `"Compare the economic policies of Keynesian and Austrian schools of thought"`

**Expected Behavior:**
- ✅ Planner generates 3-5 targeted sub-queries:
  - "Keynesian economic theory principles"
  - "Austrian school of economics"
  - "Keynesian vs Austrian economics comparison"
- ✅ Each sub-query independently searches and merges results
- ✅ Final source list shows diversity across subtopics

**Console Output:**
```
[Planner] Generated 4 sub-queries
[Search] Running parallel search across 4 queries
[Search] Merged 45 results → 15 unique sources
```

---

## Troubleshooting

### Port 3001 already in use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in .env
PORT=3002
```

### OpenAI API Error
```
Error: Invalid OpenAI API key
```
**Solution:**
1. Check key validity at https://platform.openai.com/api-keys
2. Ensure key starts with `sk-proj-` or `sk-`
3. Verify billing is enabled on OpenAI account

### No search results / Brave API Error
```
Error: Brave Search API returned 401
```
**Solution:**
1. Use provided Brave key (already in `.env.example`)
2. Or set `MOCK_MODE=1` in `.env` for testing without API

### Browser shows "Cannot connect to server"
```bash
# Check if server is running
curl http://localhost:3001/health

# If not, restart:
pnpm dev
```

---

## Expected Performance

| Metric | Target | Notes |
|--------|--------|-------|
| **Total Time** | 12-17s | Query → Answer |
| **Plan Time** | 1-2s | LLM generates sub-queries |
| **Search Time** | 2-4s | Parallel search across queries |
| **Scrape Time** | 4-6s | Concurrent scraping (10 sources) |
| **Rank Time** | 0.1s | Multi-signal ranking |
| **Synthesis Time** | 5-10s | LLM generates answer with citations |

---

## Verify Personalization is Working

**Method 1: Console Logs**
1. Open DevTools (F12)
2. Look for `[Personalization]` logs after interactions

**Method 2: Debug Mode**
1. Add `?debug=true` to URL
2. Personalization panel appears showing:
   - Domain preferences
   - Content type preferences
   - Recency preferences
   - Total interaction count

**Method 3: Test Query**
1. Run query: `"How does blockchain work?"`
2. Click 5 `.edu` sources
3. Run new query: `"What is machine learning?"`
4. Check source order - `.edu` should rank higher

---

## Mock Mode Testing (No API Keys)

If you want to test the UI without API keys:

```bash
# In .env
MOCK_MODE=1
```

**Mock Mode Provides:**
- 3 example sources (Wikipedia, MIT, ArXiv)
- Simulated answer with citations
- Instant responses (no API delays)
- Personalization still works with mock data

**Limitations:**
- No real search results
- No query planning (shows 1 mock query)
- Answer is generic placeholder text

---

## Cost Estimate

For ~20 test queries (sufficient for evaluation):

| Service | Cost |
|---------|------|
| OpenAI (GPT-4 Turbo) | ~$0.20 |
| Brave Search | Free (2000/month) |
| **Total** | **~$0.20** |

**Breakdown per query:**
- Planning: ~500 tokens (~$0.005)
- Synthesis: ~1500 tokens (~$0.015)
- Total: ~$0.01-0.02 per query

---

## Advanced Testing

### Test Parallel Search Merging
```bash
# Run tests
cd server
pnpm test src/test/parallelSearch.test.ts
```

### Test Ranking Algorithm
```bash
pnpm test src/test/rank.test.ts
```

### Test Personalization (Thompson Sampling)
```bash
pnpm test src/test/bandit.test.ts
```

---

## Contact

If you encounter issues during evaluation, please open an issue or contact [your email].

