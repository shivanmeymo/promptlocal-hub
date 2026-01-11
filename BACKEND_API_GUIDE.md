# Backend API Implementation Guide

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                         Frontend                               │
│                                                                 │
│  ┌──────────────┐                                              │
│  │  Firebase    │  User signs in with Google/Email             │
│  │  Auth (UI)   │  Gets Firebase ID token (JWT)                │
│  └──────┬───────┘                                              │
│         │                                                       │
│         │ Firebase ID Token                                    │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────┐             │
│  │  API Client (lib/api-client.ts)              │             │
│  │  - Attaches Firebase token to requests      │             │
│  │  - Calls backend API                         │             │
│  └──────┬───────────────────────────────────────┘             │
└─────────┼─────────────────────────────────────────────────────┘
          │
          │ HTTPS Request: Authorization: Bearer <firebase-token>
          │
┌─────────▼─────────────────────────────────────────────────────┐
│                      Backend API Server                        │
│                                                                 │
│  ┌──────────────────────────────────────────────┐             │
│  │  Auth Middleware                             │             │
│  │  1. Extract Firebase token from header       │             │
│  │  2. Verify using Firebase Admin SDK          │             │
│  │  3. Get/create user in Supabase              │             │
│  │  4. Map firebase_uid → supabase_user_id      │             │
│  └──────┬───────────────────────────────────────┘             │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────┐             │
│  │  Database Operations                         │             │
│  │  - Uses Supabase SERVICE ROLE KEY            │             │
│  │  - Full access to database                   │             │
│  │  - RLS policies enforced by user_id          │             │
│  └──────┬───────────────────────────────────────┘             │
└─────────┼─────────────────────────────────────────────────────┘
          │
          │ Supabase Service Role Key (backend only)
          │
┌─────────▼─────────────────────────────────────────────────────┐
│                     Supabase PostgreSQL                        │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────┐       │
│  │  users                   │  │  events              │       │
│  │  - id (UUID)             │  │  - id (UUID)         │       │
│  │  - firebase_uid          │  │  - user_id (FK)      │       │
│  │  - email                 │  │  - title             │       │
│  │  - display_name          │  │  - description       │       │
│  │  - photo_url             │  │  - status            │       │
│  └──────────────────────────┘  └──────────────────────┘       │
│                                                                 │
│  ⚡ Row Level Security (RLS) enabled on all tables             │
└─────────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd server
npm install
```

### 2. Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file as `server/firebase-service-account.json`

⚠️ **NEVER commit this file to Git!** It's already in `.gitignore`.

### 3. Get Supabase Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **API**
4. Copy the **service_role** key (not the anon key!)

⚠️ **NEVER use this key in the frontend!** It bypasses Row Level Security.

### 4. Configure Backend Environment

Create `server/.env`:

```bash
# Copy example file
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=3001
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Supabase (Service Role Key - BACKEND ONLY)
SUPABASE_URL=https://suueubckrgtiniymoxio.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 5. Update Database Schema

Run the migration to create the new schema:

```bash
# Option 1: Using Supabase CLI
npx supabase db push

# Option 2: Run SQL directly in Supabase Dashboard
# Copy contents of supabase/migrations/20260111_backend_api_schema.sql
# Paste in Supabase Dashboard > SQL Editor > Run
```

This migration:
- Creates `users` table with `firebase_uid` → `id` (UUID) mapping
- Updates `events` table to reference `users.id`
- Adds Row Level Security (RLS) policies
- Adds indexes for performance

### 6. Configure Frontend

Add to frontend `.env`:

```env
# Existing Firebase config stays the same
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# etc.

# NEW: Backend API URL
VITE_API_URL=http://localhost:3001
```

### 7. Start Backend Server

```bash
cd server
npm run dev
```

You should see:

```
═══════════════════════════════════════════════
🚀 NowInTown API Server
═══════════════════════════════════════════════
📡 Server running on: http://localhost:3001
🌍 Environment: development
🔥 Firebase Auth: Enabled
⚡ Supabase DB: Connected
═══════════════════════════════════════════════
```

### 8. Start Frontend

```bash
# In main project directory
npm run dev
```

## Authentication Flow

### How It Works

1. **User Signs In (Frontend)**
   ```typescript
   // User clicks "Sign in with Google"
   await signInWithPopup(auth, googleProvider);
   ```

2. **Firebase Returns Token**
   ```typescript
   const user = auth.currentUser;
   const idToken = await user.getIdToken();
   ```

3. **Frontend Makes API Request**
   ```typescript
   const response = await fetch('http://localhost:3001/api/events', {
     headers: {
       'Authorization': `Bearer ${idToken}`,
       'Content-Type': 'application/json',
     },
   });
   ```

4. **Backend Verifies Token**
   ```typescript
   // middleware/auth.middleware.ts
   const decodedToken = await admin.auth().verifyIdToken(idToken);
   // decodedToken.uid = Firebase UID
   ```

5. **Backend Maps to Supabase User**
   ```typescript
   // services/user.service.ts
   const supabaseUser = await getOrCreateUser({
     firebaseUid: decodedToken.uid,
     email: decodedToken.email,
     displayName: decodedToken.name,
   });
   // supabaseUser.id = UUID
   ```

6. **Backend Performs Database Operation**
   ```typescript
   // routes/events.routes.ts
   const { data } = await supabase
     .from('events')
     .insert({ user_id: supabaseUser.id, ...eventData });
   ```

## API Endpoints

### Public Endpoints (No Auth Required)

```bash
# Health check
GET /api/health

# Get all approved events
GET /api/events

# Get single event
GET /api/events/:id
```

### Protected Endpoints (Auth Required)

```bash
# Get current user's events
GET /api/events/user/me
Authorization: Bearer <firebase-id-token>

# Create new event
POST /api/events
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
{
  "title": "My Event",
  "description": "Event description",
  "start_date": "2024-01-01T10:00:00Z",
  "end_date": "2024-01-01T12:00:00Z",
  "location": "Stockholm",
  "latitude": 59.3293,
  "longitude": 18.0686,
  "category": "music"
}

# Update event (owner only)
PUT /api/events/:id
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
{
  "title": "Updated Title"
}

# Delete event (owner only)
DELETE /api/events/:id
Authorization: Bearer <firebase-id-token>
```

## Frontend Usage Examples

### Create Event

```typescript
import { apiClient } from '@/lib/api-client';

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

if (error) {
  console.error('Failed to create event:', error);
} else {
  console.log('Created event:', data);
}
```

### Get Events

```typescript
// Get all approved events (public)
const { data, error } = await apiClient.events.getAll();

// Get my events (requires authentication)
const { data, error } = await apiClient.events.getMine();
```

### Update Event

```typescript
const { data, error } = await apiClient.events.update(eventId, {
  title: 'Updated Title',
  description: 'Updated description',
});
```

### Delete Event

```typescript
const { data, error } = await apiClient.events.delete(eventId);
```

## Security Features

### Frontend Security

✅ **Firebase ID tokens expire after 1 hour** - automatically refreshed
✅ **Tokens sent in Authorization header** - not in URL or cookies
✅ **No Supabase keys in frontend** - only backend has service role key
✅ **CORS protection** - only allowed origins can access API

### Backend Security

✅ **Firebase Admin SDK verifies tokens** - cryptographic verification
✅ **User mapping prevents impersonation** - firebase_uid locked to UUID
✅ **Service role key in backend only** - never exposed to frontend
✅ **Request validation with Zod** - type-safe input validation

### Database Security

✅ **Row Level Security (RLS) enabled** - defense in depth
✅ **Users table read-only** - only backend can modify
✅ **Events ownership enforced** - users can only modify their events
✅ **Approved events public** - anyone can view approved events

## Testing

### Test Authentication

```bash
# Get Firebase ID token (use browser console)
const user = auth.currentUser;
const token = await user.getIdToken();
console.log(token);
```

### Test API with curl

```bash
# Test public endpoint
curl http://localhost:3001/api/events

# Test protected endpoint
curl -H "Authorization: Bearer <your-firebase-token>" \
     http://localhost:3001/api/events/user/me
```

### Test API with Postman

1. Sign in to your app in browser
2. Open browser console
3. Run: `await auth.currentUser.getIdToken()` - copy token
4. In Postman:
   - Add header: `Authorization: Bearer <token>`
   - Make request to `http://localhost:3001/api/events/user/me`

## Troubleshooting

### "User not authenticated" Error

**Problem:** API client can't get Firebase token

**Solutions:**
1. Make sure user is signed in: `auth.currentUser !== null`
2. Check Firebase is initialized in `src/integrations/firebase/client.ts`
3. Verify user's token hasn't expired (tokens auto-refresh)

### "Invalid or expired token" Error

**Problem:** Backend can't verify Firebase token

**Solutions:**
1. Verify `FIREBASE_SERVICE_ACCOUNT_PATH` is correct
2. Check Firebase project ID matches
3. Try signing out and back in (get fresh token)

### "SUPABASE_SERVICE_ROLE_KEY is required" Error

**Problem:** Backend can't connect to Supabase

**Solutions:**
1. Copy service_role key from Supabase Dashboard > Settings > API
2. Add to `server/.env`
3. Restart backend server

### CORS Errors

**Problem:** Frontend can't access backend API

**Solutions:**
1. Add frontend URL to `ALLOWED_ORIGINS` in `server/.env`
2. Format: `http://localhost:5173` (no trailing slash)
3. Restart backend server

### "Table 'users' does not exist" Error

**Problem:** Database migration not run

**Solutions:**
1. Run migration: `npx supabase db push`
2. Or run SQL manually in Supabase Dashboard
3. Verify tables exist: Check Supabase Dashboard > Table Editor

## Deployment

### Deploy Backend

#### Option 1: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd server
railway up
```

Environment variables needed:
- `PORT` (Railway sets automatically)
- `NODE_ENV=production`
- `FIREBASE_SERVICE_ACCOUNT_PATH` or Firebase credentials
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS` (your production frontend URL)

#### Option 2: Render

1. Connect GitHub repository
2. Create new Web Service
3. Set build command: `cd server && npm install && npm run build`
4. Set start command: `cd server && npm start`
5. Add environment variables (same as above)

#### Option 3: Google Cloud Run

```bash
# Build Docker image
cd server
docker build -t gcr.io/your-project/nowintown-api .

# Push to Google Container Registry
docker push gcr.io/your-project/nowintown-api

# Deploy
gcloud run deploy nowintown-api \
  --image gcr.io/your-project/nowintown-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Update Frontend Configuration

After deploying backend, update frontend `.env.production`:

```env
VITE_API_URL=https://your-backend-url.com
```

## Migration from Current Architecture

### Current State
- ❌ Frontend accesses Supabase directly using anon key
- ❌ No token verification on backend
- ❌ User IDs are Firebase UIDs (strings)

### New State
- ✅ Frontend calls backend API only
- ✅ Backend verifies Firebase tokens
- ✅ Backend uses Supabase service role key
- ✅ User IDs are Supabase UUIDs
- ✅ firebase_uid mapped to UUID

### Migration Steps

1. ✅ **Create backend server** (Done)
2. ✅ **Update database schema** (Run migration)
3. ✅ **Configure environment variables** (Both frontend and backend)
4. ✅ **Start backend server**
5. ✅ **Update frontend adapter to use API client** (Already done in `backend/database.ts`)
6. ⚠️ **Migrate existing data** (If you have existing events)
   ```sql
   -- Run in Supabase Dashboard if you have existing data
   -- This creates users from existing firebase_uids in events table
   -- IMPORTANT: Customize this based on your current schema
   ```
7. ✅ **Test authentication flow**
8. ✅ **Test event creation/updates**
9. ✅ **Deploy backend**
10. ✅ **Update production frontend**

## Benefits of This Architecture

### Security
✅ **No sensitive keys in frontend** - service role key stays on backend
✅ **Token verification** - Firebase Admin SDK cryptographically verifies tokens
✅ **Defense in depth** - RLS + backend authorization
✅ **HTTPS only in production** - TLS encryption for all requests

### Scalability
✅ **Stateless backend** - can scale horizontally
✅ **Connection pooling** - Supabase handles database connections
✅ **Caching friendly** - can add Redis/CDN easily

### Maintainability
✅ **Single source of truth** - backend controls all business logic
✅ **Easy to add features** - add new endpoints without frontend changes
✅ **Testable** - can test API independently
✅ **Clear separation** - frontend = UI, backend = logic, database = storage

### Best Practices
✅ **No Supabase Auth** - avoids dual auth complexity
✅ **No Firestore** - PostgreSQL for relational data
✅ **Single backend layer** - all database access through API
✅ **Production ready** - follows industry standards

## Next Steps

1. **Add more endpoints** - profiles, admin panel, etc.
2. **Add storage API** - image uploads through backend
3. **Add webhooks** - Stripe payments, email notifications
4. **Add rate limiting** - protect against abuse
5. **Add monitoring** - Sentry, Datadog, etc.
6. **Add tests** - Jest for backend, Playwright for E2E

## Support

If you encounter issues:

1. Check backend logs: `npm run dev` output
2. Check frontend console: Browser DevTools
3. Check Supabase logs: Dashboard > Logs
4. Check Firebase logs: Console > Authentication

## Summary

✅ Firebase: Authentication ONLY (frontend)
✅ Backend API: Token verification + database operations
✅ Supabase: Database ONLY (backend access)
✅ No Supabase Auth, No Firestore
✅ RLS enabled for defense in depth
✅ Production-ready security
