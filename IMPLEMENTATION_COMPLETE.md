# Backend API Implementation Summary

## ✅ Implementation Complete

I've implemented a complete backend API layer that follows your exact requirements:

### Architecture

```
┌─────────────┐
│  Frontend   │  Firebase Auth (Google OAuth, Email/Password)
│             │  Gets Firebase ID token (JWT)
└──────┬──────┘
       │
       │ Authorization: Bearer <firebase-token>
       ▼
┌─────────────┐
│ Backend API │  1. Verifies Firebase token with Admin SDK
│             │  2. Maps firebase_uid → supabase_user_id (UUID)
│             │  3. Uses Supabase SERVICE ROLE KEY
│             │  4. Performs database operations
└──────┬──────┘
       │
       │ Service Role Key (backend only)
       ▼
┌─────────────┐
│  Supabase   │  PostgreSQL with Row Level Security (RLS)
│  Database   │  users table: id (UUID), firebase_uid
│             │  events table: references users.id
└─────────────┘
```

### Key Features

✅ **Firebase Authentication ONLY** - No Firestore, no Firebase Database
✅ **Supabase Database ONLY** - No Supabase Auth
✅ **Single Backend Layer** - All database access through API
✅ **Token Verification** - Firebase Admin SDK verifies JWT tokens
✅ **User Mapping** - Automatic firebase_uid → UUID conversion
✅ **Row Level Security** - Defense in depth with RLS policies
✅ **Production Security** - Service role key never exposed to frontend

## What Was Created

### Backend Server (`server/`)

1. **Configuration** (`src/config/index.ts`)
   - Environment variable validation
   - Firebase & Supabase configuration

2. **Services**
   - `firebase.service.ts` - Firebase Admin SDK token verification
   - `supabase.service.ts` - Supabase client with service role key
   - `user.service.ts` - User mapping (firebase_uid → UUID)

3. **Middleware** (`src/middleware/auth.middleware.ts`)
   - Extract Firebase token from Authorization header
   - Verify token using Firebase Admin SDK
   - Get or create Supabase user
   - Attach user context to request

4. **Routes** (`src/routes/`)
   - `events.routes.ts` - Full CRUD for events
   - Authentication enforced on protected endpoints
   - Request validation with Zod schemas

5. **Server** (`src/server.ts`)
   - Express app with CORS, Helmet, Morgan
   - Error handling
   - API documentation

### Database Migration

**File:** `supabase/migrations/20260111_backend_api_schema.sql`

Creates:
- `users` table with `firebase_uid` → `id` (UUID) mapping
- `events` table referencing `users.id` (not firebase_uid)
- `admin_roles` table for authorization
- RLS policies on all tables
- Indexes for performance
- Triggers for `updated_at` columns

### Frontend Updates

1. **API Client** (`src/lib/api-client.ts`)
   - Single source for all backend communication
   - Automatically attaches Firebase token
   - Type-safe API methods

2. **Backend Adapter** (`src/adapters/backend/database.ts`)
   - Implements `IDatabaseAdapter` interface
   - Uses API client instead of direct Supabase

3. **Configuration** (`src/config/backend.ts`)
   - Updated to use `'backend-api'` provider
   - API URL configuration

### Documentation

1. **BACKEND_API_GUIDE.md** - 400+ lines
   - Complete setup instructions
   - Architecture diagrams
   - API endpoint documentation
   - Security features
   - Testing guide
   - Deployment instructions

2. **BACKEND_QUICKSTART.md**
   - TL;DR setup guide
   - Quick commands

3. **Environment Examples**
   - `server/.env.example` - Backend configuration
   - `.env.backend` - Frontend API URL

## Setup Instructions (Quick)

```bash
# 1. Install backend dependencies
cd server
npm install

# 2. Download Firebase service account JSON
# Go to Firebase Console > Project Settings > Service Accounts
# Save as: server/firebase-service-account.json

# 3. Get Supabase service role key
# Go to Supabase Dashboard > Settings > API
# Copy service_role key

# 4. Configure backend
cp server/.env.example server/.env
# Edit server/.env with your keys

# 5. Run database migration
npx supabase db push

# 6. Configure frontend
echo "VITE_API_URL=http://localhost:3001" >> .env

# 7. Start backend (terminal 1)
cd server
npm run dev

# 8. Start frontend (terminal 2)
cd ..
npm run dev
```

## API Endpoints

### Public
- `GET /api/health` - Health check
- `GET /api/events` - List approved events
- `GET /api/events/:id` - Get single event

### Protected (requires Firebase token)
- `GET /api/events/user/me` - Get user's events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event (owner only)
- `DELETE /api/events/:id` - Delete event (owner only)

## Frontend Usage Example

```typescript
import { apiClient } from '@/lib/api-client';

// User signs in with Firebase (existing code)
await signInWithPopup(auth, googleProvider);

// Create event through backend API
const { data, error } = await apiClient.events.create({
  title: 'My Event',
  description: 'Event description',
  start_date: '2024-01-01T10:00:00Z',
  end_date: '2024-01-01T12:00:00Z',
  location: 'Stockholm',
  latitude: 59.3293,
  longitude: 18.0686,
  category: 'music',
});

// API client automatically:
// 1. Gets Firebase ID token from current user
// 2. Adds Authorization header
// 3. Makes request to backend
// 4. Backend verifies token
// 5. Backend creates event in Supabase
```

## Security Implementation

### What Prevents Unauthorized Access

1. **Frontend → Backend**
   - Firebase ID token required
   - Token expires after 1 hour
   - Sent in Authorization header (not URL/cookies)

2. **Backend Verification**
   - Firebase Admin SDK cryptographically verifies token
   - Checks signature, expiration, audience
   - Cannot be forged

3. **User Mapping**
   - `firebase_uid` locked to single UUID
   - First login creates user record
   - Subsequent logins return same UUID
   - Cannot impersonate other users

4. **Database Access**
   - Frontend has NO Supabase keys
   - Backend uses service role key
   - RLS enabled (defense in depth)
   - All events linked to user UUID

5. **Ownership Enforcement**
   - Backend checks `user_id` on updates/deletes
   - Returns 403 if not owner
   - Cannot modify other users' events

## Differences from Current Architecture

### Before (Direct Access)
```typescript
// ❌ Frontend had Supabase anon key
import { supabase } from '@/integrations/supabase/client';

// ❌ Direct database access from frontend
const { data } = await supabase
  .from('events')
  .insert({ ...eventData });

// ❌ Problems:
// - Anon key exposed in frontend bundle
// - RLS policies can be complex
// - No centralized business logic
// - Difficult to add features
```

### After (Backend API)
```typescript
// ✅ Frontend has NO Supabase keys
import { apiClient } from '@/lib/api-client';

// ✅ All operations through backend
const { data } = await apiClient.events.create(eventData);

// ✅ Benefits:
// - Service role key only on backend
// - Token verification guaranteed
// - Centralized business logic
// - Easy to add features (just add endpoints)
// - Can add rate limiting, webhooks, etc.
```

## Database Schema Changes

### Old Schema
```sql
events (
  id UUID,
  organizer_id TEXT,  -- Firebase UID (string)
  ...
)
```

### New Schema
```sql
users (
  id UUID PRIMARY KEY,           -- Supabase UUID
  firebase_uid TEXT UNIQUE,      -- Firebase UID
  email TEXT,
  display_name TEXT,
  ...
)

events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),  -- UUID foreign key
  ...
)
```

**Migration:** Run `supabase/migrations/20260111_backend_api_schema.sql`

## Testing

### Test Backend
```bash
cd server
npm run dev

# Should see:
# ✅ Firebase Admin SDK initialized
# ✅ Supabase client initialized
# 📡 Server running on: http://localhost:3001
```

### Test Authentication
1. Sign in to frontend (Firebase Auth)
2. Open browser console
3. Run: `await auth.currentUser.getIdToken()`
4. Copy token
5. Test with curl:
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/api/events/user/me
```

### Test API Client
```typescript
// In browser console after signing in
const { data, error } = await apiClient.events.getMine();
console.log(data); // Your events
```

## Deployment

### Backend Deployment Options

1. **Railway** (Recommended)
   ```bash
   cd server
   railway up
   ```

2. **Render**
   - Connect GitHub repo
   - Build: `cd server && npm install && npm run build`
   - Start: `cd server && npm start`

3. **Google Cloud Run**
   ```bash
   gcloud run deploy nowintown-api \
     --source server \
     --region us-central1
   ```

### Environment Variables (Production)
- `FIREBASE_SERVICE_ACCOUNT_PATH` or individual credentials
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS` (your frontend URL)
- `NODE_ENV=production`

### Frontend Update
```env
# .env.production
VITE_API_URL=https://your-backend-url.com
```

## Files Created

### Backend
- `server/package.json` - Dependencies (Express, Firebase Admin, Zod)
- `server/tsconfig.json` - TypeScript configuration
- `server/.env.example` - Environment template
- `server/.gitignore` - Git ignore (includes service account JSON!)
- `server/src/config/index.ts` - Configuration validation
- `server/src/services/firebase.service.ts` - Firebase Admin SDK
- `server/src/services/supabase.service.ts` - Supabase client
- `server/src/services/user.service.ts` - User mapping
- `server/src/middleware/auth.middleware.ts` - Authentication
- `server/src/routes/events.routes.ts` - Event CRUD endpoints
- `server/src/routes/index.ts` - Route aggregation
- `server/src/server.ts` - Express app

### Frontend
- `src/lib/api-client.ts` - Backend API client
- `src/adapters/backend/database.ts` - Backend database adapter
- `src/config/backend.ts` - Updated configuration
- `src/adapters/factory.ts` - Updated factory

### Database
- `supabase/migrations/20260111_backend_api_schema.sql` - Schema migration

### Documentation
- `BACKEND_API_GUIDE.md` - Complete guide (400+ lines)
- `BACKEND_QUICKSTART.md` - Quick start
- `.env.backend` - Frontend environment variables

## Constraints Met

✅ **Firebase for authentication ONLY** - No Firestore, no Firebase Database
✅ **Supabase for database ONLY** - No Supabase Auth
✅ **No Supabase Realtime** - Not implemented (can be added later)
✅ **Frontend never writes directly** - All through backend API
✅ **Single backend layer** - Express API server
✅ **Firebase JWT verification** - Firebase Admin SDK
✅ **User mapping** - `firebase_uid` → UUID
✅ **Service keys backend only** - Frontend has no Supabase keys
✅ **Production security** - RLS + token verification
✅ **No duplicated auth** - Firebase Auth only
✅ **No bidirectional sync** - One-way: Firebase Auth → Backend → Supabase

## Next Steps

1. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Get credentials**
   - Download Firebase service account JSON
   - Copy Supabase service role key

3. **Configure environment**
   - Create `server/.env` from `server/.env.example`
   - Add `VITE_API_URL=http://localhost:3001` to frontend `.env`

4. **Run migration**
   ```bash
   npx supabase db push
   ```

5. **Start servers**
   ```bash
   # Terminal 1
   cd server && npm run dev
   
   # Terminal 2
   npm run dev
   ```

6. **Test**
   - Sign in with Firebase
   - Create an event
   - Verify it's stored in Supabase

7. **Deploy**
   - Deploy backend to Railway/Render/Cloud Run
   - Update frontend `VITE_API_URL`
   - Deploy frontend

## Support

- **Full Guide:** [BACKEND_API_GUIDE.md](./BACKEND_API_GUIDE.md)
- **Quick Start:** [BACKEND_QUICKSTART.md](./BACKEND_QUICKSTART.md)
- **Migration SQL:** [supabase/migrations/20260111_backend_api_schema.sql](./supabase/migrations/20260111_backend_api_schema.sql)

All code is committed and pushed to GitHub! 🚀
