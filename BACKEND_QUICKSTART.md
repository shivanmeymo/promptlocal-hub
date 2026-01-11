# Quick Start: Backend API Setup

## TL;DR

```bash
# 1. Install backend dependencies
cd server
npm install

# 2. Get Firebase service account JSON from Firebase Console
# Save as server/firebase-service-account.json

# 3. Get Supabase service role key from Supabase Dashboard

# 4. Create server/.env
cp server/.env.example server/.env
# Edit server/.env with your keys

# 5. Run database migration
npx supabase db push
# Or run supabase/migrations/20260111_backend_api_schema.sql in Supabase Dashboard

# 6. Add to frontend .env
echo "VITE_API_URL=http://localhost:3001" >> .env

# 7. Start backend
cd server
npm run dev

# 8. Start frontend (in another terminal)
cd ..
npm run dev
```

## What Changed?

### Before
```typescript
// Frontend directly accessed Supabase
const { data } = await supabase
  .from('events')
  .insert({ ...eventData });
```

### After
```typescript
// Frontend calls backend API
const { data } = await apiClient.events.create(eventData);
// Backend verifies Firebase token
// Backend uses Supabase service role key
```

## Architecture

```
Frontend (Firebase Auth) → Backend API (Token Verification) → Supabase (Database)
```

✅ Firebase: Authentication ONLY
✅ Backend: Verifies tokens + manages database
✅ Supabase: Database ONLY (no Supabase Auth)

## Full Documentation

See [BACKEND_API_GUIDE.md](./BACKEND_API_GUIDE.md) for complete setup instructions.
