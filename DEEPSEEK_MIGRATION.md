# Migration from Gemini to DeepSeek API

## Overview

RecipeAI has been migrated from Google Gemini API to DeepSeek API for all text-based AI operations. Google Cloud Vision API is still used for image recognition.

## Why DeepSeek?

- **Better Performance**: DeepSeek offers superior reasoning capabilities
- **Cost Effective**: More competitive pricing than OpenAI
- **JSON Mode**: Native JSON response format support
- **Reliability**: Stable API with good uptime

## What Changed

### AI Provider Split

| Feature | Old Provider | New Provider |
|---------|-------------|--------------|
| Recipe Parsing | Gemini | **DeepSeek** |
| Recipe Generation | Gemini | **DeepSeek** |
| Ingredient Substitution | Gemini | **DeepSeek** |
| Recipe Localization | Gemini | **DeepSeek** |
| Nutrition Estimation | Gemini | **DeepSeek** |
| Image Recognition | Google Vision | **Google Vision** (unchanged) |
| Recipe from Image | Gemini | **DeepSeek** |

### Files Modified

1. **backend/services/deepseek_service.py** (NEW)
   - Complete DeepSeek API integration
   - All recipe processing functions
   - OpenAI-compatible API format

2. **backend/routers/recipes.py**
   - Changed import from `gemini_service` to `deepseek_service`

3. **backend/routers/vision.py**
   - Changed import from `gemini_service` to `deepseek_service`
   - Vision API still identifies dish, DeepSeek generates recipe

4. **backend/.env**
   - Added `DEEPSEEK_API_KEY`
   - Added `DEEPSEEK_MODEL=deepseek-chat`
   - Commented out `GEMINI_API_KEY` and `GEMINI_MODEL`

5. **backend/requirements.txt**
   - Commented out `google-generativeai==0.8.5`
   - Kept `google-cloud-vision==3.10.1` (still needed)

### Files Unchanged

- **backend/services/gemini_service.py** - Kept for reference, not imported
- **backend/services/vision_service.py** - Still uses Google Cloud Vision
- All frontend files - No changes needed

## Setup Instructions

### 1. Get DeepSeek API Key

1. Visit https://platform.deepseek.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 2. Update Environment Variables

**backend/.env**:
```bash
# DeepSeek AI
DEEPSEEK_API_KEY=sk-your-actual-deepseek-api-key-here
DEEPSEEK_MODEL=deepseek-chat

# Google Cloud Vision (still needed for images)
GOOGLE_APPLICATION_CREDENTIALS=recipe-ai-text-parser-626cd20db194.json

# Google Gemini (DEPRECATED)
# GEMINI_API_KEY=...
# GEMINI_MODEL=...
```

### 3. Install Dependencies

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

Note: `google-generativeai` will be uninstalled automatically since it's commented out.

### 4. Restart Backend

```bash
uvicorn main:app --reload
```

### 5. Test the API

```bash
# Test recipe parsing
curl -X POST http://localhost:8000/api/recipes/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "Githeri\n\nIngredients:\n- 2 cups maize\n- 1 cup beans\n\nSteps:\n1. Boil maize and beans together"}'

# Test recipe generation
curl -X POST http://localhost:8000/api/recipes/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "githeri"}'
```

## API Compatibility

DeepSeek API is OpenAI-compatible, using the same request/response format:

```python
# Request format
{
    "model": "deepseek-chat",
    "messages": [
        {"role": "system", "content": "You are a recipe parser..."},
        {"role": "user", "content": "Parse this recipe..."}
    ],
    "temperature": 0.2,
    "response_format": {"type": "json_object"}
}

# Response format
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

## Deployment Updates

### Render (Backend)

Update environment variables in Render dashboard:

1. Go to your service settings
2. Add `DEEPSEEK_API_KEY` with your key
3. Add `DEEPSEEK_MODEL=deepseek-chat`
4. Remove or comment out `GEMINI_API_KEY` and `GEMINI_MODEL`
5. Redeploy

### Vercel (Frontend)

No changes needed - frontend doesn't directly call AI APIs.

## Cost Comparison

| Provider | Model | Input (per 1M tokens) | Output (per 1M tokens) |
|----------|-------|----------------------|------------------------|
| Gemini | gemini-1.5-flash | Free (limited) | Free (limited) |
| DeepSeek | deepseek-chat | $0.14 | $0.28 |
| OpenAI | gpt-4o-mini | $0.15 | $0.60 |

DeepSeek is more cost-effective than OpenAI while offering better performance than Gemini's free tier.

## Rollback Instructions

If you need to rollback to Gemini:

1. Uncomment `google-generativeai==0.8.5` in `requirements.txt`
2. Run `pip install -r requirements.txt`
3. Update `backend/routers/recipes.py` and `backend/routers/vision.py`:
   ```python
   from services.gemini_service import (...)
   ```
4. Update `backend/.env`:
   ```bash
   GEMINI_API_KEY=your_gemini_key
   GEMINI_MODEL=gemini-1.5-flash
   ```
5. Restart backend

## Testing Checklist

- [ ] Recipe text parsing works
- [ ] Recipe generation from dish name works
- [ ] Image upload identifies dish (Google Vision)
- [ ] Recipe generation from image works (DeepSeek)
- [ ] URL import works
- [ ] Ingredient substitution works
- [ ] Recipe localization works
- [ ] Nutrition estimation works
- [ ] All responses return valid JSON
- [ ] Error handling works correctly

## Support

- DeepSeek Docs: https://platform.deepseek.com/docs
- DeepSeek API Status: https://status.deepseek.com/
- Google Vision Docs: https://cloud.google.com/vision/docs

## Notes

- DeepSeek API has rate limits - check your plan
- Google Cloud Vision API is still required for image recognition
- The `gemini_service.py` file is kept for reference but not used
- All system prompts remain the same between providers
- JSON response format is identical
