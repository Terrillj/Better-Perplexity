# Environment Setup

## Quick Start

Copy the example environment file and add your API keys:

```bash
cp .env.example .env
```


**Note:** The Brave Search API key is already provided for evaluation purposes.


**For Evaluators:** You'll need your own OpenAI API key. Cost is minimal for testing (~$0.20 for 20 queries).

1. **Create Account:** Visit https://platform.openai.com/signup
2. **Add Billing:** Navigate to Settings → Billing → Add payment method
3. **Generate Key:** Go to https://platform.openai.com/api-keys → Create new secret key
4. **Copy Key:** Save it immediately (you won't be able to see it again)
5. **Add to `.env`:** Paste as `OPENAI_API_KEY=sk-proj-...`

**Requirements:**
- Billing must be enabled (requires credit card)
- Minimum $5 credit (often comes with $5 free trial credit for new accounts)