# Quick Reference: GitHub Issues & LinkedIn Post

## 📸 Screenshots to Take

1. **Landing Page (Desktop)** - Full hero section + features grid
2. **Landing Page (Mobile)** - Responsive mobile view
3. **Upload Flow - Text** - Recipe text paste interface
4. **Upload Flow - Image** - Image upload interface with preview
5. **Recipe View (Full)** - Complete recipe with all sections
6. **Recipe Features** - Nutrition panel, scaling controls, substitution
7. **Dashboard** - Saved recipes grid with search/filter
8. **Mobile Navigation** - Header with hamburger menu expanded
9. **Auth Pages** - Login or signup form

---

## 🐛 GitHub Issues to Create

### Issue #1: Enable Google Cloud Vision API Billing
**Labels:** `enhancement`, `deployment`, `api-integration`

```
Currently, the image upload flow stops at Vision API label extraction because billing is disabled on the Google Cloud project.

**Steps to resolve:**
1. Go to Google Cloud Console
2. Enable billing for the project
3. Verify Vision API is enabled
4. Test image upload flow end-to-end
5. Verify recipe generation from uploaded images
```

---

### Issue #2: Add Recipe Import from URL
**Labels:** `enhancement`, `feature`

```
Enhance the upload flow to accept recipe URLs from popular cooking websites. Parse the HTML and extract recipe data automatically.

**Technical approach:**
- Add URL input field to upload page
- Create backend endpoint to fetch and parse HTML
- Use BeautifulSoup or similar to extract recipe schema
- Support common recipe markup formats (JSON-LD, Microdata)
- Fall back to Gemini parsing if structured data unavailable
```

---

### Issue #3: Add Recipe Collections/Folders
**Labels:** `enhancement`, `feature`, `database`

```
Allow users to organize saved recipes into custom collections or folders (e.g., "Weeknight Dinners", "Desserts", "Meal Prep").

**Database changes needed:**
- Create `collections` table
- Create `recipe_collections` junction table
- Add RLS policies for user-owned collections

**UI changes needed:**
- Add collection management in dashboard
- Add collection selector when saving recipes
- Filter dashboard by collection
```

---

### Issue #4: Add Recipe Rating and Notes
**Labels:** `enhancement`, `feature`

```
Add ability for users to rate their saved recipes (1-5 stars) and add personal cooking notes or modifications.

**Database changes:**
- Add `rating` column to `saved_recipes` table
- Add `notes` text column to `saved_recipes` table

**UI changes:**
- Add star rating component to recipe view
- Add notes textarea that saves automatically
- Show rating in dashboard recipe cards
```

---

### Issue #5: Add Shopping List Generation
**Labels:** `enhancement`, `feature`

```
Allow users to select multiple recipes and generate a combined shopping list with quantities aggregated by ingredient.

**Features:**
- Multi-select recipes in dashboard
- Combine ingredients intelligently (e.g., "2 cups flour" + "1 cup flour" = "3 cups flour")
- Group by category (produce, dairy, pantry, etc.)
- Export as PDF or send via email
- Check off items as purchased
```

---

## 💼 LinkedIn Post

**Post Title:** Built RecipeAI: AI-Powered Recipe Assistant with Next.js & FastAPI

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

Live demo: [your-vercel-url]
GitHub: https://github.com/Giathi-Daniel/RecipeAI---Snap-Scan-Cook

#WebDevelopment #AI #NextJS #FastAPI #FullStack #SoftwareEngineering
```

---

## ✅ Your Action Items

1. **Take 9 screenshots** (see list above)
2. **Create 5 GitHub issues** (copy templates above)
3. **Deploy to Vercel & Render** (follow DEPLOYMENT.md)
4. **Add to portfolio** (with screenshots and live demo link)
5. **Post on LinkedIn** (use template above, add your live URL)
