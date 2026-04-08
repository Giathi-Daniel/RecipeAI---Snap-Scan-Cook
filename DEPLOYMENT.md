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