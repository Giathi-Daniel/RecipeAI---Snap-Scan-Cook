# Render Deployment Configuration

## Service Settings

- **Name**: recipeai-backend
- **Environment**: Python
- **Region**: Choose closest to your users
- **Branch**: main
- **Root Directory**: backend

## Build & Deploy

- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
- **Python Version**: Automatically detected from `runtime.txt` (3.11.9)

## Environment Variables

Add these in the Render dashboard under "Environment":

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xcsdfbbtjxyotvacyyfu.supabase.co
SUPABASE_JWT_SECRET=your_jwt_secret_from_supabase
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_supabase

# Google AI APIs
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS=recipe-ai-text-parser-626cd20db194.json

# CORS Configuration
CORS_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:3000

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_SECONDS=60
DEFAULT_RATE_LIMIT=120
```

## Google Cloud Credentials

Since Render doesn't support file uploads in environment variables, you have two options:

### Option 1: Use Secret Files (Recommended)
1. Go to your Render service dashboard
2. Navigate to "Secret Files"
3. Add a new secret file:
   - **Filename**: `recipe-ai-text-parser-626cd20db194.json`
   - **Contents**: Paste your Google Cloud service account JSON

### Option 2: Use Environment Variable
1. Convert your JSON credentials to a single-line string
2. Add as environment variable: `GOOGLE_CREDENTIALS_JSON`
3. Update `backend/services/vision_service.py` to read from env var instead of file

## Deployment Checklist

- [ ] Push code to GitHub (main branch)
- [ ] Create new Web Service on Render
- [ ] Configure build and start commands
- [ ] Add all environment variables
- [ ] Upload Google Cloud credentials as secret file
- [ ] Deploy and wait for build to complete
- [ ] Test health endpoint: `https://your-app.onrender.com/health`
- [ ] Test API docs: `https://your-app.onrender.com/docs`
- [ ] Update frontend `NEXT_PUBLIC_BACKEND_URL` to point to Render URL

## Troubleshooting

### Build Fails with "Read-only file system"
- Ensure `runtime.txt` specifies Python 3.11.9
- Check that all dependencies have pre-built wheels

### 401 Unauthorized Errors
- Verify `NEXT_PUBLIC_SUPABASE_URL` matches your Supabase project URL
- Ensure `SUPABASE_JWT_SECRET` is correct (from Supabase project settings)

### CORS Errors
- Add your frontend domain to `CORS_ORIGINS`
- Include both production and localhost URLs during development

### Google Vision API Errors
- Verify credentials file is uploaded as secret file
- Check `GOOGLE_APPLICATION_CREDENTIALS` path matches secret filename
- Ensure Google Cloud Vision API is enabled in your GCP project
