# Environment Setup

Create a `.env` file in the root directory with the following variables:

```bash
# Search Provider
BRAVE_SEARCH_API_KEY=BSAg9FdN7meMZ7HaL5H86UPO0W3D-a2

# LLM
OPENAI_API_KEY=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

# Server
PORT=3001

# Development (set to 1 to use mock data)
MOCK_MODE=0
```

## Getting API Keys

### Brave Search API
1. Visit https://brave.com/search/api/
2. Sign up for an account
3. Generate an API key
4. Free tier: 2,000 queries/month

### OpenAI API
1. Visit https://platform.openai.com/api-keys
2. Create an account
3. Add billing information
4. Generate an API key
5. GPT-4 Turbo recommended for best results

## Development Mode

Set `MOCK_MODE=1` to use mock data and skip API calls during development:
- Mock search results (3 example sources)
- Mock answer synthesis
- No API keys required

