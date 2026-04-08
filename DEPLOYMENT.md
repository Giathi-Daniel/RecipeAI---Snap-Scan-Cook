# Deployment Checklist

## Pre-Deployment

- [x] Professional landing page redesigned
- [x] All rounded corners removed for sharp, professional aesthetic
- [x] Color scheme minimized to natural palette
- [x] Mobile responsive design verified
- [x] SEO metadata complete for all routes
- [x] Security headers implemented
- [x] Input sanitization hardened
- [x] Build process tested locally

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
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
FRONTEND_URL=https://your-domain.vercel.app
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
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port 10000`
5. Add environment variables in Render dashboard
6. Deploy and verify API docs at `/docs`

### 3. Database → Supabase
1. Verify all migrations applied
2. Check RLS policies active
3. Test auth flow in production
4. Verify recipe CRUD operations

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

## GitHub Repository

- [x] README.md complete with setup instructions
- [x] PROGRESS.md documenting 14-day journey
- [x] .env.example with all required variables
- [x] Clear project structure documented
- [x] License file included (MIT)
- [x] .gitignore properly configured

## Portfolio Integration

- [ ] Add RecipeAI to portfolio projects section
- [ ] Include 2-3 key screenshots
- [ ] Highlight technical stack: Next.js 15, FastAPI, Supabase, Google AI APIs
- [ ] Link to live demo and GitHub repository
- [ ] Emphasize AI integration and full-stack capabilities

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

## GitHub Issues to Create

### Issue 1: Enable Google Cloud Vision API Billing
**Title:** Enable Google Cloud Vision API for Image Recognition

**Description:**
Currently, the image upload flow stops at Vision API label extraction because billing is disabled on the Google Cloud project.

**Steps to resolve:**
1. Go to Google Cloud Console
2. Enable billing for the project
3. Verify Vision API is enabled
4. Test image upload flow end-to-end
5. Verify recipe generation from uploaded images

**Labels:** enhancement, deployment, api-integration

---

### Issue 2: Add Recipe Import from URL
**Title:** Add ability to import recipes from external URLs

**Description:**
Enhance the upload flow to accept recipe URLs from popular cooking websites. Parse the HTML and extract recipe data automatically.

**Technical approach:**
- Add URL input field to upload page
- Create backend endpoint to fetch and parse HTML
- Use BeautifulSoup or similar to extract recipe schema
- Support common recipe markup formats (JSON-LD, Microdata)
- Fall back to Gemini parsing if structured data unavailable

**Labels:** enhancement, feature

---

### Issue 3: Add Recipe Collections/Folders
**Title:** Implement recipe collections for better organization

**Description:**
Allow users to organize saved recipes into custom collections or folders (e.g., "Weeknight Dinners", "Desserts", "Meal Prep").

**Database changes needed:**
- Create `collections` table
- Create `recipe_collections` junction table
- Add RLS policies for user-owned collections

**UI changes needed:**
- Add collection management in dashboard
- Add collection selector when saving recipes
- Filter dashboard by collection

**Labels:** enhancement, feature, database

---

### Issue 4: Add Recipe Rating and Notes
**Title:** Allow users to rate recipes and add personal notes

**Description:**
Add ability for users to rate their saved recipes (1-5 stars) and add personal cooking notes or modifications.

**Database changes:**
- Add `rating` column to `saved_recipes` table
- Add `notes` text column to `saved_recipes` table

**UI changes:**
- Add star rating component to recipe view
- Add notes textarea that saves automatically
- Show rating in dashboard recipe cards

**Labels:** enhancement, feature

---

### Issue 5: Add Shopping List Generation
**Title:** Generate shopping list from multiple recipes

**Description:**
Allow users to select multiple recipes and generate a combined shopping list with quantities aggregated by ingredient.

**Features:**
- Multi-select recipes in dashboard
- Combine ingredients intelligently (e.g., "2 cups flour" + "1 cup flour" = "3 cups flour")
- Group by category (produce, dairy, pantry, etc.)
- Export as PDF or send via email
- Check off items as purchased

**Labels:** enhancement, feature

---

## Monitoring & Maintenance

- [ ] Set up error tracking (Sentry or similar)
- [ ] Monitor API usage and costs (Gemini, Vision)
- [ ] Set up uptime monitoring
- [ ] Configure backup strategy for Supabase
- [ ] Document API rate limits and quotas
