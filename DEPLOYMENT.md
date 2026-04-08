## Environment Variables

### Frontend (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

### Backend (Render)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
CORS_ORIGINS=https://your-domain.vercel.app
```

## Deployment Steps

### 1. Frontend → Vercel
1. Push code to GitHub
2. Connect repository on vercel.com
3. Add environment variables in Vercel dashboard
4. Deploy and verify build
5. Test production URL

### 2. Backend → Render
1. Push backend code to GitHub
2. Create new Web Service on render.com
3. **Python version**: Automatically detected from `backend/runtime.txt` (Python 3.11.9)
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port 10000`
6. Add environment variables in Render dashboard
7. Deploy and verify API docs at `/docs`

## Post-Deployment Verification

- [ ] Landing page loads correctly
- [ ] Auth flow (signup/login/logout) works
- [ ] Upload flow (text and image) functional
- [ ] Recipe parsing returns structured data
- [ ] Dashboard displays saved recipes
- [ ] Recipe view shows all features
- [ ] Serving scaling works
- [ ] Nutrition data displays
- [ ] Substitutions and localization functional
- [ ] Mobile responsive on all pages
- [ ] Print view works for recipes
- [ ] Public recipe sharing works

## Screenshots to Capture

1. **Landing Page** - Desktop view showing hero section and features grid
2. **Landing Page Mobile** - Mobile responsive view
3. **Upload Flow** - Text paste interface
4. **Upload Flow** - Image upload interface
5. **Recipe View** - Full recipe with ingredients and steps
6. **Recipe Features** - Nutrition badges, scaling controls, substitution panel
7. **Dashboard** - Saved recipes grid with search/filter
8. **Mobile Navigation** - Hamburger menu expanded
9. **Auth Pages** - Login and signup forms

## LinkedIn Announcement

**Post Title:** "Built RecipeAI: AI-Powered Recipe Assistant with Next.js & FastAPI"

**Post Content:**
```
🍽️ Just completed RecipeAI — a full-stack AI-powered cooking assistant!

What it does:
• Upload food photos → AI identifies dishes and generates recipes
• Paste messy recipe text → AI structures it automatically
• Scale servings, substitute ingredients, localize recipes
• Get nutritional analysis with dietary flags

Tech Stack:
• Frontend: Next.js 15 (App Router, TypeScript, Tailwind CSS)
• Backend: FastAPI (Python)
• AI: Google Gemini API + Cloud Vision API
• Auth & DB: Supabase (PostgreSQL)
• Deployed: Vercel + Render

Built in 14 days following a structured roadmap from concept to production.

Key learnings:
✓ Integrating multiple AI APIs for different use cases
✓ Designing clean, professional UI without over-styling
✓ Implementing secure auth flows with Supabase
✓ Building scalable FastAPI backends with proper testing
✓ SEO optimization and security hardening

Live demo and code on GitHub (link in comments)

#WebDevelopment #AI #NextJS #FastAPI #FullStack #SoftwareEngineering
```
