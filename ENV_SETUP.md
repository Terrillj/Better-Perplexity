# Environment Setup

## Quick Setup (2 minutes)

### 1. Copy Environment File
```bash
cp .env.example .env
```

### 2. Add OpenAI API Key
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Open `.env` and paste your key:
   ```
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
   ```

### 3. Brave Search API Key
The Brave Search API key is **already provided** in `.env.example` for evaluation purposes. No action needed.

---

## Requirements

**OpenAI API:**
- Billing must be enabled (requires credit card on file)
- **Cost:** ~$0.10-0.20 for 20 test queries (GPT-4o-mini is very cheap)
- Model used: `gpt-4o-mini` for query planning, feature extraction, and answer synthesis

**Brave Search API:**
- Already provided for testing
- Personal key please don't abuse :)

---

## Troubleshooting

### Port conflicts
- Frontend default: `5173`
- Backend default: `3001`
- Change in `vite.config.ts` (frontend) or `server/src/index.ts` (backend) if needed

### "Module not found" errors
```bash
# Clean install
rm -rf node_modules web/node_modules server/node_modules
npm install
```

---

## Optional: Turn Debug Mode Off

This will hide the "For Testers" box

```bash
DEBUG_BANDIT=false npm run dev 
```

