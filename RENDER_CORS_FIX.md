# URGENT: Update Render Environment Variables

## Issue
CORS is blocking requests from Vercel frontend to Render backend.

## Solution
Add the following environment variable to your Render backend service:

### Go to Render Dashboard
1. Navigate to: https://dashboard.render.com/
2. Select your backend service: `recipeai-snap-scan-cook`
3. Go to "Environment" tab
4. Add new environment variable:

**Key:** `CORS_ORIGINS`
**Value:** `http://localhost:3000,https://recipe-ai-snap.vercel.app`

5. Click "Save Changes"
6. Render will automatically redeploy with the new CORS settings

## Verification
After redeployment, test:
- Creating a collection from https://recipe-ai-snap.vercel.app/upload
- Saving a recipe from https://recipe-ai-snap.vercel.app/upload
- Loading collections on dashboard

The CORS errors should be resolved.
