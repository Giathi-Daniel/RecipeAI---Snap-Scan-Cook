# Groq AI Integration

## Overview

RecipeAI uses **Groq** (FREE) for all text-based AI operations and **Google Cloud Vision** for image recognition.

## Why Groq?

- ✅ **100% FREE** - No credit card required
- ✅ **Fast** - Powered by LPU (Language Processing Unit)
- ✅ **Generous Limits** - 30 requests/min, 14,400 requests/day
- ✅ **Open Source Models** - Llama 3.1 8B Instant
- ✅ **JSON Mode** - Native structured output support

## Your Rate Limits

Based on your configuration:
- **Requests per Minute**: 10 (Org limit: 30)
- **Requests per Day**: 250 (Org limit: 14,400)
- **Tokens per Minute**: 2,000 (Org limit: 6,000)
- **Tokens per Day**: 100,000 (Org limit: 500,000)

## AI Provider Split

| Feature | Provider |
|---------|----------|
| Recipe Parsing | **Groq** (llama-3.1-8b-instant) |
| Recipe Generation | **Groq** (llama-3.1-8b-instant) |
| Ingredient Substitution | **Groq** (llama-3.1-8b-instant) |
| Recipe Localization | **Groq** (llama-3.1-8b-instant) |
| Nutrition Estimation | **Groq** (llama-3.1-8b-instant) |
| Image Recognition | **Google Cloud Vision** |
| Recipe from Image | **Groq** (llama-3.1-8b-instant) |

## Setup Instructions

### 1. Get Groq API Key

Your API key is already generated. If you need a new one:
1. Visit https://console.groq.com/
2. Go to API Keys section
3. Create new key (starts with `gsk_`)

### 2. Update Environment Variables

**backend/.env**:
```bash
# Groq AI (FREE)
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant

# Google Cloud Vision (still needed for images)
GOOGLE_APPLICATION_CREDENTIALS=recipe-ai-text-parser-626cd20db194.json
```

### 3. Restart Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

### 4. Test the API

```bash
# Test recipe generation
curl -X POST http://localhost:8000/api/recipes/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "githeri"}'

# Test recipe parsing
curl -X POST http://localhost:8000/api/recipes/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "Githeri Recipe\n\nIngredients:\n- 2 cups maize\n- 1 cup beans"}'
```

## Files Modified

1. **backend/services/groq_service.py** (NEW) - Complete Groq integration
2. **backend/routers/recipes.py** - Import from groq_service
3. **backend/routers/vision.py** - Import from groq_service
4. **backend/.env** - Groq configuration

## API Details

**Endpoint**: `https://api.groq.com/openai/v1/chat/completions`

**Request Format** (OpenAI-compatible):
```json
{
  "model": "llama-3.1-8b-instant",
  "messages": [
    {"role": "system", "content": "You are a recipe parser..."},
    {"role": "user", "content": "Parse this recipe..."}
  ],
  "temperature": 0.2,
  "response_format": {"type": "json_object"}
}
```

**Response Format**:
```json
{
  "choices": [
    {
      "message": {
        "content": "{\"title\": \"...\", \"ingredients\": [...]}"
      }
    }
  ]
}
```

## Deployment

### Render (Backend)

1. Go to your service settings
2. Add environment variable:
   - Key: `GROQ_API_KEY`
   - Value: `gsk_your_actual_key`
3. Add environment variable:
   - Key: `GROQ_MODEL`
   - Value: `llama-3.1-8b-instant`
4. Redeploy

### Vercel (Frontend)

No changes needed - frontend doesn't call AI APIs directly.

## Rate Limit Handling

With your limits (10 req/min, 250 req/day), the app will:
- Handle ~1 recipe every 6 seconds
- Support ~250 recipes per day
- Automatically retry on rate limit errors

For production with more users, you can:
1. Request limit increase from Groq (free)
2. Implement request queuing
3. Add caching for common recipes

## Cost Comparison

| Provider | Cost | Your Limits |
|----------|------|-------------|
| **Groq** | **FREE** | 250 req/day, 100K tokens/day |
| DeepSeek | $0.14/1M input tokens | Paid only |
| Gemini | Free tier limited | Rate limited |
| OpenAI | $0.15/1M input tokens | Paid only |

## Testing Checklist

- [ ] Recipe text parsing works
- [ ] Recipe generation from dish name works
- [ ] Image upload identifies dish (Google Vision)
- [ ] Recipe generation from image works (Groq)
- [ ] URL import works
- [ ] Ingredient substitution works
- [ ] Recipe localization works
- [ ] Nutrition estimation works
- [ ] All responses return valid JSON
- [ ] Rate limiting handled gracefully

## Support

- Groq Console: https://console.groq.com/
- Groq Docs: https://console.groq.com/docs
- Groq Discord: https://discord.gg/groq
- Google Vision Docs: https://cloud.google.com/vision/docs

## Notes

- Groq is 100% FREE with generous limits
- No credit card required
- Google Cloud Vision still needed for image recognition
- Llama 3.1 8B Instant is fast and accurate
- OpenAI-compatible API makes migration easy
