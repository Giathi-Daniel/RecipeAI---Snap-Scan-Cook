# Progress

## Week 1 Snapshot

- Day 1 completed the repo scaffold for Next.js, FastAPI, Supabase migrations, and environment setup.
- Day 2 completed Supabase auth across frontend and backend JWT verification.
- Day 3 completed the recipe and saved recipe schema, RLS policies, and Supabase write flow.
- Day 4 completed Gemini-powered recipe text parsing, with live verification still dependent on your configured Gemini key.
- Day 5 completed the paste-to-parse-to-save browser flow with structured preview and authenticated recipe saves.
- Day 6 completed the image upload flow from photo preview to Vision label extraction to Gemini recipe generation. Live provider verification currently stops at Google Cloud Vision billing being disabled on the configured project.

## Day 7 Stabilization

- Added backend unit and route tests for auth, Gemini JSON handling, Vision helpers, and API route contracts.
- Added frontend unit tests for upload validation rules and shared file-size/type guards.
- Tightened upload validation for empty text, invalid file types, and oversized image uploads.
- Re-verified the frontend production build and backend Python compilation after the Day 7 changes.

## Week 2 Snapshot

- Day 8 completed live serving scaling from the single recipe view through the FastAPI scaling endpoint.
- Day 9 completed nutrition estimation and presentation: Gemini now estimates per-serving calories and macros during save, Supabase persists the nutrition payload, and the recipe detail page renders live nutrition badges plus dietary flags.
