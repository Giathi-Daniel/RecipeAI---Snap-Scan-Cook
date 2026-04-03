# 🛣️ RecipeAI — 2-Week Build Roadmap

> **Goal:** Build, deploy, and polish a full-stack AI-powered recipe app in 14 days.
> **Stack:** Next.js · FastAPI · Gemini AI · Google Vision · Supabase · Vercel · Render

---

## Week 1 — Foundation & Core AI Features

---

### Day 1 — Project Setup & Repo Structure
**Goal:** Everything scaffolded. Zero ambiguity on Day 2.

- [x] Create GitHub repo, add `.gitignore`, `README.md`, `LICENSE`
- [x] Scaffold `frontend/` with `create-next-app` style structure (App Router, Tailwind CSS)
- [x] Scaffold `backend/` with FastAPI + folder structure (`routers/`, `services/`, `models/`)
- [x] Create `supabase/migrations/` folder and write initial SQL schema
- [x] Set up `.env.example` with all required keys listed
- [x] Verify the frontend and backend startup paths are healthy (`npm run build` passed; FastAPI app imports and routes load cleanly; direct port binding is blocked in the sandbox)
- [x] Push initial commit to GitHub

**Deliverable:** Clean repo, both servers running locally, no errors.

**Status:** Day 1 is complete. The scaffold is committed and pushed on `project-setup`.

---

### Day 2 — Supabase Auth (Sign Up / Login)
**Goal:** Users can create accounts and log in.

- [x] Create Supabase project, copy credentials to `.env`
- [x] Install `@supabase/supabase-js` and `@supabase/ssr` in frontend
- [x] Build `/app/(auth)/login/page.tsx` — email/password login form
- [x] Build `/app/(auth)/signup/page.tsx` — sign up form
- [x] Set up Supabase middleware for session management (`middleware.ts`)
- [x] Protect `/dashboard` route — redirect to `/login` if unauthenticated
- [x] Test: sign up → verify email → log in → reach dashboard
- [x] In FastAPI: add JWT verification middleware using Supabase secret

**Deliverable:** Working auth flow end-to-end.

**Status:** Day 2 is complete. Supabase auth is wired end-to-end across Next.js and FastAPI.

---

### Day 3 — Database Schema & Supabase Tables
**Goal:** All tables created. Backend can read/write data.

- [x] Run migration SQL in Supabase dashboard: `recipes`, `saved_recipes` tables
- [x] Enable Row Level Security (RLS) on both tables
- [x] Write RLS policies: users can only read/write their own recipes
- [x] In FastAPI: create `Recipe` Pydantic model matching DB schema
- [x] Write a test FastAPI route `POST /api/recipes/save` that inserts a dummy recipe
- [x] Test: call endpoint → verify row appears in Supabase dashboard
- [x] Commit all migration files to `supabase/migrations/`

**Deliverable:** DB live, RLS working, backend can write to Supabase.

**Status:** Day 3 is complete. DB is connected, implemented RLS and ensured we can read from the database.

---

### Day 4 — Recipe Text Parser (Core AI Feature)
**Goal:** Paste any recipe text → get back clean structured JSON.

- [x] Get Gemini API key from [Google AI Studio](https://aistudio.google.com) (free)
- [x] Install `google-generativeai` Python package
- [x] Write `services/gemini_service.py` with a `parse_recipe(text: str)` function
- [x] Craft a solid system prompt that instructs Gemini to return JSON with: `title`, `description`, `ingredients[]`, `steps[]`, `servings`, `tags[]`
- [x] Add error handling for malformed Gemini responses
- [x] Create `POST /api/recipes/parse` FastAPI route
- [ ] Test with the braised chicken recipe text — verify clean JSON output
- [x] Log input/output for debugging

**Deliverable:** `/api/recipes/parse` returns clean structured recipe JSON.

**Status:** Day 4 backend implementation is complete. Live Gemini output verification is the only remaining check and depends on your local configured API key.

---

### Day 5 — Upload & Parse UI (Frontend)
**Goal:** Users can paste recipe text in the UI and see a parsed result.

- [x] Build `/app/upload/page.tsx` with a textarea for pasting recipes
- [x] Add a "Parse Recipe" button that calls the FastAPI endpoint
- [x] Show a loading spinner while AI processes
- [x] Display the parsed result in a clean `RecipeCard` component
- [x] Show: title, description, ingredient list, step-by-step instructions
- [x] Add a "Save Recipe" button (stores to Supabase via API)
- [x] Handle error states (empty input, API failure)

**Deliverable:** Full paste → parse → display → save flow working in browser.

**Status:** Day 5 is complete. The upload workspace now supports parse, structured preview, authenticated save, loading feedback, and browser-side error handling.

---

### Day 6 — Image Recognition Flow
**Goal:** Upload a food photo → AI identifies the dish → generates a recipe.

- [ ] Enable Google Cloud Vision API in Google Cloud Console
- [ ] Download service account credentials JSON, add to `.env`
- [ ] Install `google-cloud-vision` Python package
- [ ] Write `services/vision_service.py` with `identify_dish(image_bytes)` function
- [ ] Extract top 3–5 label annotations from Vision API response
- [ ] Pass top labels to Gemini: "Generate a recipe for [dish name]"
- [ ] Create `POST /api/vision/identify` FastAPI route (accepts image upload)
- [ ] In frontend: add image upload input on `/app/upload/page.tsx`
- [ ] Show image preview before submitting
- [ ] On submit: call vision endpoint → show generated recipe

**Deliverable:** Upload a food photo → get a recipe. Works end-to-end.

---

### Day 7 — Review, Test & Fix Week 1 Bugs
**Goal:** Everything from Days 1–6 is solid before building more features.

- [ ] Manual test the full user flow: sign up → login → paste recipe → save → upload image → save
- [ ] Fix any broken API calls, UI glitches, or auth edge cases
- [ ] Add basic input validation (empty fields, invalid image types, oversized files)
- [ ] Check mobile responsiveness of all pages built so far
- [ ] Write a short `PROGRESS.md` entry summarizing what's done
- [ ] Push clean, well-commented code to GitHub
- [ ] Optional: deploy backend to Render (just to test it works — not final)

**Deliverable:** Week 1 features stable, tested, and pushed.

---

## Week 2 — Advanced Features, Polish & Deployment

---

### Day 8 — Serving Scaler
**Goal:** Users can adjust servings and all quantities scale in real time.

- [ ] In FastAPI: add serving scaling logic to `recipes.py` — multiply all ingredient quantities by `(new_servings / original_servings)`
- [ ] Handle mixed units (e.g. "2 tbsp", "1/2 cup", "3 medium carrots")
- [ ] Create `ServingScaler` React component with +/− buttons
- [ ] Wire up to recipe state in frontend — update quantities live (no page reload)
- [ ] Test with fractions and non-numeric quantities (e.g. "a pinch of salt")

**Deliverable:** Serving scaler works live in the recipe view.

---

### Day 9 — Nutritional Analysis
**Goal:** Each recipe shows calories, macros, and dietary flags.

- [ ] Use Gemini to estimate nutrition per serving (prompt: "Estimate calories, protein, carbs, fat for this recipe per serving. Return JSON only.")
- [ ] Add `nutrition` field to recipe Pydantic model and DB schema
- [ ] Store nutrition data when recipe is saved
- [ ] Build `NutritionBadge` component showing: Calories · Protein · Carbs · Fat
- [ ] Add dietary tag badges: Gluten-Free, Dairy-Free, High-Protein, Vegetarian, etc.
- [ ] Show nutrition section on single recipe page

**Deliverable:** Recipe pages show estimated nutritional info and dietary tags.

---

### Day 10 — Ingredient Substitution & Localization
**Goal:** Two AI-powered helper features that make the app stand out.

**Substitution:**
- [ ] Add a "Substitute" button next to each ingredient in the recipe view
- [ ] On click: call `POST /api/recipes/substitute` with the ingredient + dish context
- [ ] Show 2–3 substitution options in a small modal/dropdown

**Localization:**
- [ ] Add a "Localize Recipe" button on the recipe page
- [ ] Show a dropdown: Kenya · Nigeria · India · Mexico · UK · etc.
- [ ] On select: call `POST /api/recipes/localize` → Gemini adapts the recipe
- [ ] Display adapted version with a "Localized for [region]" badge

**Deliverable:** Both features working and visually polished.

---

### Day 11 — User Dashboard (Saved Recipes)
**Goal:** Users have a personal space to browse all their saved recipes.

- [ ] Build `/app/dashboard/page.tsx` — grid of saved recipe cards
- [ ] Each card shows: image/thumbnail, title, servings, dietary tags, date saved
- [ ] Add a search/filter bar (by tag, ingredient, or title)
- [ ] Add delete functionality (remove recipe from saved list)
- [ ] Handle empty state: "You haven't saved any recipes yet — try uploading one!"
- [ ] Make the dashboard the redirect target after login

**Deliverable:** Dashboard is functional, clean, and useful.

---

### Day 12 — Single Recipe Page & Sharing
**Goal:** Each recipe has its own polished page and can be shared.

- [ ] Build `/app/recipe/[id]/page.tsx`
- [ ] Show: hero image, title, description, nutrition badges, ingredients with scaler, step-by-step instructions, tags
- [ ] Add "Copy Link" share button (generates a public URL for the recipe)
- [ ] For public recipes: no auth required to view (update RLS policy)
- [ ] Add print-friendly CSS for the recipe page
- [ ] Smooth scroll between ingredients and steps sections

**Deliverable:** Every recipe has a clean, shareable, printable page.

---

### Day 13 — Full Deployment
**Goal:** App is live on the internet. Both frontend and backend deployed.

**Backend → Render:**
- [ ] Push `backend/` to GitHub
- [ ] Create Render Web Service, connect repo
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `uvicorn main:app --host 0.0.0.0 --port 10000`
- [ ] Add all environment variables in Render dashboard
- [ ] Test live API: hit `https://your-app.onrender.com/docs`

**Frontend → Vercel:**
- [ ] Connect GitHub repo to Vercel
- [ ] Set root directory to `frontend/`
- [ ] Add all `NEXT_PUBLIC_*` environment variables
- [ ] Set `BACKEND_URL` to your live Render URL
- [ ] Trigger deploy, verify all pages load

- [ ] Test full user flow on production URL
- [ ] Fix any environment-specific bugs

**Deliverable:** App fully live at a public URL.

---

### Day 14 — Polish, README & Portfolio Prep
**Goal:** App looks portfolio-ready. You can demo it confidently in interviews.

- [ ] Add a proper landing page (`/app/page.tsx`) with hero, features section, and CTA
- [ ] Take screenshots of all key pages — add to `README.md`
- [ ] Record a short Loom/screen demo video (2–3 min walkthrough)
- [ ] Final README pass: ensure all sections are accurate and complete
- [ ] Add the project to your LinkedIn with the live URL and demo video
- [ ] Add to your portfolio/CV under "Projects"
- [ ] Open a few GitHub Issues for future features (shows active development mindset)
- [ ] Share on LinkedIn with a post about what you built and learned

**Deliverable:** Polished, deployed, documented project ready for job applications.

---

## Summary Table

| Day | Focus | Key Output |
|---|---|---|
| 1 | Setup & scaffolding | Both servers running |
| 2 | Supabase Auth | Login/signup working |
| 3 | Database schema | Tables live, RLS set |
| 4 | Recipe text parser | AI parsing working |
| 5 | Upload & parse UI | Frontend flow complete |
| 6 | Image recognition | Photo → recipe working |
| 7 | Testing & fixes | Week 1 stable |
| 8 | Serving scaler | Live quantity updates |
| 9 | Nutritional analysis | Macros + dietary tags |
| 10 | Substitution & localize | Two AI helper features |
| 11 | User dashboard | Saved recipes grid |
| 12 | Recipe page & sharing | Public shareable pages |
| 13 | Full deployment | App live on the web |
| 14 | Polish & portfolio prep | Interview-ready project |

<!-- --- -->

<!-- ## Tips for Staying on Track

- **Timebox each day to 3–5 hours.** Don't gold-plate — ship and move on.
- **Commit every day.** Green squares on GitHub matter to hiring managers.
- **When stuck on AI prompts:** iterate in Google AI Studio's playground before hardcoding.
- **When stuck on bugs:** spend max 30 min, then move to the next task and return.
- **Use Postman or the FastAPI `/docs` UI** to test every endpoint before wiring frontend.
- **Write short commit messages that say what you built**, e.g. `feat: add recipe text parser endpoint` -->

<!-- --- -->

<!-- *Built with ❤️ in 14 days.* -->
