# Better Perplexity

> An intelligent search assistant with transparent, citation-backed answers and Thompson Sampling personalization that learns your preferences in real-time.

---

## 🎯 What I Built & Why It Matters

**The Challenge:** Build a chat interface with internet search capabilities, then take it one step further with a technically compelling feature.

**My Solution:** I built a production-grade information retrieval system that goes well beyond a "LLM + search API wrapper." The system delivers citation-backed answers through a multi-stage pipeline that optimizes for quality, transparency, and speed. For the technical leap, I implemented **Thompson Sampling Multi-Armed Bandit personalization**—a well established online learning algorithm— to learn user preferences and adapt search results in real-time.

**Why This Matters:** Instead of using static rules like ("user likes .edu domains"), my system uses **semantic understanding** powered by LLMs and Bayesian inference to learn nuanced preferences like "user prefers expert-level, data-driven research content" dynamically from clicks. This project is meant to exemplify my understanding and ability to work with information retrieval, online learning algorithms, LLM orchestration, and full-stack engineering—all delivered in a polished product you can test in minutes.

---

## 🏗️ Pipeline Architecture

```
USER QUERY
"What caused the 2008 financial crisis?"
    │
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 1. QUERY PLANNER (LLM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    → Decompose into 2-5 focused sub-queries
    → Few-shot prompting with GPT-4o-mini
    │
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 2. PARALLEL SEARCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    → 5 concurrent searches (Brave API)
    → Merge & deduplicate results → ~20 unique URLs
    │
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 3. CONCURRENT SCRAPING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    → 15 pages scraped in parallel
    → Mozilla Readability content extraction
    → LLM semantic tagging 
    │
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 4. MULTI-SIGNAL RANKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    → BM25 relevance (IDF-weighted term frequency)
    → Recency score (publication date decay)
    → Source quality (.edu/.gov boosts)
    → Content depth (article length)
    │
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 5. PERSONALIZATION (Thompson Sampling)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    → Beta distribution scoring (Bayesian inference)
    → Boost sources matching learned preferences
    → Real-time adaptation from clicks
    │
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 6. ANSWER SYNTHESIS (LLM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    → Generate answer from top 8 sources
    → Enforce inline citations [1], [2], [3]
    → Extract supporting passages for verification
    │
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 7. DISPLAY & FEEDBACK LOOP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    → Show answer with clickable citations
    → Display source cards with ranking transparency
    → Track clicks → Update Thompson Sampling state
```

**Performance:** ~12-17s end-to-end  
**Learning:** Adapts from first click  
**Transparency:** Every ranking decision explained

### Step-by-Step Breakdown

**1. Query Planner (LLM)**  
Complex questions rarely map to a single search query. The planner uses GPT-4o-mini with few-shot prompting to decompose user queries into 2-5 focused sub-queries that capture different aspects of the question. For example, *"What caused the 2008 financial crisis?"* becomes separate searches for regulatory failures, housing market collapse, and financial instruments. This ensures comprehensive coverage while avoiding the noise of overly broad searches.

**2. Parallel Search**  
All sub-queries execute concurrently via Brave Search API (5 parallel requests). URL normalization handles duplicates across queries. Wikipedia results are filtered to prioritize primary sources. Output: ~20 unique URLs optimized for diversity.

**3. Concurrent Scraping**  
Up to 15 URLs are scraped in parallel (~10-12s total). Mozilla Readability extracts clean content from HTML, and GPT-4o-mini tags each source with **semantic features** across 5 dimensions: depth (introductory/intermediate/expert), style (conversational/formal/technical), format (tutorial/overview/research), approach (practical/theoretical/data-driven), and density (concise/detailed/comprehensive). These features power the personalization system.

**4. Multi-Signal Ranking**  
Sources are scored using multiple weighted signals:
- **BM25 relevance:** IDF-weighted term frequency scoring against the user's original query (spam-resistant, prioritizes rare terms)
- **Recency:** Publication dates parsed from meta tags and Brave API with exponential decay
- **Source quality:** Boosts for `.edu`, `.gov`
- **Content depth:** Rewards longer, more comprehensive articles

Final scores are normalized and combined to produce an objective quality ranking.

**5. Personalization (Thompson Sampling)**  
The Thompson Sampling Multi-Armed Bandit adjusts rankings based on learned preferences. Each of the 5 semantic feature dimensions (15 total feature values) is treated as an "arm" with a Beta distribution representing success/failure history. The system samples from these distributions to generate personalization scores, then boosts sources matching highest sampled features (typically 8-15% boost for matches). This happens in real-time using Bayesian inference—no offline training required.

**6. Answer Synthesis (LLM)**  
The top 8 ranked sources are passed to GPT-4o-mini with a structured prompt that enforces inline citations (e.g., `[1]`, `[2]`). The model generates a comprehensive answer, and post-generation validation ensures all sources used are valid. 

**7. Display & Feedback Loop**  
The UI presents the synthesized answer with clickable citations and source cards showing ranking reasons ("High BM25 score", "Recent publication", "Matches your preferences"). When users click sources, events are logged and the Thompson Sampling state updates: clicked sources contribute fractional success (+1/n per feature where n = number of features), while unclicked impressions contribute fractional failures after a timeout. This closes the learning loop.

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + TypeScript
- TanStack Query (data fetching & caching)
- Tailwind CSS (styling)
- Vite (build tool)
- Zod (runtime validation)

**Backend**
- Node.js + Express + TypeScript
- OpenAI API(GPT-4o-mini for planning, synthesis, feature extraction)
- Brave Search API (web search)
- JSDOM + Mozilla Readability (content extraction)
- Vitest (testing: 47 passing tests)

**Algorithms & AI**
- Thompson Sampling (multi-armed bandit)
- BM25 (relevancy)
- Beta distribution (Bayesian inference)
- Few-shot prompt engineering

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- npm
- **OpenAI API key** ([get one here](https://platform.openai.com/api-keys)) – requires billing enabled (~$0.10-0.20 for 20 test queries)
- **Brave Search API key** – already provided in `.env.example` for evaluation

### Setup (2 minutes)

```bash
# 1. Clone and install
git clone <repo-url>
cd Better-Perplexity
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-proj-xxxxx
# (Brave key is already included)

# 3. Start both servers
npm run dev
```

**Frontend:** http://localhost:5173  
**Backend:** http://localhost:3001

**Troubleshooting?** See [ENV_SETUP.md](./ENV_SETUP.md) for detailed configuration help.

---

## 🧪 Testing the Personalization

The Thompson Sampling system is the core innovation. Here's how to see it learn in real-time:

### Demo Protocol (5 minutes)

**1. Establish Baseline**
```
Query: "What caused the 2008 financial crisis?"
→ Observe the mix of source styles/depths (no personalization yet)
```

**2. Build Preferences**
```
Query: "How do neural networks work?"
→ Click 3 sources that are "Expert" or "Technical" level
→ Make another query
```

**3. Watch Adaptation**
```
Query: "Explain quantum computing"
→ Notice: Expert/Technical sources now get "Matches your preferences" badges
→ Check debug panel: depth:expert ~50-60%, style:technical ~50-60%
→ Personalization boosts matching sources by 8-15%
```

**4. Test Conflicting Preferences**
```
Query: "Explain blockchain to a beginner"
→ Click 3 "Introductory" or "Conversational" sources
→ System balances conflicting preferences (expert vs. introductory)
→ Watch confidence levels shift dynamically
```

**What You're Seeing:**
- **1-3 clicks:** ~45-55% confidence (early learning)
- **5-8 clicks:** ~55-65% confidence (moderate preference)
- **10+ clicks:** ~65-75% confidence (strong preference)
- **Always exploring:** Maintains 20-30% exploration to avoid over-fitting

---

## 📚 Additional Documentation

- **[PROJECT_BLUEPRINT.md](./docs/PROJECT_BLUEPRINT.md)** – Complete technical specification
- **[ENV_SETUP.md](./ENV_SETUP.md)** – Detailed environment configuration

---

**Built by Jake Terrill | October 2025 | 5 days of AI-accelerated development**
