# Environment Setup

## Quick Start

Copy the example environment file and add your API keys:

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

Your `.env` file should look like this:

```bash
# Search Provider
BRAVE_SEARCH_API_KEY=BSAg9FdN7meMZ7HaL5H86UPO0W3D-a2

# LLM (ADD YOUR KEY HERE)
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# Server
PORT=3001

# Web
WEB_URL=http://localhost:5173

# Development (set to 1 to use mock data)
MOCK_MODE=0
```

**Note:** The Brave Search API key is already provided for evaluation purposes. You only need to add your OpenAI API key.

## Getting API Keys

### OpenAI API (Required)

**For Evaluators:** You'll need your own OpenAI API key. Cost is minimal for testing (~$0.20 for 20 queries).

1. **Create Account:** Visit https://platform.openai.com/signup
2. **Add Billing:** Navigate to Settings → Billing → Add payment method
3. **Generate Key:** Go to https://platform.openai.com/api-keys → Create new secret key
4. **Copy Key:** Save it immediately (you won't be able to see it again)
5. **Add to `.env`:** Paste as `OPENAI_API_KEY=sk-proj-...`

**Requirements:**
- Billing must be enabled (requires credit card)
- Minimum $5 credit (often comes with $5 free trial credit for new accounts)
- GPT-4 Turbo access (usually available by default)

**Verification:**
```bash
# Test your key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY_HERE"
```

### Brave Search API (Provided)

**For Evaluators:** A shared Brave Search API key is already included in `.env.example` for your convenience.

**If you want your own key:**
1. Visit https://api.search.brave.com/register
2. Sign up for a free account
3. Generate an API key
4. Replace `BRAVE_SEARCH_API_KEY` in `.env`

**Free Tier:** 2,000 queries/month (more than sufficient for testing)

## Cost Estimates

### Per Query Breakdown

| Component | Service | Tokens | Cost |
|-----------|---------|--------|------|
| Query Planning | OpenAI GPT-4 Turbo | ~500 | $0.005 |
| Answer Synthesis | OpenAI GPT-4 Turbo | ~1500 | $0.015 |
| Search (4 sub-queries) | Brave Search | N/A | Free |
| **Total per query** | | | **$0.01-0.02** |

### Evaluation Testing

For a thorough evaluation (20 test queries):

| Service | Usage | Cost |
|---------|-------|------|
| **OpenAI** | ~40,000 tokens | **~$0.20** |
| **Brave Search** | 80 API calls | **Free** |
| **Total** | | **~$0.20** |

### Monthly Usage (Light)

If running ~100 queries/month:

| Service | Usage | Cost |
|---------|-------|------|
| OpenAI | ~200K tokens | ~$1.00 |
| Brave Search | 400 API calls | Free |
| **Total** | | **~$1.00/month** |

### Cost Control

1. **Mock Mode:** Set `MOCK_MODE=1` to test without API calls
2. **Monitor Usage:** Check https://platform.openai.com/usage
3. **Set Limits:** Configure spending limits in OpenAI dashboard
4. **Cache Results:** (Not yet implemented) Would reduce repeat query costs

## Development Mode

Set `MOCK_MODE=1` to use mock data and skip API calls during development:
- Mock search results (3 example sources: Wikipedia, MIT, ArXiv)
- Mock answer synthesis (placeholder text with citations)
- No API keys required
- Instant responses (no network delays)
- Personalization still works with mock data

**When to use Mock Mode:**
- UI development and styling
- Testing frontend components
- Demonstrating without API costs
- Developing without internet connection

**Limitations:**
- No real search results
- No query planning (shows 1 mock query)
- Answer is generic placeholder text
- Can't test LLM quality or search relevance

## Troubleshooting

### OpenAI API Key Issues

**Error:** `Invalid API key`
- Ensure key starts with `sk-proj-` or `sk-`
- Check for extra spaces or newlines
- Verify key wasn't revoked at https://platform.openai.com/api-keys

**Error:** `Insufficient quota` or `Rate limit exceeded`
- Check billing is enabled
- Verify you have available credits
- Check usage at https://platform.openai.com/usage
- Add more credits or wait for rate limit to reset

**Error:** `Model gpt-4-turbo not found`
- Ensure you have GPT-4 access (usually automatic)
- Try `gpt-3.5-turbo` as fallback (update in `server/src/llm/llm.ts`)

### Brave Search Issues

**Error:** `401 Unauthorized`
- Use the provided key from `.env.example`
- Or generate your own at https://api.search.brave.com/register
- Or set `MOCK_MODE=1` to skip search

**Error:** `429 Too Many Requests`
- Free tier limit reached (2000/month)
- Wait until next month or upgrade plan
- Or set `MOCK_MODE=1` for testing

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes* | - | OpenAI API key for LLM calls |
| `BRAVE_SEARCH_API_KEY` | Yes* | - | Brave Search API key |
| `MOCK_MODE` | No | 0 | Set to 1 to use mock data (no API keys needed) |
| `PORT` | No | 3001 | Server port |
| `WEB_URL` | No | http://localhost:5173 | Web app URL (for CORS) |

*Not required if `MOCK_MODE=1`

